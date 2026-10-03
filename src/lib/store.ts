import type { Dirent } from "node:fs";
import * as nanostores from "nanostores";
import { HOME_DIRECTORY } from "./consts";

export const $currentPath = nanostores.atom<string>(HOME_DIRECTORY);

export const $selectedDirent = nanostores.atom<Dirent | null>(null);

export const $dirents = nanostores.atom<Dirent[]>([]);

export const $searchTerm = nanostores.atom<string>("");

export const $previewOpen = nanostores.atom<boolean>(false);

export const $trashFull = nanostores.atom<boolean>(false);

export const $markedNames = nanostores.atom<ReadonlySet<string>>(new Set());

export function clearMarks(): void {
	if ($markedNames.get().size) {
		$markedNames.set(new Set());
	}
}

export const $markedDirents = nanostores.computed(
	[$dirents, $markedNames],
	(dirents: Dirent[], markedNames: ReadonlySet<string>): Dirent[] =>
		dirents.filter((dirent: Dirent): boolean => markedNames.has(dirent.name)),
);

export const $copyDirents = nanostores.atom<Dirent[]>([]);

export const $cutDirents = nanostores.atom<Dirent[]>([]);

export const $menuOpen = nanostores.atom<boolean>(false);

export const $dialogOpen = nanostores.atom<boolean>(false);

export const $tasksCount = nanostores.atom<number>(0);

export const $backHistory = nanostores.atom<string[]>([]);

export const $forwardHistory = nanostores.atom<string[]>([]);

export const $refresh = nanostores.atom<number>(0);

export const $notice = nanostores.atom<string>("");

export function describeDirents(dirents: Dirent[], quote: string = ""): string {
	return dirents.length === 1
		? `${quote}${dirents[0]?.name}${quote}`
		: `${dirents.length} items`;
}

export const $footerText = nanostores.computed(
	[$notice, $copyDirents, $cutDirents, $markedDirents],
	(
		notice: string,
		copyDirents: Dirent[],
		cutDirents: Dirent[],
		markedDirents: Dirent[],
	): string => {
		if (notice) {
			return notice;
		}

		if (copyDirents.length) {
			return `Copied ${describeDirents(copyDirents)} to clipboard`;
		}

		if (cutDirents.length) {
			return `Cut ${describeDirents(cutDirents)} to clipboard`;
		}

		if (markedDirents.length) {
			return `${markedDirents.length} marked`;
		}

		return "";
	},
);
