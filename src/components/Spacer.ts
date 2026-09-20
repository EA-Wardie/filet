import * as core from "@opentui/core";
import { ctx } from "../lib/context";
import { Component } from "./Component";

export class Spacer extends Component<core.BoxRenderable> {
	constructor() {
		super(
			new core.BoxRenderable(ctx, {
				flexGrow: 1,
			}),
		);
	}

	public static make(): Spacer {
		return new this();
	}
}
