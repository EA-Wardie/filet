import { type Dirent, readdir, type Stats, stat } from "node:fs";
import * as core from "@opentui/core";
import { MouseButtons } from "@opentui/core/testing";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import { createFile, createFolder, paste } from "../lib/filesystem";
import { logError } from "../lib/log";
import {
	$copyDirent,
	$currentPath,
	$cutDirent,
	$searchTerm,
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
	private _direntsPath: string | null = null;
	private _scan: number = 0;

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
		this.scanAndMakeDirents($currentPath.get());
	}

	public static make(options: core.BoxOptions = {}): core.BoxRenderable {
		return new this(options)._component;
	}

	private registerStoreEvents(): void {
		$currentPath.listen((path: string): void => {
			this.scanAndMakeDirents(path);
		});

		$searchTerm.listen((): void => {
			if (this._direntsPath === $currentPath.get()) {
				this.makeLinks();
			}
		});
	}

	private filterLinks(): Dirent[] {
		const term: string = $searchTerm.get().toLocaleLowerCase();

		if (!term) {
			return this._dirents;
		}

		return this._dirents.filter((dirent: Dirent): boolean =>
			dirent.name.toLocaleLowerCase().includes(term),
		);
	}

	private sortLinks(): void {
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

	private addLinks(dirents: Dirent[]): void {
		for (const dirent of dirents) {
			this._component.add(DirentLink.make({ dirent: dirent }));
		}
	}

	private selectFirstLink(dirents: Dirent[]): void {
		$selectedDirent.set(dirents.at(0) ?? null);
	}

	private clearLinks(): void {
		$selectedDirent.set(null);

		for (const child of this._component.getChildren()) {
			child.destroyRecursively();
		}
	}

	private addMessage(content: string): void {
		this._component.add(
			new core.TextRenderable(ctx, {
				content: content,
				fg: theme.fg,
				attributes: core.TextAttributes.DIM,
				marginX: 1,
				selectable: false,
			}),
		);
	}

	private makeLinks(): void {
		this.clearLinks();

		try {
			if (!this._dirents.length) {
				this.addMessage("  --Empty--");

				return;
			}

			const dirents: Dirent[] = this.filterLinks();

			if (!dirents.length) {
				this.addMessage("\uf002  --No Matches--");

				return;
			}

			this.addLinks(dirents);
			this.selectFirstLink(dirents);
		} catch (error) {
			logError(error);
		}
	}

	private scanAndMakeDirents(path: string): void {
		this._scan += 1;

		const scan: number = this._scan;

		this._dirents = [];
		this._direntsPath = null;

		this.clearLinks();

		stat(path, (error: ErrnoException | null, dirent: Stats) => {
			if (scan !== this._scan) {
				return;
			}

			if (error) {
				logError(error);

				return;
			}

			if (dirent.isDirectory()) {
				readdir(
					path,
					{ withFileTypes: true },
					(error: NodeJS.ErrnoException | null, dirents: Dirent[]): void => {
						if (scan !== this._scan) {
							return;
						}

						if (error) {
							logError(error);

							return;
						}

						this._dirents = dirents;
						this._direntsPath = path;

						this.sortLinks();
						this.makeLinks();
					},
				);
			} else {
				this._component.add(Preview.make());
			}
		});
	}
}
