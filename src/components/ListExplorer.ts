import { type Dirent, readdir, type Stats, stat } from "node:fs";
import * as core from "@opentui/core";
import { MouseButtons } from "@opentui/core/testing";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import { createFile, createFolder, paste } from "../lib/filesystem";
import {
	$copyDirent,
	$currentPath,
	$cutDirent,
	$selectedDirent,
} from "../lib/store";
import { DirentLink } from "./DirentLink";
import { Divider } from "./Divider";
import { Menu } from "./Menu";
import { MenuButton } from "./MenuButton";
import { Preview } from "./Preview";
import { Prompt } from "./Prompt";

export class ListExplorer {
	private _options: core.BoxOptions;
	private _component: core.BoxRenderable;
	private _dirents: Dirent[] = [];

	constructor(options: core.BoxOptions) {
		this._options = options;

		this._component = new core.ScrollBoxRenderable(ctx, {
			width: "100%",
			height: "100%",
			viewportCulling: true,
			onMouseDown: (event: core.MouseEvent): void => {
				if (event.button === MouseButtons.RIGHT) {
					Menu.make({
						x: event.x,
						y: event.y,
						items: [
							MenuButton.make({
								label: "\ued80 New File",
								shortcut: "Ctrl+N",
								onClick: (): void => {
									Prompt.make({
										heading: "Create a new file",
										label: "Filename",
										onSubmit: (filename: string): void => {
											createFile(filename);
										},
									});
								},
							}),
							MenuButton.make({
								label: "\ueec7 New Folder",
								shortcut: "Ctrl+F",
								onClick: (): void => {
									Prompt.make({
										heading: "Create a new folder",
										label: "Folder Name",
										onSubmit: (folderName: string): void => {
											createFolder(folderName);
										},
									});
								},
							}),
							Divider.make({
								visible: !!$copyDirent.get() || !!$cutDirent.get(),
							}),
							MenuButton.make({
								label: "\uf07f Paste",
								shortcut: "Ctrl+V",
								visible: !!$copyDirent.get() || !!$cutDirent.get(),
								onClick: (): void => {
									paste();
								},
							}),
						],
					});
				}
			},
			...this._options,
		});

		this.registerStoreEvents();
	}

	public static make(options: core.BoxOptions = {}): core.BoxRenderable {
		return new this(options)._component;
	}

	private registerStoreEvents(): void {
		$currentPath.subscribe((path: string): void => {
			$selectedDirent.set(null);

			for (const child of this._component.getChildren()) {
				child.destroyRecursively();
			}

			stat(path, (error: ErrnoException | null, dirent: Stats) => {
				if (error) {
					console.warn(error);

					return;
				}

				if (dirent.isDirectory()) {
					readdir(
						path,
						{ withFileTypes: true },
						(error: NodeJS.ErrnoException | null, dirents: Dirent[]): void => {
							if (error) {
								console.warn(error);

								return;
							}

							this._dirents = dirents;

							try {
								if (dirents.length) {
									this.sortDirents();
									this.drawDirents();
									this.selectFirstDirent();
								} else {
									this._component.add(
										new core.TextRenderable(ctx, {
											content: "\uf07c  --Empty--",
											fg: theme.fg,
											attributes: core.TextAttributes.DIM,
											marginX: 1,
											selectable: false,
										}),
									);
								}
							} catch (error) {
								console.warn(error);
							}
						},
					);
				} else {
					this._component.add(Preview.make());
				}
			});
		});
	}

	private sortDirents(): void {
		if (this._dirents.length > 1000) {
			return;
		}

		const rank = (dirent: Dirent): number => {
			if (!dirent.isDirectory()) {
				return 2;
			}

			return dirent.name.startsWith(".") ? 1 : 0;
		};

		this._dirents.sort((a: Dirent, b: Dirent): number => {
			const rankDifference: number = rank(a) - rank(b);

			if (rankDifference !== 0) {
				return rankDifference;
			}

			return a.name.localeCompare(b.name);
		});
	}

	private drawDirents() {
		for (const dirent of this._dirents) {
			this._component.add(DirentLink.make({ dirent: dirent }));
		}
	}

	private selectFirstDirent(): void {
		$selectedDirent.set(this._dirents.at(0) ?? null);
	}
}
