import type { Dirent } from "node:fs";
import * as core from "@opentui/core";
import { MouseButtons } from "@opentui/core/testing";
import { doubleClickTimeout, theme } from "../lib/config";
import { TRASH_FULL_ICON } from "../lib/consts";
import { ctx } from "../lib/context";
import { getFileIcon } from "../lib/icons";
import { SHORTCUTS, shortcutLabel, toggleMark } from "../lib/shortcuts";
import {
	$markedNames,
	$previewOpen,
	$selectedDirent,
	clearMarks,
} from "../lib/store";
import { Divider } from "./Divider";
import { Menu } from "./Menu";
import { MenuButton } from "./MenuButton";

interface Options extends core.BoxOptions {
	dirent: Dirent;
}

export class DirentLink {
	private _options: Options;
	private _component: core.BoxRenderable;
	private _label: core.TextRenderable | null = null;
	private _lastClick: number | null = null;
	private _selected: boolean = false;
	private _marked: boolean = false;
	private _hovered: boolean = false;

	constructor(options: Options) {
		this._options = options;

		this._component = new core.BoxRenderable(ctx, {
			paddingX: 1,
			onMouseOver: (): void => {
				this._hovered = true;

				this.paint();
			},
			onMouseOut: (): void => {
				this._hovered = false;

				this.paint();
			},
			onMouseDown: (event: core.MouseEvent): void => {
				const { dirent } = this._options;

				if (event.button === MouseButtons.LEFT) {
					const lastClick: number | null = this._lastClick;

					$selectedDirent.set(dirent);

					if (event.modifiers.ctrl) {
						toggleMark(dirent);

						this._lastClick = null;

						return;
					}

					clearMarks();

					if (lastClick && Date.now() - lastClick < doubleClickTimeout) {
						this._lastClick = null;

						SHORTCUTS.open.run(dirent);
					}
				} else if (event.button === MouseButtons.RIGHT) {
					if (!this._marked) {
						clearMarks();
					}

					$selectedDirent.set(dirent);

					this.showMenu(event);
				}

				this._lastClick = Date.now();
			},
			...this._options,
		});

		this.addLabel();
		this.registerStoreEvents();
	}

	public static make(options: Options): core.BoxRenderable {
		return new this(options)._component;
	}

	private showMenu(event: core.MouseEvent): void {
		const { dirent } = this._options;
		const canPreview: boolean =
			SHORTCUTS.preview.when(dirent) && !$previewOpen.get();
		const canExtract: boolean = SHORTCUTS.extract.when(dirent);
		const canTrash: boolean = SHORTCUTS.trash.when(dirent);
		const canRestore: boolean = SHORTCUTS.restore.when(dirent);

		Menu.make({
			x: event.x,
			y: event.y,
			items: [
				MenuButton.make({
					label: "\udb80\udfcc Open",
					shortcut: shortcutLabel(SHORTCUTS.open),
					onClick: (): void => {
						SHORTCUTS.open.run(dirent);
					},
				}),
				MenuButton.make({
					label: "\uf06e Preview",
					shortcut: shortcutLabel(SHORTCUTS.preview),
					visible: canPreview,
					onClick: (): void => {
						SHORTCUTS.preview.run();
					},
				}),
				Divider.make({ visible: canExtract }),
				MenuButton.make({
					label: "\uf1c6 Extract",
					shortcut: shortcutLabel(SHORTCUTS.extract),
					visible: canExtract,
					onClick: (): void => {
						SHORTCUTS.extract.run(dirent);
					},
				}),
				Divider.make(),
				MenuButton.make({
					label: "\uf0c5 Copy",
					shortcut: shortcutLabel(SHORTCUTS.copy),
					onClick: (): void => {
						SHORTCUTS.copy.run(dirent);
					},
				}),
				MenuButton.make({
					label: "\uf0c4 Cut",
					shortcut: shortcutLabel(SHORTCUTS.cut),
					onClick: (): void => {
						SHORTCUTS.cut.run(dirent);
					},
				}),
				Divider.make(),
				MenuButton.make({
					label: "\uf040 Rename",
					shortcut: shortcutLabel(SHORTCUTS.rename),
					onClick: (): void => {
						SHORTCUTS.rename.run(dirent);
					},
				}),
				Divider.make({ visible: canTrash }),
				MenuButton.make({
					label: `${TRASH_FULL_ICON} Trash`,
					shortcut: shortcutLabel(SHORTCUTS.trash),
					visible: canTrash,
					onClick: (): void => {
						SHORTCUTS.trash.run(dirent);
					},
				}),
				MenuButton.make({
					label: "\udb81\ude91 Delete",
					shortcut: shortcutLabel(SHORTCUTS.delete),
					visible: SHORTCUTS.delete.when(dirent),
					onClick: (): void => {
						SHORTCUTS.delete.run(dirent);
					},
				}),
				Divider.make({ visible: canRestore }),
				MenuButton.make({
					label: "\udb82\udd9b Restore",
					shortcut: shortcutLabel(SHORTCUTS.restore),
					visible: canRestore,
					onClick: (): void => {
						SHORTCUTS.restore.run(dirent);
					},
				}),
			],
		});
	}

	private addLabel(): void {
		this._label = new core.TextRenderable(ctx, {
			content: `${getFileIcon(this._options.dirent)} ${this._options.dirent.name}`,
			wrapMode: "none",
			truncate: true,
			fg: theme.fg,
			attributes: core.TextAttributes.BOLD,
			selectable: false,
		});

		this._component.add(this._label);
	}

	private background(): core.RGBA | undefined {
		if (this._marked) {
			return this._selected ? theme.success_dark : theme.success_light;
		}

		if (this._selected) {
			return theme.fg_dark;
		}

		return this._hovered ? theme.fg_light : undefined;
	}

	private paint(): void {
		this._component.backgroundColor = this.background();

		if (this._label) {
			this._label.fg = this._selected && !this._marked ? theme.bg : theme.fg;
		}
	}

	private registerStoreEvents(): void {
		const unbindSelectedDirent = $selectedDirent.listen(
			(dirent: Readonly<Dirent> | null): void => {
				const selected: boolean = dirent === this._options.dirent;

				if (selected === this._selected) {
					return;
				}

				this._selected = selected;

				this.paint();
			},
		);

		const unbindMarkedNames = $markedNames.subscribe(
			(markedNames: ReadonlySet<string>): void => {
				const marked: boolean = markedNames.has(this._options.dirent.name);

				if (marked === this._marked) {
					return;
				}

				this._marked = marked;

				this.paint();
			},
		);

		this._component.once(core.RenderableEvents.DESTROYED, (): void => {
			unbindSelectedDirent();
			unbindMarkedNames();
		});
	}
}
