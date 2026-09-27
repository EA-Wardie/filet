import type { Dirent } from "node:fs";
import * as nanostores from "nanostores";
import { displayType } from "./config";
import { type DisplayType, HOME_DIRECTORY } from "./consts";

export const $currentPath = nanostores.atom<string>(HOME_DIRECTORY);

export const $selectedDirent = nanostores.atom<Dirent | null>(null);

export const $searchTerm = nanostores.atom<string>("");

export const $trashFull = nanostores.atom<boolean>(false);

export const $copyDirent = nanostores.atom<Dirent | null>(null);

export const $cutDirent = nanostores.atom<Dirent | null>(null);

export const $menuOpen = nanostores.atom<boolean>(false);

export const $dialogOpen = nanostores.atom<boolean>(false);

export const $displayType = nanostores.atom<DisplayType>(displayType);

export const $tasksCount = nanostores.atom<number>(0);

export const $backHistory = nanostores.atom<string[]>([]);

export const $forwardHistory = nanostores.atom<string[]>([]);

export const $refresh = nanostores.atom<number>(0);
