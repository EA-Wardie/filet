import * as core from "@opentui/core";
import { MouseButtons } from "@opentui/core/testing";
import { theme, trashPath } from "../lib/config";
import { ctx } from "../lib/context";
import { go } from "../lib/navigation";
import { $currentPath, $trashFull } from "../lib/store";

export class TrashSidebarLink {
	private _options: core.BoxOptions;
	private _component: core.BoxRenderable;
	private _label: core.TextRenderable | null = null;

	constructor(options: core.BoxOptions) {
		this._options = options;

		this._component = new core.BoxRenderable(ctx, {
			backgroundColor: $currentPath.get().includes(trashPath)
				? theme.fg_dark
				: undefined,
			paddingX: 1,
			onMouseOver: (): void => {
				if ($currentPath.get().includes(trashPath)) {
					return;
				}

				this._component.backgroundColor = theme.fg_light;
			},
			onMouseOut: (): void => {
				if ($currentPath.get().includes(trashPath)) {
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
			content: $trashFull.get() ? "\uf1f8 Trash" : "\uf48e Trash",
			fg: $currentPath.get().includes(trashPath) ? theme.bg : theme.fg,
			attributes: core.TextAttributes.BOLD,
			selectable: false,
		});

		this._component.add(this._label);
	}

	private registerStoreEvents(): void {
		$currentPath.listen((path: string): void => {
			if (path.includes(trashPath)) {
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
					this._label.content = "\uf1f8 Trash";
				}
			} else {
				if (this._label) {
					this._label.content = "\uf48e Trash";
				}
			}
		});
	}
}
