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
import { DirentList } from "./DirentList";
import { Divider } from "./Divider";
import { Menu } from "./Menu";
import { MenuButton } from "./MenuButton";
import { Message } from "./Message";

export class VirtualExplorer {
	private _options: core.BoxOptions;
	private _component: core.BoxRenderable;
	private _message: core.TextRenderable;
	private _dirents: Dirent[] = [];
	private _names: string[] | null = null;
	private _loaded: boolean = false;
	private _scan: number = 0;

	constructor(options: core.BoxOptions) {
		this._options = options;

		this._component = new core.BoxRenderable(ctx, {
			width: "100%",
			height: "100%",
			onMouseDown: (event: core.MouseEvent): void => {
				if (event.button === MouseButtons.RIGHT) {
					this.showMenu(event);
				}
			},
			...this._options,
		});

		this._message = Message.make({
			content: "",
			marginX: 1,
			visible: false,
		});

		this._component.add(this._message);
		this._component.add(DirentList.make({ flexGrow: 1 }));

		this.registerStoreEvents();
		this.scanAndShowDirents($currentPath.get());
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
					label: " New File",
					shortcut: shortcutLabel(SHORTCUTS.newFile),
					onClick: (): void => {
						SHORTCUTS.newFile.run();
					},
				}),
				MenuButton.make({
					label: " New Folder",
					shortcut: shortcutLabel(SHORTCUTS.newFolder),
					onClick: (): void => {
						SHORTCUTS.newFolder.run();
					},
				}),
				Divider.make(),
				MenuButton.make({
					label: " Open in Terminal",
					shortcut: shortcutLabel(SHORTCUTS.openTerminal),
					onClick: (): void => {
						SHORTCUTS.openTerminal.run();
					},
				}),
				MenuButton.make({
					label: " Refresh",
					shortcut: shortcutLabel(SHORTCUTS.refresh),
					onClick: (): void => {
						SHORTCUTS.refresh.run();
					},
				}),
				Divider.make({
					visible: canPaste,
				}),
				MenuButton.make({
					label: " Paste",
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
			this.clearDirents();

			clearMarks();

			this.scanAndShowDirents(path, takeSelectName());
		});

		$refresh.listen((): void => {
			this.scanAndShowDirents(
				$currentPath.get(),
				takeSelectName() ?? $selectedDirent.get()?.name,
			);
		});

		$searchTerm.listen((): void => {
			this.filterDirents();
		});
	}

	private matching(term: string): Dirent[] {
		this._names ??= this._dirents.map((dirent: Dirent): string =>
			dirent.name.toLocaleLowerCase(),
		);

		const names: string[] = this._names;

		return this._dirents.filter(
			(_dirent: Dirent, index: number): boolean =>
				names[index]?.includes(term) ?? false,
		);
	}

	private filterDirents(selectName?: string): void {
		const term: string = $searchTerm.get().toLocaleLowerCase();
		const visible: Dirent[] = term ? this.matching(term) : this._dirents;
		const named: Dirent | undefined = visible.find(
			(dirent: Dirent): boolean => dirent.name === selectName,
		);

		this._message.content = this._dirents.length
			? "  --No Matches--"
			: "  --Empty--";
		this._message.visible = this._loaded && !visible.length;

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

	private showDirents(
		dirents: Dirent[],
		loaded: boolean,
		selectName?: string,
	): void {
		this._dirents = dirents;
		this._names = null;
		this._loaded = loaded;

		this.filterDirents(selectName);
	}

	private clearDirents(): void {
		this.showDirents([], false);
	}

	private scanAndShowDirents(path: string, selectName?: string): void {
		const scan: number = ++this._scan;

		readFolder(
			path,
			(error: NodeJS.ErrnoException | null, dirents: Dirent[]): void => {
				if (scan !== this._scan) {
					return;
				}

				if (error) {
					logError(error);

					this.clearDirents();

					return;
				}

				this.pruneMarks(dirents);
				this.sortDirents(dirents);
				this.showDirents(dirents, true, selectName);
			},
		);
	}
}
