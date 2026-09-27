import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";

interface Options extends core.BoxOptions {
	vertical?: boolean;
}

export class Divider {
	private _options: Options;
	private _component: core.BoxRenderable;

	constructor(options: Options) {
		this._options = options;

		this._component = new core.BoxRenderable(ctx, {
			border: !this._options.vertical ? ["top"] : ["left"],
			borderColor: theme.border,
			...this._options,
		});
	}

	public static make(options: Options = {}): core.BoxRenderable {
		return new this(options)._component;
	}
}
