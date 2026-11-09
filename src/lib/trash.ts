import { type Dirent, readdir } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { askConflict, type ConflictAnswer } from "../components/Conflict";
import { trashFilesPath, trashInfoPath } from "./config";
import {
	eachDirent,
	entryExists,
	moveDirent,
	pathExists,
	replaceEntry,
	uniqueName,
} from "./filesystem";
import { getDirentPath, isFolder, isInsidePath } from "./navigation";
import { $trashFull } from "./store";
import { runTask } from "./tasks";

function trashInfoFile(name: string): string {
	return `${trashInfoPath}/${name}.trashinfo`;
}

function removeTrashInfo(name: string): Promise<void> {
	return rm(trashInfoFile(name), { force: true });
}

function encodeTrashPath(path: string): string {
	return path.split("/").map(encodeURIComponent).join("/");
}

function deletionDate(date: Date): string {
	const pad: (value: number) => string = (value: number): string =>
		String(value).padStart(2, "0");

	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

async function claimTrashName(path: string): Promise<string> {
	const name: string = basename(path);
	const content: string = [
		"[Trash Info]",
		`Path=${encodeTrashPath(path)}`,
		`DeletionDate=${deletionDate(new Date())}`,
		"",
	].join("\n");

	for (let count: number = 1; ; count++) {
		const trashName: string = count === 1 ? name : `${name}.${count}`;

		if (pathExists(`${trashFilesPath}/${trashName}`)) {
			continue;
		}

		try {
			await writeFile(trashInfoFile(trashName), content, { flag: "wx" });

			return trashName;
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
				throw error;
			}
		}
	}
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
	const trashName: string = await claimTrashName(getDirentPath(dirent));

	try {
		await moveDirent(dirent, `${trashFilesPath}/${trashName}`);
	} catch (error) {
		await removeTrashInfo(trashName);

		throw error;
	}
}

export function moveToTrash(dirents: Dirent[]): Promise<void> {
	return runTask(async (): Promise<void> => {
		await Promise.all([
			mkdir(trashFilesPath, { recursive: true }),
			mkdir(trashInfoPath, { recursive: true }),
		]);

		const failed: Dirent[] = await eachDirent(dirents, "trash", trashDirent);

		if (failed.length < dirents.length) {
			$trashFull.set(true);
		}
	});
}

async function restoreDirent(dirent: Dirent): Promise<void> {
	const originalPath: string = await readTrashInfoPath(dirent.name);
	const folder: string = dirname(originalPath);
	let name: string = basename(originalPath);

	let replace: boolean = false;

	if (entryExists(originalPath)) {
		const answer: ConflictAnswer = await askConflict(name, folder);

		if (answer.choice === "cancel" || answer.choice === "skip") {
			return;
		}

		if (answer.choice === "keepBoth") {
			name = uniqueName(folder, name, isFolder(dirent));
		} else if (isInsidePath(getDirentPath(dirent), originalPath)) {
			throw new Error(`Cannot replace ${originalPath}, it holds the trash`);
		} else {
			replace = true;
		}
	}

	const target: string = join(folder, name);
	const place: () => Promise<void> = (): Promise<void> =>
		moveDirent(dirent, target);

	await mkdir(folder, { recursive: true });
	await (replace ? replaceEntry(target, place) : place());
	await removeTrashInfo(dirent.name);
}

export function restoreFromTrash(dirent: Dirent): Promise<void> {
	return runTask(async (): Promise<void> => {
		await eachDirent([dirent], "restore", restoreDirent);

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
