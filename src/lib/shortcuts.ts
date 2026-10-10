import type { Dirent } from "node:fs";
import * as core from "@opentui/core";
import { Confirmation } from "../components/Confirmation";
import { type Control, Controls } from "../components/Controls";
import { Prompt } from "../components/Prompt";
import { Properties } from "../components/Properties";
import { extract, isArchive } from "./archive";
import { copyPaths } from "./clipboard";
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
	openTerminal,
	refresh,
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
	description: string;
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
		description: "Select the entry above",
		run: (): void => {
			moveSelection(-1);
		},
	},
	down: {
		key: "down",
		alias: "j",
		description: "Select the entry below",
		run: (): void => {
			moveSelection(1);
		},
	},
	parent: {
		key: "left",
		alias: "h",
		description: "Go up to the parent folder",
		run: goToParent,
	},
	openFolder: {
		key: "right",
		alias: "l",
		description: "Open the selected folder",
		...guard(
			(dirent: Dirent): boolean => outsideTrash() && isFolder(dirent),
			(dirent: Dirent): void => {
				go(getDirentPath(dirent));
			},
		),
	},
	mark: {
		key: "space",
		description: "Mark or unmark, then select the next entry",
		run: withDirent((dirent: Dirent): void => {
			toggleMark(dirent);
			moveSelection(1);
		}),
	},
	deselect: {
		key: "escape",
		description: "Clear the marks, or the selection",
		run: (): void => {
			if ($markedNames.get().size) {
				clearMarks();

				return;
			}

			$selectedDirent.set(null);
		},
	},
	open: {
		key: "return",
		description: "Open the selected file or folder",
		run: withDirent(openInDefault),
	},
	preview: {
		key: "p",
		description: "Open or close the preview sidebar",
		when: canPreview,
		run: (): void => {
			$previewOpen.set(!$previewOpen.get());
		},
	},
	properties: {
		key: "i",
		description: "Show the properties of the selection",
		run: withDirent((dirent: Dirent): void => {
			Properties.make({ dirent: dirent });
		}),
	},
	cut: {
		key: "ctrl+x",
		description: "Cut the marked items or selection",
		run: withTargets(cut),
	},
	copy: {
		key: "ctrl+c",
		description: "Copy the marked items or selection",
		run: withTargets(copy),
	},
	paste: {
		key: "ctrl+v",
		description: "Paste into the current folder",
		run: (): void => {
			paste();
		},
	},
	rename: {
		key: "r",
		description: "Rename the selection",
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
		description: "Create a new file",
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
		description: "Create a new folder",
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
	copyPath: {
		key: "y",
		description: "Copy the paths of the marked items or selection",
		run: withTargets(copyPaths),
	},
	refresh: {
		key: "ctrl+r",
		description: "Refresh the current folder",
		run: (): void => {
			refresh();
		},
	},
	openTerminal: {
		key: "o",
		description: "Open a terminal in the current folder",
		run: (): void => {
			openTerminal();
		},
	},
	dragOut: {
		key: "a",
		description: "Drag and drop the marked items or selection",
		run: withTargets(dragOut),
	},
	extract: {
		key: "e",
		description: "Extract the selected archive",
		...guard(
			(dirent: Dirent): boolean => outsideTrash() && isArchive(dirent),
			extract,
		),
	},
	trash: {
		key: "t",
		description: "Move the marked items or selection to trash",
		...confirmOutsideTrash(
			"Move to trash?",
			(targets: string): string =>
				`Are you sure you want to move ${targets} to trash?`,
			moveToTrash,
		),
	},
	restore: {
		key: "ctrl+z",
		description: "Restore the selection from trash",
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
		description: "Permanently delete the marked items or selection",
		...confirmOutsideTrash(
			"Permanently delete?",
			(targets: string): string =>
				`Are you sure you want to permanently delete ${targets}?`,
			remove,
		),
	},
	quit: {
		key: "q",
		description: "Quit the application",
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
	controls: {
		key: "?",
		description: "Show the keyboard and mouse controls",
		run: (): void => {
			Controls.make({
				keyboard: SHORTCUT_LIST.map(
					(shortcut: Shortcut): Control => ({
						input: shortcutKeys(shortcut),
						action: shortcut.description,
					}),
				),
			});
		},
	},
} satisfies Record<string, Shortcut>;

const SHORTCUT_LIST: Shortcut[] = Object.values(SHORTCUTS);

const KEYMAP: Map<string, Run> = new Map<string, Run>();

for (const { key, alias, run } of SHORTCUT_LIST) {
	KEYMAP.set(key, run);

	if (alias) {
		KEYMAP.set(alias, run);
	}
}

export function shortcutLabel({ key }: Pick<Shortcut, "key">): string {
	return key
		.split("+")
		.map((part: string): string => part[0]?.toUpperCase() + part.slice(1))
		.join("+");
}

function shortcutKeys({ key, alias }: Shortcut): string {
	const label: string = shortcutLabel({ key: key });

	return alias ? `${label} / ${shortcutLabel({ key: alias })}` : label;
}

export function registerKeyboardShortcuts(): void {
	$dialogOpen.listen((open: boolean): void => {
		if (open) {
			ctx.currentFocusedRenderable?.blur();
		}
	});

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
