import { type Dirent, existsSync, readdir } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { basename, dirname } from "node:path";
import { trashFilesPath, trashInfoPath } from "./config";
import { copyDirent, eachDirent, moveDirent, removeDirent } from "./filesystem";
import { getDirentPath } from "./navigation";
import { $trashFull } from "./store";
import { runTask } from "./tasks";

function trashInfoFile(name: string): string {
	return `${trashInfoPath}/${name}.trashinfo`;
}

function removeTrashInfo(name: string): Promise<void> {
	return rm(trashInfoFile(name), { force: true });
}

async function writeTrashInfo(path: string): Promise<void> {
	const content: string = [
		"[Trash Info]",
		`Path=${encodeURI(path)}`,
		`DeletionDate=${new Date().toISOString()}`,
		"",
	].join("\n");

	await Bun.write(trashInfoFile(basename(path)), content);
}

async function readTrashInfoPath(name: string): Promise<string> {
	const content: string = await Bun.file(trashInfoFile(name)).text();

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
		trashFilesPath,
		(error: NodeJS.ErrnoException | null, files: string[]) => {
			if (error) {
				return;
			}

			$trashFull.set(files.length > 0);
		},
	);
}

async function trashDirent(dirent: Dirent): Promise<void> {
	await writeTrashInfo(getDirentPath(dirent));

	try {
		await moveDirent(dirent, `${trashFilesPath}/${dirent.name}`);
	} catch (error) {
		await removeTrashInfo(dirent.name);

		throw error;
	}
}

export function moveToTrash(dirents: Dirent[]): Promise<void> {
	return runTask(async (): Promise<void> => {
		const failed: Dirent[] = await eachDirent(dirents, "trash", trashDirent);

		if (failed.length < dirents.length) {
			$trashFull.set(true);
		}
	});
}

export function restoreFromTrash(dirent: Dirent): Promise<void> {
	return runTask(async (): Promise<void> => {
		const toPath: string = await readTrashInfoPath(dirent.name);

		if (existsSync(toPath)) {
			throw new Error(`Cannot restore, ${toPath} already exists.`);
		}

		await mkdir(dirname(toPath), { recursive: true });
		await copyDirent(dirent, toPath);
		await Promise.all([removeDirent(dirent), removeTrashInfo(dirent.name)]);

		checkTrash();
	});
}

export function emptyTrash(): Promise<void> {
	return runTask(async (): Promise<void> => {
		await Promise.all([
			rm(trashFilesPath, { recursive: true, force: true }),
			rm(trashInfoPath, { recursive: true, force: true }),
		]);

		await Promise.all([
			mkdir(trashFilesPath, { recursive: true }),
			mkdir(trashInfoPath, { recursive: true }),
		]);

		$trashFull.set(false);
	});
}
