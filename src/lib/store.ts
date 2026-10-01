import type { Dirent } from "node:fs";
import * as nanostores from "nanostores";
import { HOME_DIRECTORY } from "./consts";

export const $currentPath = nanostores.atom<string>(HOME_DIRECTORY);

export const $selectedDirent = nanostores.atom<Dirent | null>(null);

export const $dirents = nanostores.atom<Dirent[]>([]);

export const $searchTerm = nanostores.atom<string>("");

export const $previewOpen = nanostores.atom<boolean>(false);

export const $trashFull = nanostores.atom<boolean>(false);

export const $copyDirent = nanostores.atom<Dirent | null>(null);

export const $cutDirent = nanostores.atom<Dirent | null>(null);

export const $menuOpen = nanostores.atom<boolean>(false);

export const $dialogOpen = nanostores.atom<boolean>(false);

export const $tasksCount = nanostores.atom<number>(0);

export const $backHistory = nanostores.atom<string[]>([]);

export const $forwardHistory = nanostores.atom<string[]>([]);

export const $refresh = nanostores.atom<number>(0);
