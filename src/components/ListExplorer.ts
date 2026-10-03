import type { Dirent } from "node:fs";
import * as core from "@opentui/core";
import { MouseButtons } from "@opentui/core/testing";
import { COLLATOR } from "../lib/consts";
import { ctx } from "../lib/context";
import { logError } from "../lib/log";
import { isFolder, readFolder, takeSelectName } from "../lib/navigation";
import { SHORTCUTS, shortcutLabel } from "../lib/shortcuts";
import {
	$copyDirents,
	$currentPath,
	$cutDirents,
	$dirents,
	$markedNames,
	$refresh,
	$searchTerm,
	$selectedDirent,
	clearMarks,
} from "../lib/store";
import { DirentLink } from "./DirentLink";
import { Divider } from "./Divider";
import { Menu } from "./Menu";
import { MenuButton } from "./MenuButton";
import { Message } from "./Message";

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
				if (event.button === MouseButtons.RIGHT) {
					this.showMenu(event);
				}
			},
			...this._options,
		});

		this._component.focusable = false;

		this.registerStoreEvents();
		this.scanAndMakeDirents($currentPath.get());
	}

	public static make(options: core.BoxOptions = {}): core.BoxRenderable {
		return new this(options)._component;
	}

	private showMenu(event: core.MouseEvent): void {
		const canPaste: boolean =
			!!$copyDirents.get().length || !!$cutDirents.get().length;

		Menu.make({
			x: event.x,
			y: event.y,
			items: [
				MenuButton.make({
					label: "\ued80 New File",
					shortcut: shortcutLabel(SHORTCUTS.newFile),
					onClick: (): void => {
						SHORTCUTS.newFile.run();
					},
				}),
				MenuButton.make({
					label: "\ueec7 New Folder",
					shortcut: shortcutLabel(SHORTCUTS.newFolder),
					onClick: (): void => {
						SHORTCUTS.newFolder.run();
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
						SHORTCUTS.paste.run();
					},
				}),
			],
		});
	}

	private registerStoreEvents(): void {
		$currentPath.listen((path: string): void => {
			this.clearLinks();

			$selectedDirent.set(null);
			clearMarks();

			this.scanAndMakeDirents(path, takeSelectName());
		});

		$refresh.listen((): void => {
			this.clearLinks();
			this.scanAndMakeDirents(
				$currentPath.get(),
				takeSelectName() ?? $selectedDirent.get()?.name,
			);
		});

		$searchTerm.listen((): void => {
			this.filterLinks();
		});

		$selectedDirent.listen((dirent: Dirent | null): void => {
			const link: core.BoxRenderable | undefined = this._links.find(
				(link: Link): boolean => link.dirent === dirent,
			)?.link;

			if (link) {
				this._component.scrollChildIntoView(link.id);
			}
		});
	}

	private filterLinks(selectName?: string): void {
		const term: string = $searchTerm.get().toLocaleLowerCase();
		const visible: Dirent[] = [];
		let named: Dirent | null = null;

		for (const { dirent, name, link } of this._links) {
			link.visible = name.includes(term);

			if (!link.visible) {
				continue;
			}

			visible.push(dirent);

			if (dirent.name === selectName) {
				named = dirent;
			}
		}

		if (this._noMatches) {
			this._noMatches.visible = !visible.length;
		}

		$dirents.set(visible);
		$selectedDirent.set(named ?? visible[0] ?? null);
	}

	private pruneMarks(dirents: Dirent[]): void {
		const markedNames: ReadonlySet<string> = $markedNames.get();

		if (markedNames.size) {
			$markedNames.set(
				new Set<string>(
					dirents
						.map((dirent: Dirent): string => dirent.name)
						.filter((name: string): boolean => markedNames.has(name)),
				),
			);
		}
	}

	private sortDirents(dirents: Dirent[]): void {
		const rank = (dirent: Dirent): number => {
			if (!isFolder(dirent)) {
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

		$dirents.set([]);

		for (const child of this._component.getChildren()) {
			child.destroyRecursively();
		}
	}

	private addMessage(
		content: string,
		visible: boolean = true,
	): core.TextRenderable {
		const message: core.TextRenderable = Message.make({
			content: content,
			marginX: 1,
			visible: visible,
		});

		this._component.add(message);

		return message;
	}

	private makeLinks(dirents: Dirent[], selectName?: string): void {
		try {
			if (!dirents.length) {
				this.addMessage("\uf07c  --Empty--");
				this.filterLinks();

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

		readFolder(
			path,
			(error: NodeJS.ErrnoException | null, dirents: Dirent[]): void => {
				if (scan !== this._scan) {
					return;
				}

				if (error) {
					logError(error);

					this.filterLinks();

					return;
				}

				this.pruneMarks(dirents);
				this.sortDirents(dirents);
				this.makeLinks(dirents, selectName);
			},
		);
	}
}
