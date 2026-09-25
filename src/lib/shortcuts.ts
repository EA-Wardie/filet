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
} from "./filesystem";
import { getDirentPath, go, openInDefault } from "./navigation";
import { $dialogOpen, $selectedDirent } from "./store";

type Shortcut = (dirent: Dirent | null) => void;

function withDirent(action: (dirent: Dirent) => void): Shortcut {
	return (dirent: Dirent | null): void => {
		if (dirent) {
			action(dirent);
		}
	};
}

const SHORTCUTS: Partial<Record<string, Shortcut>> = {
	return: withDirent((dirent: Dirent): void => {
		go(getDirentPath(dirent));
	}),
	escape: (): void => {
		$selectedDirent.set(null);
	},
	"ctrl+space": withDirent(openInDefault),
	"ctrl+x": withDirent(cut),
	"ctrl+c": withDirent(copy),
	"ctrl+v": (): void => {
		paste();
	},
	"ctrl+r": withDirent((dirent: Dirent): void => {
		Prompt.make({
			heading: dirent.isDirectory() ? "Rename folder" : "Rename file",
			label: dirent.isDirectory() ? "Folder name" : "Filename",
			value: dirent.name,
			onSubmit: (filename: string): void => {
				rename(dirent, filename);
			},
		});
	}),
	"ctrl+n": (): void => {
		Prompt.make({
			heading: "Create a new file",
			label: "Filename",
			onSubmit: (filename: string): void => {
				createFile(filename);
			},
		});
	},
	"ctrl+f": (): void => {
		Prompt.make({
			heading: "Create a new folder",
			label: "Folder Name",
			onSubmit: (folderName: string): void => {
				createFolder(folderName);
			},
		});
	},
	"ctrl+a": withDirent(dragOut),
	"ctrl+t": withDirent((dirent: Dirent): void => {
		Confirmation.make({
			heading: "Move to trash?",
			description: `Are you sure you want to move '${dirent.name}' to trash?`,
			onConfirm: (): void => {
				moveToTrash(dirent);
			},
		});
	}),
	"ctrl+d": withDirent((dirent: Dirent): void => {
		Confirmation.make({
			heading: "Permanently delete?",
			description: `Are you sure you want to permanently delete '${dirent.name}'?`,
			onConfirm: (): void => {
				remove(dirent);
			},
		});
	}),
	q: (): void => {
		Confirmation.make({
			heading: "Quit?",
			description: "Are you sure you want to quit the application?",
			onConfirm: (): void => {
				ctx.destroy();
			},
		});
	},
};

export function registerKeyboardShortcuts(): void {
	ctx.keyInput.on("keypress", (key: core.KeyEvent): void => {
		if (
			$dialogOpen.get() ||
			ctx.currentFocusedRenderable instanceof core.InputRenderable
		) {
			return;
		}

		const shortcut: Shortcut | undefined =
			SHORTCUTS[key.ctrl ? `ctrl+${key.name}` : key.name];

		shortcut?.($selectedDirent.get());
	});
}
