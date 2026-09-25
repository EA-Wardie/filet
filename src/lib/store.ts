import type { Dirent } from "node:fs";
import { homedir } from "node:os";
import * as nanostores from "nanostores";
import type { FileLink } from "../components/FileLink";
import { displayType } from "./config";

export const $currentPath = nanostores.atom<string>(homedir());

export const $selectedFileLink = nanostores.atom<FileLink | null>(null);

export const $trashFull = nanostores.atom<boolean>(false);

export const $copyDirent = nanostores.atom<Dirent | null>(null);

export const $cutDirent = nanostores.atom<Dirent | null>(null);

export const $menuOpen = nanostores.atom<boolean>(false);

export const $dialogOpen = nanostores.atom<boolean>(false);

export const $displayType = nanostores.atom<"list" | "grid">(displayType);

export const $tasks = nanostores.atom<string[]>([]);

export const $backHistory = nanostores.atom<string[]>([]);

export const $forwardHistory = nanostores.atom<string[]>([]);
