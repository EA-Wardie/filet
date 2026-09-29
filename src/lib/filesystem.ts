import { type Dirent, existsSync } from "node:fs";
import { cp, mkdir, rename as renameEntry, rm } from "node:fs/promises";
import { basename, join } from "node:path";
import { ctx } from "./context";
import { logError } from "./log";
import { getDirentPath, refresh } from "./navigation";
import { $copyDirent, $currentPath, $cutDirent } from "./store";
import { runTask } from "./tasks";

export async function copyDirent(
	dirent: Dirent,
	toPath: string,
): Promise<void> {
	const fromPath: string = getDirentPath(dirent);

	if (dirent.isDirectory()) {
		await cp(fromPath, toPath, { recursive: true });

		return;
	}

	await Bun.write(toPath, Bun.file(fromPath));
}

export async function removeDirent(dirent: Dirent): Promise<void> {
	const path: string = getDirentPath(dirent);

	if (dirent.isDirectory()) {
		await rm(path, { recursive: true, force: true });

		return;
	}

	await Bun.file(path).delete();
}

export async function moveDirent(
	dirent: Dirent,
	toPath: string,
): Promise<void> {
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

	await runTask(async (): Promise<void> => {
		if (isCutting) {
			await moveDirent(dirent, toPath);

			$cutDirent.set(null);
		} else {
			await copyDirent(dirent, toPath);

			$copyDirent.set(null);
		}
	});
}

export function createFile(name: string): void {
	const path: string = join($currentPath.get(), name);

	Bun.write(path, "")
		.then((): void => {
			refresh();
		})
		.catch((error: Error): void => {
			logError(error);
		});
}

export function createFolder(name: string): void {
	const path: string = join($currentPath.get(), name);

	mkdir(path)
		.then((): void => {
			refresh();
		})
		.catch((error: Error): void => {
			logError(error);
		});
}

export async function rename(dirent: Dirent, name: string): Promise<void> {
	await runTask(async (): Promise<void> => {
		await renameEntry(getDirentPath(dirent), join(dirent.parentPath, name));
	});
}

export async function remove(dirent: Dirent): Promise<void> {
	await runTask(async (): Promise<void> => {
		await removeDirent(dirent);
	});
}
