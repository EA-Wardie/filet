import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";

interface Options extends core.BoxOptions {
	label: string;
	shortcut: string;
	onClick: () => void;
}

export class MenuButton {
	private _options: Options;
	private _component: core.BoxRenderable;
	private _label: core.TextRenderable | null = null;
	private _shortcut: core.TextRenderable | null = null;

	constructor(options: Options) {
		this._options = options;

		this._component = new core.BoxRenderable(ctx, {
			flexDirection: "row",
			justifyContent: "space-between",
			paddingX: 1,
			onMouseOver: () => {
				this._component.backgroundColor = theme.active;

				if (this._label) {
					this._label.fg = theme.fg_inverse;
				}

				if (this._shortcut) {
					this._shortcut.fg = theme.fg_inverse;
				}
			},
			onMouseOut: () => {
				this._component.backgroundColor = theme.transparent;

				if (this._label) {
					this._label.fg = theme.fg;
				}

				if (this._shortcut) {
					this._shortcut.fg = theme.fg;
				}
			},
			onMouseDown: () => {
				this._component.backgroundColor = theme.pressed;

				if (this._label) {
					this._label.fg = theme.fg_inverse;
				}

				if (this._shortcut) {
					this._shortcut.fg = theme.fg_inverse;
				}

				this._options.onClick();
			},
			onMouseUp: () => {
				this._component.backgroundColor = theme.transparent;

				if (this._label) {
					this._label.fg = theme.fg;
				}

				if (this._shortcut) {
					this._shortcut.fg = theme.fg;
				}
			},
			...this._options,
		});

		this.addLabel();
		this.addShortcut();
	}

	public static make(options: Options): core.BoxRenderable {
		return new this(options)._component;
	}

	private addLabel(): void {
		this._label = new core.TextRenderable(ctx, {
			content: this._options.label,
			fg: theme.fg,
			attributes: core.TextAttributes.BOLD,
			selectable: false,
		});

		this._component.add(this._label);
	}

	private addShortcut(): void {
		this._shortcut = new core.TextRenderable(ctx, {
			content: this._options.shortcut,
			fg: theme.fg,
			attributes: core.TextAttributes.ITALIC,
			selectable: false,
		});

		this._component.add(this._shortcut);
	}
}
