import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import { Component } from "./Component";

export class Input extends Component<core.InputRenderable> {
	private _onSubmitCallback: ((value: string) => void) | null = null;

	constructor() {
		super(
			new core.InputRenderable(ctx, {
				value: "",
				textColor: theme.fg,
				flexGrow: 1,
			}),
		);

		ctx.keyInput.on("keypress", (key: core.KeyEvent): void => {
			if (key.name === "return") {
				this.component.blur();
				this._onSubmitCallback?.(this.component.value);
			}

			if (key.name === "escape") {
				this.component.blur();
			}
		});
	}

	public static make(): Input {
		return new this();
	}

	public value(value: string): this {
		this.component.value = value;

		return this;
	}

	public onSubmit(callback: (value: string) => void): this {
		this._onSubmitCallback = callback;

		return this;
	}
}
