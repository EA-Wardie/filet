import {
	access,
	constants,
	type Dirent,
	readdir,
	type Stats,
	stat,
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { trashPath } from "./config";
import { SYMLINK_TIMEOUT } from "./consts";
import { logError } from "./log";
import {
	$backHistory,
	$currentPath,
	$forwardHistory,
	$refresh,
	$searchTerm,
} from "./store";

// The entry to select once the next folder or refresh has been read.
let selectName: string | undefined;

export function takeSelectName(): string | undefined {
	const name: string | undefined = selectName;

	selectName = undefined;

	return name;
}

function setPath(path: string): void {
	$currentPath.set(path);
	$searchTerm.set("");
}

export function go(path: string): void {
	if ($currentPath.get() === path) {
		return;
	}

	$backHistory.set([...$backHistory.get(), $currentPath.get()]);
	$forwardHistory.set([]);
	setPath(path);
}

// Relative paths resolve against the current folder, and a file path opens its
// folder with the file selected.
export function goToPath(input: string): void {
	const path: string = resolve($currentPath.get(), input);

	stat(path, (error: NodeJS.ErrnoException | null, stats: Stats): void => {
		if (error) {
			logError(error);

			return;
		}

		if (stats.isDirectory()) {
			go(path);

			return;
		}

		const folder: string = dirname(path);

		if (folder === $currentPath.get()) {
			refresh(basename(path));

			return;
		}

		selectName = basename(path);

		go(folder);
	});
}

export function back(): void {
	const backStack: string[] = $backHistory.get();
	const previousPath: string | null = backStack.at(-1) ?? null;

	if (previousPath === null) {
		return;
	}

	$backHistory.set(backStack.slice(0, -1));
	$forwardHistory.set([...$forwardHistory.get(), $currentPath.get()]);
	setPath(previousPath);
}

export function forward(): void {
	const forwardStack: string[] = $forwardHistory.get();
	const nextPath: string | null = forwardStack.at(-1) ?? null;

	if (nextPath === null) {
		return;
	}

	$forwardHistory.set(forwardStack.slice(0, -1));
	$backHistory.set([...$backHistory.get(), $currentPath.get()]);
	setPath(nextPath);
}

export function refresh(select?: string): void {
	selectName = select;

	$refresh.set($refresh.get() + 1);
}

export function isTrashPath(path: string): boolean {
	return path.includes(trashPath);
}

export function getDirentPath(dirent: Dirent): string {
	return join(dirent.parentPath, dirent.name);
}

// Symlinks that point at folders, found by resolveLinks() when a folder is read.
const linkedFolders: WeakSet<Dirent> = new WeakSet<Dirent>();

export function isFolder(dirent: Dirent): boolean {
	return dirent.isDirectory() || linkedFolders.has(dirent);
}

export function canPreview(dirent: Dirent): boolean {
	return !isFolder(dirent);
}

// Waits SYMLINK_TIMEOUT at most, so a link into a hung mount does not keep the
// folder from showing.
function resolveLinks(dirents: Dirent[], done: () => void): void {
	let pending: number = 1;
	const timeout: Timer = setTimeout(finish, SYMLINK_TIMEOUT);

	function finish(): void {
		if (pending < 0) {
			return;
		}

		pending = -1;

		clearTimeout(timeout);
		done();
	}

	function settle(): void {
		pending -= 1;

		if (pending === 0) {
			finish();
		}
	}

	for (const dirent of dirents) {
		if (!dirent.isSymbolicLink()) {
			continue;
		}

		pending += 1;

		stat(
			getDirentPath(dirent),
			(error: NodeJS.ErrnoException | null, stats: Stats): void => {
				if (!error && stats.isDirectory()) {
					linkedFolders.add(dirent);
				}

				settle();
			},
		);
	}

	settle();
}

// Reads a folder and resolves which of its symlinks point at folders.
export function readFolder(
	path: string,
	callback: (error: NodeJS.ErrnoException | null, dirents: Dirent[]) => void,
): void {
	readdir(
		path,
		{ withFileTypes: true },
		(error: NodeJS.ErrnoException | null, dirents: Dirent[]): void => {
			if (error) {
				callback(error, []);

				return;
			}

			resolveLinks(dirents, (): void => {
				callback(null, dirents);
			});
		},
	);
}

export function openInDefault(dirent: Dirent): void {
	const path: string = getDirentPath(dirent);

	if (isFolder(dirent)) {
		go(path);

		return;
	}

	access(path, constants.X_OK, (error: ErrnoException | null) => {
		if (error) {
			try {
				Bun.spawn(["xdg-open", path], {
					stdio: ["ignore", "ignore", "ignore"],
					detached: true,
				}).unref();
			} catch (error) {
				logError(error);
			}

			return;
		}

		try {
			Bun.spawn([path], {
				cwd: dirname(path),
				stdio: ["ignore", "ignore", "ignore"],
				detached: true,
			}).unref();
		} catch (error) {
			logError(error);
		}
	});
}
