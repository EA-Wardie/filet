import type { Dirent } from "node:fs";
import * as core from "@opentui/core";
import { MouseButtons } from "@opentui/core/testing";
import { doubleClickTimeout, theme, trashPath } from "../lib/config";
import { ctx } from "../lib/context";
import {
	copy,
	cut,
	getFileIcon,
	moveToTrash,
	remove,
	rename,
} from "../lib/filesystem";
import { getDirentPath, go, openInDefault } from "../lib/navigation";
import { $currentPath, $selectedDirent } from "../lib/store";
import { Confirmation } from "./Confirmation";
import { Divider } from "./Divider";
import { Menu } from "./Menu";
import { MenuButton } from "./MenuButton";
import { Prompt } from "./Prompt";

interface Options extends core.BoxOptions {
	dirent: Dirent;
}

export class DirentLink {
	private _options: Options;
	private _component: core.BoxRenderable;
	private _label: core.TextRenderable | null = null;
	private _lastClick: number | null = null;

	constructor(options: Options) {
		this._options = options;

		this._component = new core.BoxRenderable(ctx, {
			paddingX: 1,
			onMouseOver: (): void => {
				if ($selectedDirent.get() !== this._options.dirent) {
					this._component.backgroundColor = theme.fg_light;
				}
			},
			onMouseOut: (): void => {
				if ($selectedDirent.get() !== this._options.dirent) {
					this._component.backgroundColor = undefined;
				}
			},
			onMouseDown: (event: core.MouseEvent): void => {
				if (event.button === MouseButtons.LEFT) {
					const lastClick: number | null = this._lastClick;

					$selectedDirent.set(this._options.dirent);

					if (lastClick && Date.now() - lastClick < doubleClickTimeout) {
						this._lastClick = null;

						go(getDirentPath(this._options.dirent));
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
		Menu.make({
			x: event.x,
			y: event.y,
			items: [
				MenuButton.make({
					label: "\udb80\udfcc Open",
					shortcut: "Ctrl+_",
					onClick: (): void => {
						openInDefault(this._options.dirent);
					},
				}),
				Divider.make(),
				MenuButton.make({
					label: "\uf0c5 Copy",
					shortcut: "Ctrl+c",
					onClick: (): void => {
						copy(this._options.dirent);
					},
				}),
				MenuButton.make({
					label: "\uf0c4 Cut",
					shortcut: "Ctrl+x",
					onClick: (): void => {
						cut(this._options.dirent);
					},
				}),
				Divider.make(),
				MenuButton.make({
					label: "\uf040 Rename",
					shortcut: "Ctrl+r",
					onClick: (): void => {
						Prompt.make({
							heading: this._options.dirent.isDirectory()
								? "Rename folder"
								: "Rename file",
							label: this._options.dirent.isDirectory()
								? "Folder name"
								: "Filename",
							value: this._options.dirent.name,
							onSubmit: (filename: string): void => {
								rename(this._options.dirent, filename);
							},
						});
					},
				}),
				Divider.make({
					visible: !$currentPath.get().includes(trashPath),
				}),
				MenuButton.make({
					label: "\uf1f8 Trash",
					shortcut: "Ctrl+t",
					visible: !$currentPath.get().includes(trashPath),
					onClick: (): void => {
						Confirmation.make({
							heading: "Move to trash?",
							description: `Are you sure you want to move '${this._options.dirent.name}' to trash?`,
							onConfirm: (): void => {
								moveToTrash(this._options.dirent);
							},
						});
					},
				}),
				MenuButton.make({
					label: "\udb81\ude91 Delete",
					shortcut: "Ctrl+d",
					visible: !$currentPath.get().includes(trashPath),
					onClick: (): void => {
						Confirmation.make({
							heading: "Permanently delete?",
							description: `Are you sure you want to permanently delete '${this._options.dirent.name}'?`,
							onConfirm: (): void => {
								remove(this._options.dirent);
							},
						});
					},
				}),
			],
		});
	}

	private addLabel(): void {
		this._label = new core.TextRenderable(ctx, {
			content: `${getFileIcon(this._options.dirent)} ${this._options.dirent.name}`,
			fg: theme.fg,
			attributes: core.TextAttributes.BOLD,
			selectable: false,
		});

		this._component.add(this._label);
	}

	private registerStoreEvents(): void {
		const unbindSelectedDirent = $selectedDirent.listen(
			(dirent: Readonly<Dirent> | null) => {
				if (dirent === this._options.dirent) {
					this._component.backgroundColor = theme.fg_dark;

					if (this._label) {
						this._label.fg = theme.bg;
					}
				} else {
					this._component.backgroundColor = undefined;

					if (this._label) {
						this._label.fg = theme.fg;
					}
				}
			},
		);

		this._component.once(core.RenderableEvents.DESTROYED, unbindSelectedDirent);
	}
}
