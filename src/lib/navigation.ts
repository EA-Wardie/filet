import { access, constants, type Dirent } from "node:fs";
import { dirname, join } from "node:path";
import { trashPath } from "./config";
import { logError } from "./log";
import {
	$backHistory,
	$currentPath,
	$forwardHistory,
	$refresh,
	$searchTerm,
} from "./store";

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

export function refresh(): void {
	$refresh.set($refresh.get() + 1);
}

export function isTrashPath(path: string): boolean {
	return path.includes(trashPath);
}

export function getDirentPath(dirent: Dirent): string {
	return join(dirent.parentPath, dirent.name);
}

export function openInDefault(dirent: Dirent): void {
	const path: string = getDirentPath(dirent);

	if (dirent.isDirectory()) {
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
