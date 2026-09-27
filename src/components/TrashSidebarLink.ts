import * as core from "@opentui/core";
import { MouseButtons } from "@opentui/core/testing";
import { theme, trashPath } from "../lib/config";
import { TRASH_EMPTY_ICON, TRASH_FULL_ICON } from "../lib/consts";
import { ctx } from "../lib/context";
import { go, isTrashPath } from "../lib/navigation";
import { $currentPath, $trashFull } from "../lib/store";

export class TrashSidebarLink {
	private _options: core.BoxOptions;
	private _component: core.BoxRenderable;
	private _label: core.TextRenderable | null = null;

	constructor(options: core.BoxOptions) {
		this._options = options;

		this._component = new core.BoxRenderable(ctx, {
			backgroundColor: isTrashPath($currentPath.get())
				? theme.fg_dark
				: undefined,
			paddingX: 1,
			onMouseOver: (): void => {
				if (isTrashPath($currentPath.get())) {
					return;
				}

				this._component.backgroundColor = theme.fg_light;
			},
			onMouseOut: (): void => {
				if (isTrashPath($currentPath.get())) {
					return;
				}

				this._component.backgroundColor = undefined;
			},
			onMouseDown: (event: core.MouseEvent): void => {
				if (event.button === MouseButtons.LEFT) {
					go(`${trashPath}/files`);
				}
			},
			...this._options,
		});

		this.addLabel();
		this.registerStoreEvents();
	}

	public static make(options: core.BoxOptions = {}): core.BoxRenderable {
		return new this(options)._component;
	}

	private addLabel(): void {
		this._label = new core.TextRenderable(ctx, {
			content: $trashFull.get()
				? `${TRASH_FULL_ICON} Trash`
				: `${TRASH_EMPTY_ICON} Trash`,
			fg: isTrashPath($currentPath.get()) ? theme.bg : theme.fg,
			attributes: core.TextAttributes.BOLD,
			selectable: false,
		});

		this._component.add(this._label);
	}

	private registerStoreEvents(): void {
		$currentPath.listen((path: string): void => {
			if (isTrashPath(path)) {
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
		});

		$trashFull.listen((full: boolean): void => {
			if (full) {
				if (this._label) {
					this._label.content = `${TRASH_FULL_ICON} Trash`;
				}
			} else {
				if (this._label) {
					this._label.content = `${TRASH_EMPTY_ICON} Trash`;
				}
			}
		});
	}
}
