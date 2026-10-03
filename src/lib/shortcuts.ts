import type { Dirent } from "node:fs";
import * as core from "@opentui/core";
import { Confirmation } from "../components/Confirmation";
import { Prompt } from "../components/Prompt";
import { extract, isArchive } from "./archive";
import { trashFilesPath } from "./config";
import { ctx } from "./context";
import {
	copy,
	createFile,
	createFolder,
	cut,
	paste,
	remove,
	rename,
} from "./filesystem";
import {
	canPreview,
	getDirentPath,
	go,
	goToParent,
	isFolder,
	isTrashPath,
	openInDefault,
} from "./navigation";
import { dragOut } from "./ripdrag";
import {
	$currentPath,
	$dialogOpen,
	$dirents,
	$markedDirents,
	$markedNames,
	$menuOpen,
	$previewOpen,
	$selectedDirent,
	clearMarks,
	describeDirents,
} from "./store";
import { moveToTrash, restoreFromTrash } from "./trash";

type Run = (dirent: Dirent | null) => void;

type When = (dirent: Dirent) => boolean;

interface Shortcut {
	key: string;
	alias?: string;
	run: Run;
	when?: When;
}

function withDirent(action: (dirent: Dirent) => void): Run {
	return (dirent: Dirent | null): void => {
		if (dirent) {
			action(dirent);
		}
	};
}

function withTargets(action: (dirents: Dirent[]) => void): Run {
	return (dirent: Dirent | null): void => {
		const marked: Dirent[] = $markedDirents.get();

		if (marked.length) {
			action(marked);
		} else if (dirent) {
			action([dirent]);
		}
	};
}

function guard(
	when: When,
	action: (dirent: Dirent) => void,
): { run: Run; when: When } {
	return {
		when: when,
		run: withDirent((dirent: Dirent): void => {
			if (when(dirent)) {
				action(dirent);
			}
		}),
	};
}

function confirmOutsideTrash(
	heading: string,
	question: (targets: string) => string,
	action: (dirents: Dirent[]) => void,
): { run: Run; when: When } {
	return {
		when: outsideTrash,
		run: withTargets((dirents: Dirent[]): void => {
			if (!outsideTrash()) {
				return;
			}

			Confirmation.make({
				heading: heading,
				description: question(describeDirents(dirents, "'")),
				onConfirm: (): void => {
					action(dirents);
				},
			});
		}),
	};
}

export function toggleMark(dirent: Dirent): void {
	const markedNames: Set<string> = new Set<string>($markedNames.get());

	if (!markedNames.delete(dirent.name)) {
		markedNames.add(dirent.name);
	}

	$markedNames.set(markedNames);
}

function inTrash(): boolean {
	return isTrashPath($currentPath.get());
}

function outsideTrash(): boolean {
	return !inTrash();
}

function isTrashed(dirent: Dirent): boolean {
	return dirent.parentPath === trashFilesPath;
}

function moveSelection(step: number): void {
	const dirents: Dirent[] = $dirents.get();
	const selected: Dirent | null = $selectedDirent.get();

	if (!selected) {
		$selectedDirent.set((step > 0 ? dirents[0] : dirents.at(-1)) ?? null);

		return;
	}

	const dirent: Dirent | undefined = dirents[dirents.indexOf(selected) + step];

	if (dirent) {
		$selectedDirent.set(dirent);
	}
}

export const SHORTCUTS = {
	up: {
		key: "up",
		alias: "k",
		run: (): void => {
			moveSelection(-1);
		},
	},
	down: {
		key: "down",
		alias: "j",
		run: (): void => {
			moveSelection(1);
		},
	},
	parent: { key: "left", alias: "h", run: goToParent },
	openFolder: {
		key: "right",
		alias: "l",
		...guard(
			(dirent: Dirent): boolean => outsideTrash() && isFolder(dirent),
			(dirent: Dirent): void => {
				go(getDirentPath(dirent));
			},
		),
	},
	mark: {
		key: "space",
		run: withDirent((dirent: Dirent): void => {
			toggleMark(dirent);
			moveSelection(1);
		}),
	},
	deselect: {
		key: "escape",
		run: (): void => {
			if ($markedNames.get().size) {
				clearMarks();

				return;
			}

			$selectedDirent.set(null);
		},
	},
	open: { key: "return", run: withDirent(openInDefault) },
	preview: {
		key: "p",
		when: canPreview,
		run: (): void => {
			$previewOpen.set(!$previewOpen.get());
		},
	},
	cut: { key: "ctrl+x", run: withTargets(cut) },
	copy: { key: "ctrl+c", run: withTargets(copy) },
	paste: {
		key: "ctrl+v",
		run: (): void => {
			paste();
		},
	},
	rename: {
		key: "r",
		run: withDirent((dirent: Dirent): void => {
			Prompt.make({
				heading: isFolder(dirent) ? "Rename folder" : "Rename file",
				label: isFolder(dirent) ? "Folder name" : "Filename",
				value: dirent.name,
				onSubmit: (filename: string): void => {
					rename(dirent, filename);
				},
			});
		}),
	},
	newFile: {
		key: "n",
		run: (): void => {
			Prompt.make({
				heading: "Create a new file",
				label: "Filename",
				onSubmit: (filename: string): void => {
					createFile(filename);
				},
			});
		},
	},
	newFolder: {
		key: "f",
		run: (): void => {
			Prompt.make({
				heading: "Create a new folder",
				label: "Folder Name",
				onSubmit: (folderName: string): void => {
					createFolder(folderName);
				},
			});
		},
	},
	dragOut: { key: "a", run: withTargets(dragOut) },
	extract: {
		key: "e",
		...guard(
			(dirent: Dirent): boolean => outsideTrash() && isArchive(dirent),
			extract,
		),
	},
	trash: {
		key: "t",
		...confirmOutsideTrash(
			"Move to trash?",
			(targets: string): string =>
				`Are you sure you want to move ${targets} to trash?`,
			moveToTrash,
		),
	},
	restore: {
		key: "ctrl+z",
		...guard(isTrashed, (dirent: Dirent): void => {
			Confirmation.make({
				heading: "Restore?",
				description: `Are you sure you want to restore '${dirent.name}' to its original location?`,
				onConfirm: (): void => {
					restoreFromTrash(dirent);
				},
			});
		}),
	},
	delete: {
		key: "d",
		...confirmOutsideTrash(
			"Permanently delete?",
			(targets: string): string =>
				`Are you sure you want to permanently delete ${targets}?`,
			remove,
		),
	},
	quit: {
		key: "q",
		run: (): void => {
			Confirmation.make({
				heading: "Quit?",
				description: "Are you sure you want to quit the application?",
				onConfirm: (): void => {
					ctx.destroy();
				},
			});
		},
	},
} satisfies Record<string, Shortcut>;

const KEYMAP: Map<string, Run> = new Map<string, Run>();

for (const { key, alias, run } of Object.values(SHORTCUTS) as Shortcut[]) {
	KEYMAP.set(key, run);

	if (alias) {
		KEYMAP.set(alias, run);
	}
}

export function shortcutLabel({ key }: Shortcut): string {
	return key
		.split("+")
		.map((part: string): string => part[0]?.toUpperCase() + part.slice(1))
		.join("+");
}

export function registerKeyboardShortcuts(): void {
	ctx.keyInput.on("keypress", (key: core.KeyEvent): void => {
		if (
			$dialogOpen.get() ||
			$menuOpen.get() ||
			ctx.currentFocusedRenderable instanceof core.InputRenderable ||
			key.meta ||
			key.option
		) {
			return;
		}

		const run: Run | undefined = KEYMAP.get(
			key.ctrl ? `ctrl+${key.name}` : key.name,
		);

		if (run) {
			key.preventDefault();
			run($selectedDirent.get());
		}
	});
}
