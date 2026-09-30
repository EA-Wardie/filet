import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";

export class Message {
	private _component: core.TextRenderable;

	constructor(options: core.TextOptions) {
		this._component = new core.TextRenderable(ctx, {
			fg: theme.fg,
			attributes: core.TextAttributes.DIM,
			selectable: false,
			...options,
		});
	}

	public static make(options: core.TextOptions): core.TextRenderable {
		return new this(options)._component;
	}
}
