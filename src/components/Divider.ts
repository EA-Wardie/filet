import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";

export class Divider {
	private _options: core.BoxOptions;
	private _component: core.BoxRenderable;

	constructor(options: core.BoxOptions) {
		this._options = options;

		this._component = new core.BoxRenderable(ctx, {
			border: ["top"],
			borderColor: theme.border,
			...this._options,
		});
	}

	public static make(options: core.BoxOptions = {}): core.BoxRenderable {
		return new this(options)._component;
	}
}
