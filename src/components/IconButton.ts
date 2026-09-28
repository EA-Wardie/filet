import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";

interface Options extends core.BoxOptions {
	icon: string;
	disabled?: () => boolean;
	onClick: () => void;
}

export class IconButton {
	private _options: Options;
	private _component: core.BoxRenderable;
	private _icon: core.TextRenderable;

	constructor(options: Options) {
		this._options = options;

		this._component = new core.BoxRenderable(ctx, {
			flexDirection: "row",
			justifyContent: "center",
			paddingX: 1,
			onMouseOver: (): void => {
				this.setColors(theme.fg, theme.bg);
			},
			onMouseOut: (): void => {
				this.setColors(undefined, theme.fg);
			},
			onMouseDown: (): void => {
				this.setColors(theme.fg_dark, theme.bg);
			},
			onMouseUp: (): void => {
				if (this._options.disabled?.()) {
					return;
				}

				this.setColors(undefined, theme.fg);

				this._options.onClick();
			},
			...this._options,
		});

		this._icon = new core.TextRenderable(ctx, {
			content: this._options.icon,
			fg: theme.fg,
			attributes: core.TextAttributes.BOLD,
			selectable: false,
		});

		this._component.add(this._icon);
	}

	public static make(options: Options): core.BoxRenderable {
		return new this(options)._component;
	}

	private setColors(
		background: core.RGBA | undefined,
		foreground: core.RGBA,
	): void {
		if (this._options.disabled?.()) {
			return;
		}

		this._component.backgroundColor = background;
		this._icon.fg = foreground;
	}
}
