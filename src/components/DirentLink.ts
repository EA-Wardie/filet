import type { Dirent } from "node:fs";
import * as core from "@opentui/core";
import { MouseButtons } from "@opentui/core/testing";
import { isArchive } from "../lib/archive";
import { doubleClickTimeout, theme } from "../lib/config";
import { TRASH_FULL_ICON } from "../lib/consts";
import { ctx } from "../lib/context";
import { getFileIcon } from "../lib/icons";
import { isTrashPath } from "../lib/navigation";
import { SHORTCUTS, shortcutLabel } from "../lib/shortcuts";
import { $currentPath, $selectedDirent } from "../lib/store";
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

	constructor(options: Options) {
		this._options = options;

		this._component = new core.BoxRenderable(ctx, {
			paddingX: 1,
			onMouseOver: (): void => {
				if (!this._selected) {
					this._component.backgroundColor = theme.fg_light;
				}
			},
			onMouseOut: (): void => {
				if (!this._selected) {
					this._component.backgroundColor = undefined;
				}
			},
			onMouseDown: (event: core.MouseEvent): void => {
				if (event.button === MouseButtons.LEFT) {
					const lastClick: number | null = this._lastClick;

					$selectedDirent.set(this._options.dirent);

					if (lastClick && Date.now() - lastClick < doubleClickTimeout) {
						this._lastClick = null;

						SHORTCUTS.go.run(this._options.dirent);
					}
				} else if (event.button === MouseButtons.RIGHT) {
					$selectedDirent.set(this._options.dirent);

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
		const canExtract: boolean =
			isArchive(this._options.dirent) && !isTrashPath($currentPath.get());

		Menu.make({
			x: event.x,
			y: event.y,
			items: [
				MenuButton.make({
					label: "\udb80\udfcc Open",
					shortcut: shortcutLabel(SHORTCUTS.open),
					onClick: (): void => {
						SHORTCUTS.open.run(this._options.dirent);
					},
				}),
				Divider.make({ visible: canExtract }),
				MenuButton.make({
					label: "\uf1c6 Extract",
					shortcut: shortcutLabel(SHORTCUTS.extract),
					visible: canExtract,
					onClick: (): void => {
						SHORTCUTS.extract.run(this._options.dirent);
					},
				}),
				Divider.make(),
				MenuButton.make({
					label: "\uf0c5 Copy",
					shortcut: shortcutLabel(SHORTCUTS.copy),
					onClick: (): void => {
						SHORTCUTS.copy.run(this._options.dirent);
					},
				}),
				MenuButton.make({
					label: "\uf0c4 Cut",
					shortcut: shortcutLabel(SHORTCUTS.cut),
					onClick: (): void => {
						SHORTCUTS.cut.run(this._options.dirent);
					},
				}),
				Divider.make(),
				MenuButton.make({
					label: "\uf040 Rename",
					shortcut: shortcutLabel(SHORTCUTS.rename),
					onClick: (): void => {
						SHORTCUTS.rename.run(this._options.dirent);
					},
				}),
				Divider.make({
					visible: !isTrashPath($currentPath.get()),
				}),
				MenuButton.make({
					label: `${TRASH_FULL_ICON} Trash`,
					shortcut: shortcutLabel(SHORTCUTS.trash),
					visible: !isTrashPath($currentPath.get()),
					onClick: (): void => {
						SHORTCUTS.trash.run(this._options.dirent);
					},
				}),
				MenuButton.make({
					label: "\udb81\ude91 Delete",
					shortcut: shortcutLabel(SHORTCUTS.delete),
					visible: !isTrashPath($currentPath.get()),
					onClick: (): void => {
						SHORTCUTS.delete.run(this._options.dirent);
					},
				}),
				Divider.make({
					visible: isTrashPath($currentPath.get()),
				}),
				MenuButton.make({
					label: "\udb82\udd9b Restore",
					shortcut: shortcutLabel(SHORTCUTS.restore),
					visible: isTrashPath($currentPath.get()),
					onClick: (): void => {
						SHORTCUTS.restore.run(this._options.dirent);
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

	private registerStoreEvents(): void {
		const unbindSelectedDirent = $selectedDirent.listen(
			(dirent: Readonly<Dirent> | null): void => {
				const selected: boolean = dirent === this._options.dirent;

				if (selected === this._selected) {
					return;
				}

				this._selected = selected;
				this._component.backgroundColor = selected ? theme.fg_dark : undefined;

				if (this._label) {
					this._label.fg = selected ? theme.bg : theme.fg;
				}
			},
		);

		this._component.once(core.RenderableEvents.DESTROYED, unbindSelectedDirent);
	}
}
