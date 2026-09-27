import { type Dirent, readdir, type Stats, stat } from "node:fs";
import * as core from "@opentui/core";
import { MouseButtons } from "@opentui/core/testing";
import { theme } from "../lib/config";
import { COLUMN_GAP } from "../lib/consts";
import { ctx } from "../lib/context";
import { createFile, createFolder, paste } from "../lib/filesystem";
import { logError } from "../lib/log";
import {
	$copyDirent,
	$currentPath,
	$cutDirent,
	$displayType,
	$refresh,
	$searchTerm,
	$selectedDirent,
} from "../lib/store";
import { DirentLink } from "./DirentLink";
import { Divider } from "./Divider";
import { Menu } from "./Menu";
import { MenuButton } from "./MenuButton";
import { Preview } from "./Preview";
import { Prompt } from "./Prompt";

interface Link {
	dirent: Dirent;
	name: string;
	link: core.BoxRenderable;
}

export class ListExplorer {
	private _options: core.BoxOptions;
	private _component: core.ScrollBoxRenderable;
	private _dirents: Dirent[] = [];
	private _direntsPath: string | null = null;
	private _links: Link[] = [];
	private _noMatches: core.TextRenderable | null = null;
	private _scan: number = 0;

	constructor(options: core.BoxOptions) {
		this._options = options;

		this._component = new core.ScrollBoxRenderable(ctx, {
			width: "100%",
			height: "100%",
			viewportCulling: true,
			scrollX: true,
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

		this._component.viewport.on("resize", (): void => {
			this.updateLayout();
		});

		this.updateLayout();
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

		$refresh.listen((): void => {
			this.scanAndMakeDirents($currentPath.get());
		});

		$searchTerm.listen((): void => {
			if (this._direntsPath === $currentPath.get()) {
				this.filterLinks();
			}
		});

		$displayType.listen((): void => {
			this.updateLayout();
		});
	}

	private updateLayout(): void {
		const columns: boolean =
			$displayType.get() === "columns" && this._direntsPath !== null;
		const { horizontalScrollBar, verticalScrollBar, viewport } =
			this._component;

		if (columns) {
			horizontalScrollBar.visible = true;
			verticalScrollBar.visible = false;
		} else {
			horizontalScrollBar.resetVisibilityControl();
			verticalScrollBar.resetVisibilityControl();
		}

		this._component.contentOptions = {
			flexWrap: columns ? "wrap" : "no-wrap",
			columnGap: columns ? COLUMN_GAP : 0,
			width: columns ? "auto" : "100%",
			height: columns ? viewport.height : "auto",
			minHeight: columns ? 0 : "100%",
		};
	}

	private filterLinks(): void {
		const term: string = $searchTerm.get().toLocaleLowerCase();
		let first: Dirent | null = null;

		for (const { dirent, name, link } of this._links) {
			link.visible = name.includes(term);

			if (link.visible && !first) {
				first = dirent;
			}
		}

		if (this._noMatches) {
			this._noMatches.visible = !first;
		}

		$selectedDirent.set(first);
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

	private addLinks(): void {
		for (const dirent of this._dirents) {
			const link: core.BoxRenderable = DirentLink.make({ dirent: dirent });

			this._links.push({
				dirent: dirent,
				name: dirent.name.toLocaleLowerCase(),
				link: link,
			});

			this._component.add(link);
		}
	}

	private clearLinks(): void {
		$selectedDirent.set(null);

		this._links = [];
		this._noMatches = null;

		for (const child of [...this._component.getChildren()]) {
			child.destroyRecursively();
		}
	}

	private addMessage(
		content: string,
		visible: boolean = true,
	): core.TextRenderable {
		const message: core.TextRenderable = new core.TextRenderable(ctx, {
			content: content,
			fg: theme.fg,
			attributes: core.TextAttributes.DIM,
			marginX: 1,
			selectable: false,
			visible: visible,
		});

		this._component.add(message);

		return message;
	}

	private makeLinks(): void {
		this.clearLinks();

		try {
			if (!this._dirents.length) {
				this.addMessage("\uf07c  --Empty--");

				return;
			}

			this._noMatches = this.addMessage("\uf002  --No Matches--", false);

			this.addLinks();
			this.filterLinks();
		} catch (error) {
			logError(error);
		}
	}

	private scanAndMakeDirents(path: string): void {
		this._scan += 1;

		const scan: number = this._scan;

		this._dirents = [];
		this._direntsPath = null;

		this.updateLayout();
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

						this.updateLayout();
						this.sortDirents();
						this.makeLinks();
					},
				);
			} else {
				this._component.add(Preview.make());
			}
		});
	}
}
