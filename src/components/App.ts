import * as core from "@opentui/core";
import { version } from "../../package.json";
import { borderStyle, theme } from "../lib/config";
import { ctx } from "../lib/context";
import { BorderJoints } from "./BorderJoints";

interface Options extends core.BoxOptions {
	components: core.Renderable[];
}

export class App {
	private _component: core.BoxRenderable;

	constructor(options: Options) {
		this._component = new core.BoxRenderable(ctx, {
			id: "app",
			width: "100%",
			height: "100%",
			backgroundColor: theme.bg,
			border: true,
			borderColor: theme.border,
			borderStyle: borderStyle,
			bottomTitle: ` v${version} `,
			bottomTitleAlignment: "right",
			flexDirection: "row",
			...options,
		});

		this.addComponents(options.components);
		this.addToContext();
	}

	public static make(options: Options): core.BoxRenderable {
		return new this(options)._component;
	}

	private addComponents(components: core.Renderable[]): void {
		for (const component of components) {
			this._component.add(component);
		}

		this._component.add(BorderJoints.make());
	}

	public addToContext(): void {
		ctx.root.add(this._component);
	}
}
