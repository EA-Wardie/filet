import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";

interface Options extends core.BoxOptions {
	label: string;
	shortcut: string;
	onClick: (event: core.MouseEvent) => void;
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
				this._component.backgroundColor = theme.fg;

				if (this._label) {
					this._label.fg = theme.bg;
				}
			},
			onMouseOut: () => {
				this._component.backgroundColor = undefined;

				if (this._label) {
					this._label.fg = theme.fg;
				}
			},
			onMouseDown: () => {
				this._component.backgroundColor = theme.fg_dark;

				if (this._label) {
					this._label.fg = theme.bg;
				}
			},
			onMouseUp: (event: core.MouseEvent) => {
				this._component.backgroundColor = undefined;

				if (this._label) {
					this._label.fg = theme.fg;
				}

				this._options.onClick(event);
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
			selectable: false,
		});

		this._component.add(this._shortcut);
	}
}
