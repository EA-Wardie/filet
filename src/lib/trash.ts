import { type Dirent, existsSync, readdir } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { basename, dirname } from "node:path";
import { trashPath } from "./config";
import { copyDirent, moveDirent, removeDirent } from "./filesystem";
import { getDirentPath } from "./navigation";
import { $trashFull } from "./store";
import { runTask } from "./tasks";

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
	await runTask(async (): Promise<void> => {
		await writeTrashInfo(getDirentPath(dirent));
		await moveDirent(dirent, `${trashPath}/files/${dirent.name}`);

		$trashFull.set(true);
	});
}

export async function restoreFromTrash(dirent: Dirent): Promise<void> {
	await runTask(async (): Promise<void> => {
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
	});
}

export async function emptyTrash(): Promise<void> {
	await runTask(async (): Promise<void> => {
		await Promise.all([
			rm(`${trashPath}/files`, { recursive: true, force: true }),
			rm(`${trashPath}/info`, { recursive: true, force: true }),
		]);

		await Promise.all([
			mkdir(`${trashPath}/files`, { recursive: true }),
			mkdir(`${trashPath}/info`, { recursive: true }),
		]);

		$trashFull.set(false);
	});
}
