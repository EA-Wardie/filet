import { type Dirent, readdir } from "node:fs";
import * as core from "@opentui/core";
import { Confirmation } from "../components/Confirmation";
import { Prompt } from "../components/Prompt";
import { trashPath } from "./config";
import { copy, cut, dragOut, paste, rename } from "./filesystem";
import { getDirentPath, go } from "./navigation";
import { $selectedFileLink, $trashFull } from "./store";

export let ctx: core.CliRenderer;

export function makeApp(callback: () => void) {
	core
		.createCliRenderer({
			exitOnCtrlC: false,
			consoleOptions: {
				sizePercent: 20,
			},
		})
		.then((context: core.CliRenderer) => {
			ctx = context;

			// ctx.console.show();

			ctx.keyInput.on("keypress", (key: core.KeyEvent): void => {
				const dirent: Dirent | null =
					$selectedFileLink.get()?.getDirent() ?? null;

				if (key.name === "return") {
					if (!dirent) {
						return;
					}

					go(getDirentPath(dirent));
				}

				if (key.name === "escape") {
					$selectedFileLink.set(null);
				}

				if (key.ctrl && key.name === "x") {
					if (!dirent) {
						return;
					}

					cut(dirent);
				}

				if (key.ctrl && key.name === "c") {
					if (!dirent) {
						return;
					}

					copy(dirent);
				}

				if (key.ctrl && key.name === "v") {
					paste();
				}

				if (key.ctrl && key.name === "r") {
					if (!dirent) {
						return;
					}

					Prompt.make()
						.heading(dirent.isDirectory() ? "Rename folder" : "Rename file")
						.label(dirent.isDirectory() ? "Folder name" : "Filename")
						.variant("success")
						.value(dirent.name)
						.onSubmit((filename: string): void => {
							rename(dirent, filename);
						});
				}

				if (key.ctrl && key.name === "d") {
					if (!dirent) {
						return;
					}

					dragOut(dirent);
				}

				if (key.name === "q") {
					Confirmation.make()
						.heading("Quit?")
						.description("Are you sure you want to quit the application?")
						.variant("success")
						.onConfirm((): void => {
							ctx.destroy();
						});
				}
			});

			checkTrash();
			callback();
		});
}

function checkTrash(): void {
	readdir(
		`${trashPath}/files`,
		(error: NodeJS.ErrnoException | null, files: string[]) => {
			if (error) {
				return;
			}

			if (files.length) {
				$trashFull.set(true);
			}
		},
	);
}

export function syntaxStyles(): core.SyntaxStyle {
	return core.SyntaxStyle.fromStyles({
		// Basic tokens
		keyword: { fg: core.RGBA.fromHex("#FF7B72"), bold: true },
		"keyword.import": { fg: core.RGBA.fromHex("#FF7B72"), bold: true },
		"keyword.operator": { fg: core.RGBA.fromHex("#FF7B72") },

		string: { fg: core.RGBA.fromHex("#A5D6FF") },
		comment: { fg: core.RGBA.fromHex("#8B949E"), italic: true },
		number: { fg: core.RGBA.fromHex("#79C0FF") },
		boolean: { fg: core.RGBA.fromHex("#79C0FF") },
		constant: { fg: core.RGBA.fromHex("#79C0FF") },

		// Functions and types
		function: { fg: core.RGBA.fromHex("#D2A8FF") },
		"function.call": { fg: core.RGBA.fromHex("#D2A8FF") },
		"function.method.call": { fg: core.RGBA.fromHex("#D2A8FF") },
		type: { fg: core.RGBA.fromHex("#FFA657") },
		constructor: { fg: core.RGBA.fromHex("#FFA657") },

		// Variables and properties
		variable: { fg: core.RGBA.fromHex("#E6EDF3") },
		"variable.member": { fg: core.RGBA.fromHex("#79C0FF") },
		property: { fg: core.RGBA.fromHex("#79C0FF") },

		// Operators and punctuation
		operator: { fg: core.RGBA.fromHex("#FF7B72") },
		punctuation: { fg: core.RGBA.fromHex("#F0F6FC") },
		"punctuation.bracket": { fg: core.RGBA.fromHex("#F0F6FC") },
		"punctuation.delimiter": { fg: core.RGBA.fromHex("#C9D1D9") },

		// Default fallback
		default: { fg: core.RGBA.fromHex("#E6EDF3") },
	});
}
