import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import type { Component } from "./Component";

export class Layout {
	private app: core.Renderable;

	constructor() {
		this.app = new core.BoxRenderable(ctx, {
			id: "app",
			width: "100%",
			height: "100%",
			backgroundColor: theme.bg,
			flexDirection: "row",
		});

		ctx.root.add(this.app);
	}

	public static make(): Layout {
		return new this();
	}

	public components(components: Component<core.Renderable>[]): this {
		components.forEach((component) => {
			this.app.add(component.component);
		});

		return this;
	}
}
