import {
	access,
	constants,
	type Dirent,
	readdir,
	type Stats,
	stat,
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { expandHome, trashFilesPath, trashPath } from "./config";
import { SYMLINK_TIMEOUT } from "./consts";
import { logError } from "./log";
import {
	$backHistory,
	$currentPath,
	$forwardHistory,
	$notice,
	$refresh,
	$searchTerm,
} from "./store";

let selectName: string | undefined;

export function takeSelectName(): string | undefined {
	const name: string | undefined = selectName;

	selectName = undefined;

	return name;
}

function setPath(path: string): void {
	$currentPath.set(path);
	$searchTerm.set("");
	$notice.set("");
}

export function go(path: string): void {
	if ($currentPath.get() === path) {
		return;
	}

	$backHistory.set([...$backHistory.get(), $currentPath.get()]);
	$forwardHistory.set([]);
	setPath(path);
}

export function goToPath(input: string): void {
	const path: string = resolve($currentPath.get(), expandHome(input));

	$notice.set("");

	stat(path, (error: NodeJS.ErrnoException | null, stats: Stats): void => {
		if (error?.code === "ENOENT") {
			$notice.set(`${input} does not exist`);

			return;
		}

		if (error) {
			logError(error);
			$notice.set(`Can't open ${input}`);

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

export function goToParent(): void {
	const path: string = $currentPath.get();
	const parent: string = dirname(path);

	if (parent === path || path === trashFilesPath) {
		return;
	}

	selectName = basename(path);

	go(parent);
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
	return path === trashPath || path.startsWith(`${trashPath}/`);
}

export function getDirentPath(dirent: Dirent): string {
	return join(dirent.parentPath, dirent.name);
}

const linkedFolders: WeakSet<Dirent> = new WeakSet<Dirent>();

export function isFolder(dirent: Dirent): boolean {
	return dirent.isDirectory() || linkedFolders.has(dirent);
}

export function canPreview(dirent: Dirent): boolean {
	return !isFolder(dirent);
}

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
