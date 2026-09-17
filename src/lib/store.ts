import type { Dirent } from "node:fs";
import { homedir } from "node:os";
import * as nanostores from "nanostores";
import type { FileLink } from "../components/FileLink";
import type { SidebarLink } from "../components/SidebarLink";

export const $currentPath = nanostores.atom<string>(homedir());

export const $selectedSidebarLink = nanostores.atom<SidebarLink | null>(null);

export const $selectedFileLink = nanostores.atom<FileLink | null>(null);

export const $lastClick = nanostores.atom<number | null>(null);

export const $trashFull = nanostores.atom<boolean>(false);

export const $copyDirent = nanostores.atom<Dirent | null>(null);

export const $cutDirent = nanostores.atom<Dirent | null>(null);

export const $menuOpen = nanostores.atom<boolean>(false);

export const $displayType = nanostores.atom<"list" | "grid">("list");

export const $tasks = nanostores.atom<string[]>([]);

export const $backHistory = nanostores.atom<string[]>([]);

export const $forwardHistory = nanostores.atom<string[]>([]);
