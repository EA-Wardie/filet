import { type Dirent, existsSync, readdir } from "node:fs";
import { cp, mkdir, rename as renameEntry, rm } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { extname } from "node:path/win32";
import type { Subprocess } from "bun";
import { trashPath } from "./config";
import { FILE_ICON, FILETYPE_ICONS, FOLDER_ICON } from "./consts";
import { ctx } from "./context";
import { getDirentPath } from "./navigation";
import {
	$copyDirent,
	$currentPath,
	$cutDirent,
	$tasksCount,
	$trashFull,
} from "./store";

export function getFileIcon(dirent: Dirent): string {
	if (dirent.isDirectory()) {
		return FOLDER_ICON;
	}

	return (
		FILETYPE_ICONS.get(extname(getDirentPath(dirent).toLowerCase())) ??
		FILE_ICON
	);
}

async function copyDirent(dirent: Dirent, toPath: string): Promise<void> {
	const fromPath: string | null = getDirentPath(dirent);

	if (dirent.isDirectory()) {
		await cp(fromPath, toPath, { recursive: true });

		return;
	}

	await Bun.write(toPath, Bun.file(fromPath));
}

async function removeDirent(dirent: Dirent): Promise<void> {
	const path: string | null = getDirentPath(dirent);

	if (dirent.isDirectory()) {
		await rm(path, { recursive: true, force: true });

		return;
	}

	await Bun.file(path).delete();
}

async function moveDirent(dirent: Dirent, toPath: string): Promise<void> {
	try {
		await renameEntry(getDirentPath(dirent), toPath);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== "EXDEV") {
			throw error;
		}

		await copyDirent(dirent, toPath);
		await removeDirent(dirent);
	}
}

export function copy(dirent: Dirent): void {
	ctx.copyToClipboardOSC52(getDirentPath(dirent));

	$cutDirent.set(null);
	$copyDirent.set(dirent);
}

export function cut(dirent: Dirent): void {
	ctx.copyToClipboardOSC52(getDirentPath(dirent));

	$copyDirent.set(null);
	$cutDirent.set(dirent);
}

export async function paste(): Promise<void> {
	const dirent: Dirent | null = $copyDirent.get() ?? $cutDirent.get();

	if (!dirent) {
		return;
	}

	const fromPath: string = getDirentPath(dirent);
	const toPath: string = join($currentPath.get(), basename(fromPath));
	const isCutting: boolean = !$copyDirent.get();

	if (toPath === fromPath) {
		return;
	}

	if (existsSync(toPath)) {
		console.warn(`Cannot paste, ${toPath} already exists.`);

		return;
	}

	$tasksCount.set($tasksCount.get() + 1);

	try {
		if (isCutting) {
			await moveDirent(dirent, toPath);

			$cutDirent.set(null);
		} else {
			await copyDirent(dirent, toPath);

			$copyDirent.set(null);
		}
	} catch (error) {
		console.warn(error);
	} finally {
		$currentPath.notify();

		setTimeout((): void => {
			$tasksCount.set($tasksCount.get() - 1);
		}, 1000);
	}
}

export function createFile(name: string): void {
	const path: string = join($currentPath.get(), name);

	Bun.write(path, "")
		.then((): void => {
			$currentPath.notify();
		})
		.catch((error: Error): void => {
			console.warn(error);
		});
}

export function createFolder(name: string): void {
	const path: string = join($currentPath.get(), name);

	mkdir(path)
		.then((): void => {
			$currentPath.notify();
		})
		.catch((error: Error): void => {
			console.warn(error);
		});
}

export async function rename(dirent: Dirent, name: string): Promise<void> {
	const fromPath: string = getDirentPath(dirent);
	const toPath: string = join(dirent.parentPath, name);

	$tasksCount.set($tasksCount.get() + 1);

	try {
		await renameEntry(fromPath, toPath);

		$currentPath.notify();
	} catch (error) {
		console.warn(error);
	} finally {
		setTimeout((): void => {
			$tasksCount.set($tasksCount.get() - 1);
		}, 1000);
	}
}

export async function remove(dirent: Dirent): Promise<void> {
	$tasksCount.set($tasksCount.get() + 1);

	try {
		await removeDirent(dirent);

		$currentPath.notify();
	} catch (error) {
		console.warn(error);
	} finally {
		setTimeout((): void => {
			$tasksCount.set($tasksCount.get() - 1);
		}, 1000);
	}
}

async function writeTrashInfo(path: string): Promise<void> {
	const filename: string = `${basename(path)}.trashinfo`;

	const content: string = [
		"[Trash Info]",
		`Path=${encodeURI(path)}`,
		`DeletionDate=${new Date().toISOString()}`,
		"",
	].join("\n");

	await Bun.write(`${trashPath}/info/${filename}`, content);
}

async function readTrashInfoPath(name: string): Promise<string> {
	const content: string = await Bun.file(
		`${trashPath}/info/${name}.trashinfo`,
	).text();

	const pathLine: string | undefined = content
		.split("\n")
		.find((line: string): boolean => line.startsWith("Path="));

	if (!pathLine) {
		throw new Error(`No Path entry in ${name}.trashinfo`);
	}

	return decodeURIComponent(pathLine.slice("Path=".length).trim());
}

export function checkTrash(): void {
	readdir(
		`${trashPath}/files`,
		(error: NodeJS.ErrnoException | null, files: string[]) => {
			if (error) {
				return;
			}

			$trashFull.set(files.length > 0);
		},
	);
}

export async function moveToTrash(dirent: Dirent): Promise<void> {
	const fromPath: string = getDirentPath(dirent);

	$tasksCount.set($tasksCount.get() + 1);

	try {
		await writeTrashInfo(fromPath);
		await moveDirent(dirent, `${trashPath}/files/${dirent.name}`);

		$trashFull.set(true);
		$currentPath.notify();
	} catch (error) {
		console.warn(error);
	} finally {
		setTimeout((): void => {
			$tasksCount.set($tasksCount.get() - 1);
		}, 1000);
	}
}

export async function restoreFromTrash(dirent: Dirent): Promise<void> {
	$tasksCount.set($tasksCount.get() + 1);

	try {
		const toPath: string = await readTrashInfoPath(dirent.name);

		if (existsSync(toPath)) {
			throw new Error(`Cannot restore, ${toPath} already exists.`);
		}

		await mkdir(dirname(toPath), { recursive: true });
		await copyDirent(dirent, toPath);
		await Promise.all([
			removeDirent(dirent),
			rm(`${trashPath}/info/${dirent.name}.trashinfo`, { force: true }),
		]);

		checkTrash();

		$currentPath.notify();
	} catch (error) {
		console.warn(error);
	} finally {
		setTimeout((): void => {
			$tasksCount.set($tasksCount.get() - 1);
		}, 1000);
	}
}

export async function emptyTrash(): Promise<void> {
	$tasksCount.set($tasksCount.get() + 1);

	try {
		await Promise.all([
			rm(`${trashPath}/files`, { recursive: true, force: true }),
			rm(`${trashPath}/info`, { recursive: true, force: true }),
		]);

		await Promise.all([
			mkdir(`${trashPath}/files`, { recursive: true }),
			mkdir(`${trashPath}/info`, { recursive: true }),
		]);

		$trashFull.set(false);
		$currentPath.notify();
	} catch (error) {
		console.warn(error);
	} finally {
		setTimeout((): void => {
			$tasksCount.set($tasksCount.get() - 1);
		}, 1000);
	}
}

let currentRipdrag: Subprocess | null = null;

export function dragOut(dirent: Dirent): void {
	currentRipdrag?.kill();

	try {
		const process: Subprocess = Bun.spawn(
			[
				"ripdrag",
				"--all-compact",
				"--no-click",
				"--basename",
				"--and-exit",
				getDirentPath(dirent),
			],
			{
				stdin: "ignore",
				stdout: "ignore",
				stderr: "ignore",
			},
		);

		currentRipdrag = process;

		process.exited.then((): void => {
			if (currentRipdrag === process) {
				currentRipdrag = null;
			}
		});
	} catch (error) {
		console.warn(error);
	}
}
