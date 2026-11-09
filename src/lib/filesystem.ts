import { type Dirent, lstatSync } from "node:fs";
import {
	cp,
	mkdir,
	rename as renameEntry,
	rm,
	writeFile,
} from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import {
	askConflict,
	type ConflictAnswer,
	type ConflictChoice,
} from "../components/Conflict";
import { ctx } from "./context";
import { logError } from "./log";
import { getDirentPath, isFolder, isInsidePath } from "./navigation";
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
	if (pathExists(toPath)) {
		throw new Error(`Cannot copy, ${toPath} already exists.`);
	}

	try {
		await cp(getDirentPath(dirent), toPath, {
			recursive: true,
			preserveTimestamps: true,
			verbatimSymlinks: true,
			force: false,
			errorOnExist: true,
		});
	} catch (error) {
		await rm(toPath, { recursive: true, force: true });

		throw error;
	}
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

export function uniqueName(
	folder: string,
	name: string,
	isFolderName: boolean,
): string {
	const dot: number = isFolderName ? -1 : name.lastIndexOf(".");
	const stem: string = dot > 0 ? name.slice(0, dot) : name;
	const extension: string = dot > 0 ? name.slice(dot) : "";
	let candidate: string = name;

	for (let count: number = 2; pathExists(join(folder, candidate)); count++) {
		candidate = `${stem} (${count})${extension}`;
	}

	return candidate;
}

export async function replaceEntry(
	target: string,
	place: () => Promise<void>,
): Promise<void> {
	const folder: string = dirname(target);
	const backup: string = join(
		folder,
		uniqueName(folder, `.${basename(target)}.filet-replaced`, true),
	);

	await renameEntry(target, backup);

	try {
		await place();
	} catch (error) {
		if (!entryExists(target)) {
			await renameEntry(backup, target);

			throw error;
		}

		await rm(backup, { recursive: true, force: true });

		throw error;
	}

	await rm(backup, { recursive: true, force: true });
}

interface Destination {
	name: string;
	replace: boolean;
}

export async function paste(): Promise<void> {
	const isCutting: boolean = !$copyDirents.get().length;
	const transfer: (dirent: Dirent, toPath: string) => Promise<void> = isCutting
		? moveDirent
		: copyDirent;
	const toFolder: string = $currentPath.get();
	const dirents: Dirent[] = (isCutting ? $cutDirents : $copyDirents)
		.get()
		.filter(
			(dirent: Dirent): boolean => !isCutting || dirent.parentPath !== toFolder,
		);
	const written: string[] = [];
	const moved: Dirent[] = [];
	let refusal: string = "";
	let always: ConflictChoice | null = null;
	let cancelled: boolean = false;

	if (!dirents.length) {
		return;
	}

	function keepBoth(dirent: Dirent): Destination {
		return {
			name: uniqueName(toFolder, dirent.name, isFolder(dirent)),
			replace: false,
		};
	}

	async function resolveDestination(
		dirent: Dirent,
	): Promise<Destination | string | null> {
		const source: string = getDirentPath(dirent);

		if (isInsidePath(toFolder, source)) {
			return "Can't paste a folder into itself";
		}

		if (dirent.parentPath === toFolder) {
			return keepBoth(dirent);
		}

		const target: string = join(toFolder, dirent.name);

		if (!entryExists(target)) {
			return { name: dirent.name, replace: false };
		}

		let choice: ConflictChoice | null = always;

		if (!choice) {
			const answer: ConflictAnswer = await askConflict(
				dirent.name,
				toFolder,
				dirent !== dirents.at(-1),
			);

			choice = answer.choice;

			if (answer.all) {
				always = choice;
			}
		}

		switch (choice) {
			case "cancel":
				cancelled = true;

				return null;
			case "skip":
				return null;
			case "keepBoth":
				return keepBoth(dirent);
			case "replace":
				return isInsidePath(source, target)
					? "Can't replace a folder with an item from inside it"
					: { name: dirent.name, replace: true };
		}
	}

	await runTask(
		async (): Promise<void> => {
			const failed: Dirent[] = await eachDirent(
				dirents,
				"paste",
				async (dirent: Dirent): Promise<void> => {
					if (cancelled) {
						return;
					}

					const destination: Destination | string | null =
						await resolveDestination(dirent);

					if (destination === null) {
						return;
					}

					if (typeof destination === "string") {
						refusal = destination;

						return;
					}

					const target: string = join(toFolder, destination.name);
					const place: () => Promise<void> = (): Promise<void> =>
						transfer(dirent, target);

					await (destination.replace ? replaceEntry(target, place) : place());

					written.push(destination.name);
					moved.push(dirent);
				},
			);

			if (refusal && !failed.length) {
				$notice.set(refusal);
			}

			if (isCutting) {
				$cutDirents.set(
					$cutDirents
						.get()
						.filter((dirent: Dirent): boolean => !moved.includes(dirent)),
				);
			}
		},
		(): string | undefined => written[0],
	);
}

export function entryExists(path: string): boolean {
	try {
		lstatSync(path);

		return true;
	} catch {
		return false;
	}
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
