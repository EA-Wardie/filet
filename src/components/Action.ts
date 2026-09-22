import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";

export type ActionColorType = "default" | "success" | "danger";

interface Options extends core.BoxOptions {
	label: string;
	color: ActionColorType;
	onClick: () => void;
}

export class Action {
	private _component: core.BoxRenderable;
	private _options: Options;
	private _label: core.TextRenderable | null = null;
	private _onClick: (() => void) | null = null;
	private _disabled: boolean = false;

	constructor(options: Options) {
		this._options = options;

		this._component = new core.BoxRenderable(ctx, {
			backgroundColor: theme.fg,
			flexDirection: "row",
			justifyContent: "center",
			paddingX: 1,
			...this._options,
		});

		this.setLabel();
		this.setColor();
		this.setCallback();
		this.registerEvents();
	}

	// private guard(handler: () => void): () => void {
	//   return (): void => {
	//     if (this._disabled) {
	//       return;
	//     }

	//     handler();
	//   };
	// }

	private registerEvents(): void {
		this._component.onMouseOver = (): void => {
			if (this._disabled) {
				return;
			}

			this._component.opacity = 0.8;
		};

		this._component.onMouseOut = (): void => {
			if (this._disabled) {
				return;
			}

			this._component.opacity = 1;
		};

		this._component.onMouseDown = (): void => {
			if (this._disabled) {
				return;
			}

			this._onClick?.();
		};
	}

	public static make(options: Options): core.BoxRenderable {
		return new this(options)._component;
	}

	// private getEvents(color: ActionColorType) {
	// 	let bg = theme.fg;
	// 	let bgFocused = theme.fg_dark;
	// 	let fg = theme.bg;
	// 	let fgFocused = theme.fg;

	// 	if (color === "success") {
	// 		bg = theme.success;
	// 		bgFocused = theme.success_dark;
	// 		fg = theme.fg;
	// 		fgFocused = theme.fg;
	// 	}

	// 	if (color === "danger") {
	// 		bg = theme.danger;
	// 		bgFocused = theme.danger_dark;
	// 		fg = theme.fg;
	// 		fgFocused = theme.fg;
	// 	}

	// 	return {
	// 		onMouseOver: (): void => {
	// 			if (this._disabled) {
	// 				return;
	// 			}

	// 			this._component.backgroundColor = bgFocused;

	// 			if (this._label) {
	// 				this._label.fg = fg;
	// 			}
	// 		},
	// 		onMouseOut: (): void => {
	// 			if (this._disabled) {
	// 				return;
	// 			}

	// 			this._component.backgroundColor = bg;

	// 			if (this._label) {
	// 				this._label.fg = fgFocused;
	// 			}
	// 		},
	// 		onMouseDown: (): void => {
	// 			if (this._disabled) {
	// 				return;
	// 			}

	// 			this._callback?.();
	// 		},
	// 	};
	// }

	public setLabel(): void {
		this._label = new core.TextRenderable(ctx, {
			content: this._options.label,
			attributes: core.TextAttributes.BOLD,
			selectable: false,
		});

		this._component.add(this._label);
	}

	public disabled(disabled: boolean): this {
		this._disabled = disabled;
		this._component.opacity = disabled ? 0.4 : 1;

		return this;
	}

	public setColor(): void {
		if (this._options.color === "default") {
			this._component.backgroundColor = theme.fg;

			if (this._label) {
				this._label.fg = theme.bg;
			}
		} else if (this._options.color === "success") {
			this._component.backgroundColor = theme.success;

			if (this._label) {
				this._label.fg = theme.fg;
			}
		} else if (this._options.color === "danger") {
			this._component.backgroundColor = theme.danger;

			if (this._label) {
				this._label.fg = theme.fg;
			}
		}
	}

	private setCallback(): void {
		this._onClick = this._options.onClick;
	}

	public visible(visible: boolean) {
		this._component.visible = visible;

		return this;
	}
}
