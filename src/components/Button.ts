import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import { Component } from "./Component";

export type ButtonVaraintType = "default" | "success" | "danger" | "link";

export class Button extends Component<core.BoxRenderable> {
	private _label: core.TextRenderable;
	private _callback: (() => void) | null = null;
	private _disabled: boolean = false;

	constructor() {
		super(
			new core.BoxRenderable(ctx, {
				backgroundColor: theme.fg,
				alignItems: "center",
				paddingX: 1,
			}),
		);

		this._label = new core.TextRenderable(ctx, {
			content: "Button",
			fg: theme.bg,
			attributes: core.TextAttributes.BOLD,
			selectable: false,
		});

		this.component.add(this._label);

		this.registerEvents();
	}

	private guard(handler: () => void): () => void {
		return (): void => {
			if (this._disabled) {
				return;
			}

			handler();
		};
	}

	private registerEvents(): void {
		this.component.onMouseOver = this.guard((): void => {
			this.component.backgroundColor = theme.fg_dark;
		});

		this.component.onMouseOut = this.guard((): void => {
			this.component.backgroundColor = theme.fg;
		});

		this.component.onMouseDown = this.guard((): void => {
			this.component.backgroundColor = theme.fg;

			this._callback?.();
		});

		this.component.onMouseUp = (): void => {
			this.component.backgroundColor = theme.fg_dark;
		};
	}

	public static make(): Button {
		return new this();
	}

	public label(label: string): this {
		this._label.content = label;

		return this;
	}

	public disabled(disabled: boolean): this {
		this._disabled = disabled;
		this.component.opacity = disabled ? 0.4 : 1;

		return this;
	}

	public variant(variant: ButtonVaraintType): this {
		if (variant === "success") {
			this.component.backgroundColor = theme.success;
			this._label.fg = theme.fg;

			this.component.onMouseOver = this.guard((): void => {
				this.component.backgroundColor = theme.success_dark;
			});

			this.component.onMouseOut = this.guard((): void => {
				this.component.backgroundColor = theme.success;
			});

			this.component.onMouseDown = this.guard((): void => {
				this.component.backgroundColor = theme.success;

				this._callback?.();
			});

			this.component.onMouseUp = (): void => {
				this.component.backgroundColor = theme.success_dark;
			};
		} else if (variant === "danger") {
			this.component.backgroundColor = theme.danger;
			this._label.fg = theme.fg;

			this.component.onMouseOver = this.guard((): void => {
				this.component.backgroundColor = theme.danger_dark;
			});

			this.component.onMouseOut = this.guard((): void => {
				this.component.backgroundColor = theme.danger;
			});

			this.component.onMouseDown = this.guard((): void => {
				this.component.backgroundColor = theme.danger;

				this._callback?.();
			});

			this.component.onMouseUp = (): void => {
				this.component.backgroundColor = theme.danger_dark;
			};
		} else if (variant === "link") {
			this.component.backgroundColor = undefined;
			this.component.alignItems = "flex-start";
			this._label.fg = theme.fg;

			this.component.onMouseOver = this.guard((): void => {
				this.component.backgroundColor = theme.fg_light;
			});

			this.component.onMouseOut = this.guard((): void => {
				this.component.backgroundColor = undefined;
			});

			this.component.onMouseDown = this.guard((): void => {
				this.component.backgroundColor = theme.fg_dark;
				this._label.fg = theme.bg;

				this._callback?.();
			});

			this.component.onMouseUp = (): void => {
				this.component.backgroundColor = undefined;
				this._label.fg = theme.fg;
			};
		}

		return this;
	}

	public visible(visible: boolean) {
		this.component.visible = visible;

		return this;
	}

	public align(alignment: core.AlignString | null | undefined) {
		this.component.alignItems = alignment;

		return this;
	}

	public width(width: number | "auto" | `${number}%`) {
		this.component.width = width;

		return this;
	}

	public onClick(callback: () => void): this {
		this._callback = callback;

		return this;
	}
}
