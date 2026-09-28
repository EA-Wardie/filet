import type { Dirent } from "node:fs";
import * as core from "@opentui/core";
import { Confirmation } from "../components/Confirmation";
import { Prompt } from "../components/Prompt";
import { ctx } from "./context";
import {
	copy,
	createFile,
	createFolder,
	cut,
	dragOut,
	moveToTrash,
	paste,
	remove,
	rename,
	restoreFromTrash,
} from "./filesystem";
import { getDirentPath, go, openInDefault } from "./navigation";
import { $dialogOpen, $previewing, $selectedDirent } from "./store";

type Run = (dirent: Dirent | null) => void;

interface Shortcut {
	key: string;
	run: Run;
}

function withDirent(action: (dirent: Dirent) => void): Run {
	return (dirent: Dirent | null): void => {
		if (dirent) {
			action(dirent);
		}
	};
}

function inDirectory(action: () => void): Run {
	return (): void => {
		if (!$previewing.get()) {
			action();
		}
	};
}

export const SHORTCUTS = {
	go: {
		key: "return",
		run: withDirent((dirent: Dirent): void => {
			go(getDirentPath(dirent));
		}),
	},
	deselect: {
		key: "escape",
		run: (): void => {
			$selectedDirent.set(null);
		},
	},
	open: { key: "ctrl+space", run: withDirent(openInDefault) },
	cut: { key: "ctrl+x", run: withDirent(cut) },
	copy: { key: "ctrl+c", run: withDirent(copy) },
	paste: {
		key: "ctrl+v",
		run: inDirectory((): void => {
			paste();
		}),
	},
	rename: {
		key: "ctrl+r",
		run: withDirent((dirent: Dirent): void => {
			Prompt.make({
				heading: dirent.isDirectory() ? "Rename folder" : "Rename file",
				label: dirent.isDirectory() ? "Folder name" : "Filename",
				value: dirent.name,
				onSubmit: (filename: string): void => {
					rename(dirent, filename);
				},
			});
		}),
	},
	newFile: {
		key: "ctrl+n",
		run: inDirectory((): void => {
			Prompt.make({
				heading: "Create a new file",
				label: "Filename",
				onSubmit: (filename: string): void => {
					createFile(filename);
				},
			});
		}),
	},
	newFolder: {
		key: "ctrl+f",
		run: inDirectory((): void => {
			Prompt.make({
				heading: "Create a new folder",
				label: "Folder Name",
				onSubmit: (folderName: string): void => {
					createFolder(folderName);
				},
			});
		}),
	},
	dragOut: { key: "ctrl+a", run: withDirent(dragOut) },
	trash: {
		key: "ctrl+t",
		run: withDirent((dirent: Dirent): void => {
			Confirmation.make({
				heading: "Move to trash?",
				description: `Are you sure you want to move '${dirent.name}' to trash?`,
				onConfirm: (): void => {
					moveToTrash(dirent);
				},
			});
		}),
	},
	restore: {
		key: "ctrl+z",
		run: withDirent((dirent: Dirent): void => {
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
		key: "ctrl+d",
		run: withDirent((dirent: Dirent): void => {
			Confirmation.make({
				heading: "Permanently delete?",
				description: `Are you sure you want to permanently delete '${dirent.name}'?`,
				onConfirm: (): void => {
					remove(dirent);
				},
			});
		}),
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

const KEYMAP: Map<string, Run> = new Map(
	Object.values(SHORTCUTS).map(({ key, run }: Shortcut) => [key, run]),
);

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
			ctx.currentFocusedRenderable instanceof core.InputRenderable
		) {
			return;
		}

		const run: Run | undefined = KEYMAP.get(
			key.ctrl ? `ctrl+${key.name}` : key.name,
		);

		run?.($selectedDirent.get());
	});
}
