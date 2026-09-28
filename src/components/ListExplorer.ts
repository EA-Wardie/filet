import { type Dirent, readdir } from "node:fs";
import * as core from "@opentui/core";
import { MouseButtons } from "@opentui/core/testing";
import { theme } from "../lib/config";
import { COLLATOR } from "../lib/consts";
import { ctx } from "../lib/context";
import { logError } from "../lib/log";
import { SHORTCUTS, shortcutLabel } from "../lib/shortcuts";
import {
	$copyDirent,
	$currentPath,
	$cutDirent,
	$previewing,
	$refresh,
	$searchTerm,
	$selectedDirent,
} from "../lib/store";
import { DirentLink } from "./DirentLink";
import { Divider } from "./Divider";
import { Menu } from "./Menu";
import { MenuButton } from "./MenuButton";
import { Preview } from "./Preview";

interface Link {
	dirent: Dirent;
	name: string;
	link: core.BoxRenderable;
}

export class ListExplorer {
	private _options: core.BoxOptions;
	private _component: core.ScrollBoxRenderable;
	private _links: Link[] = [];
	private _noMatches: core.TextRenderable | null = null;
	private _scan: number = 0;

	constructor(options: core.BoxOptions) {
		this._options = options;

		this._component = new core.ScrollBoxRenderable(ctx, {
			width: "100%",
			height: "100%",
			viewportCulling: true,
			onMouseDown: (event: core.MouseEvent): void => {
				if (event.button === MouseButtons.RIGHT && !$previewing.get()) {
					this.showMenu(event);
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

	private showMenu(event: core.MouseEvent): void {
		const canPaste: boolean = !!$copyDirent.get() || !!$cutDirent.get();

		Menu.make({
			x: event.x,
			y: event.y,
			items: [
				MenuButton.make({
					label: "\ued80 New File",
					shortcut: shortcutLabel(SHORTCUTS.newFile),
					onClick: (): void => {
						SHORTCUTS.newFile.run(null);
					},
				}),
				MenuButton.make({
					label: "\ueec7 New Folder",
					shortcut: shortcutLabel(SHORTCUTS.newFolder),
					onClick: (): void => {
						SHORTCUTS.newFolder.run(null);
					},
				}),
				Divider.make({
					visible: canPaste,
				}),
				MenuButton.make({
					label: "\uf07f Paste",
					shortcut: shortcutLabel(SHORTCUTS.paste),
					visible: canPaste,
					onClick: (): void => {
						SHORTCUTS.paste.run(null);
					},
				}),
			],
		});
	}

	private registerStoreEvents(): void {
		$currentPath.listen((path: string): void => {
			this.scanAndMakeDirents(path);
		});

		$refresh.listen((): void => {
			this.scanAndMakeDirents($currentPath.get(), $selectedDirent.get()?.name);
		});

		$searchTerm.listen((): void => {
			this.filterLinks();
		});
	}

	private filterLinks(selectName?: string): void {
		const term: string = $searchTerm.get().toLocaleLowerCase();
		let first: Dirent | null = null;
		let named: Dirent | null = null;

		for (const { dirent, name, link } of this._links) {
			link.visible = name.includes(term);

			if (!link.visible) {
				continue;
			}

			first ??= dirent;

			if (dirent.name === selectName) {
				named = dirent;
			}
		}

		if (this._noMatches) {
			this._noMatches.visible = !first;
		}

		$selectedDirent.set(named ?? first);
	}

	private sortDirents(dirents: Dirent[]): void {
		const rank = (dirent: Dirent): number => {
			if (!dirent.isDirectory()) {
				return 2;
			}

			return dirent.name.startsWith(".") ? 1 : 0;
		};

		dirents.sort((a: Dirent, b: Dirent): number => {
			const rankDifference: number = rank(a) - rank(b);

			if (rankDifference !== 0) {
				return rankDifference;
			}

			return COLLATOR.compare(a.name, b.name);
		});
	}

	private addLinks(dirents: Dirent[]): void {
		for (const dirent of dirents) {
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
		this._links = [];
		this._noMatches = null;

		for (const child of this._component.getChildren()) {
			child.destroyRecursively();
		}

		$selectedDirent.set(null);
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

	private makeLinks(dirents: Dirent[], selectName?: string): void {
		try {
			if (!dirents.length) {
				this.addMessage("\uf07c  --Empty--");

				return;
			}

			this._noMatches = this.addMessage("\uf002  --No Matches--", false);

			this.addLinks(dirents);
			this.filterLinks(selectName);
		} catch (error) {
			logError(error);
		}
	}

	private scanAndMakeDirents(path: string, selectName?: string): void {
		const scan: number = ++this._scan;

		$previewing.set(false);

		this.clearLinks();

		readdir(
			path,
			{ withFileTypes: true },
			(error: NodeJS.ErrnoException | null, dirents: Dirent[]): void => {
				if (scan !== this._scan) {
					return;
				}

				if (error?.code === "ENOTDIR") {
					$previewing.set(true);

					this._component.add(Preview.make({ path: path }));

					return;
				}

				if (error) {
					logError(error);

					return;
				}

				this.sortDirents(dirents);
				this.makeLinks(dirents, selectName);
			},
		);
	}
}
