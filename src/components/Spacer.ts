import * as core from "@opentui/core";
import { ctx } from "../lib/context";

export class Spacer {
	private _component: core.BoxRenderable;

	constructor() {
		this._component = new core.BoxRenderable(ctx, {
			flexGrow: 1,
		});
	}

	public static make(): core.BoxRenderable {
		return new this()._component;
	}
}
