import { type Dirent, existsSync, lstatSync } from "node:fs";
import {
	cp,
	mkdir,
	rename as renameEntry,
	rm,
	writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import type { WritableAtom } from "nanostores";
import { ctx } from "./context";
import { logError } from "./log";
import { getDirentPath } from "./navigation";
import {
	$copyDirents,
	$currentPath,
	$cutDirents,
	$notice,
	clearMarks,
	describeDirents,
} from "./store";
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

export async function eachDirent(
	dirents: Dirent[],
	verb: string,
	action: (dirent: Dirent) => Promise<void>,
): Promise<Dirent[]> {
	const failed: Dirent[] = [];

	for (const dirent of dirents) {
		try {
			await action(dirent);
		} catch (error) {
			failed.push(dirent);
			logError(error);
		}
	}

	if (failed.length) {
		$notice.set(`Couldn't ${verb} ${describeDirents(failed, "'")}`);
	}

	return failed;
}

function toClipboard(dirents: Dirent[]): void {
	ctx.copyToClipboardOSC52(dirents.map(getDirentPath).join("\n"));

	$notice.set("");
	clearMarks();
}

export function copy(dirents: Dirent[]): void {
	toClipboard(dirents);

	$cutDirents.set([]);
	$copyDirents.set(dirents);
}

export function cut(dirents: Dirent[]): void {
	toClipboard(dirents);

	$copyDirents.set([]);
	$cutDirents.set(dirents);
}

export async function paste(): Promise<void> {
	const isCutting: boolean = !$copyDirents.get().length;
	const clipboard: WritableAtom<Dirent[]> = isCutting
		? $cutDirents
		: $copyDirents;
	const transfer: (dirent: Dirent, toPath: string) => Promise<void> = isCutting
		? moveDirent
		: copyDirent;
	const toFolder: string = $currentPath.get();
	const toPath = (dirent: Dirent): string => join(toFolder, dirent.name);
	const dirents: Dirent[] = clipboard
		.get()
		.filter(
			(dirent: Dirent): boolean => toPath(dirent) !== getDirentPath(dirent),
		);

	if (!dirents.length) {
		return;
	}

	await runTask(async (): Promise<void> => {
		for (const dirent of dirents) {
			if (existsSync(toPath(dirent))) {
				throw new Error(`Cannot paste, ${toPath(dirent)} already exists.`);
			}
		}

		const failed: Dirent[] = await eachDirent(
			dirents,
			"paste",
			(dirent: Dirent): Promise<void> => transfer(dirent, toPath(dirent)),
		);

		clipboard.set(
			clipboard
				.get()
				.filter(
					(dirent: Dirent): boolean =>
						!dirents.includes(dirent) || failed.includes(dirent),
				),
		);
	}, dirents[0]?.name);
}

export function pathExists(path: string): boolean {
	try {
		lstatSync(path);

		return true;
	} catch (error) {
		return (error as NodeJS.ErrnoException).code !== "ENOENT";
	}
}

export function canUseName(
	folder: string,
	name: string,
	verb: string,
): boolean {
	if (!name || name === "." || name === "..") {
		$notice.set(`Couldn't ${verb}, '${name}' isn't a valid name`);
	} else if (name.includes("/")) {
		$notice.set(`Couldn't ${verb}, names can't contain '/'`);
	} else if (pathExists(join(folder, name))) {
		$notice.set(`Couldn't ${verb}, '${name}' already exists`);
	} else {
		return true;
	}

	return false;
}

export async function createFile(name: string): Promise<void> {
	const folder: string = $currentPath.get();

	if (canUseName(folder, name, "create file")) {
		await runTask(
			(): Promise<void> => writeFile(join(folder, name), "", { flag: "wx" }),
			name,
		);
	}
}

export async function createFolder(name: string): Promise<void> {
	const folder: string = $currentPath.get();

	if (canUseName(folder, name, "create folder")) {
		await runTask((): Promise<void> => mkdir(join(folder, name)), name);
	}
}

export async function rename(dirent: Dirent, name: string): Promise<void> {
	if (name !== dirent.name && canUseName(dirent.parentPath, name, "rename")) {
		await runTask(
			(): Promise<void> =>
				renameEntry(getDirentPath(dirent), join(dirent.parentPath, name)),
			name,
		);
	}
}

export function remove(dirents: Dirent[]): Promise<void> {
	return runTask(
		(): Promise<Dirent[]> => eachDirent(dirents, "delete", removeDirent),
	);
}
