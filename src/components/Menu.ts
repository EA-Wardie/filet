import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import { $menuOpen } from "../lib/store";
import type { Button } from "./Button";
import { Component } from "./Component";
import type { Divider } from "./Divider";

export class Menu extends Component<core.BoxRenderable> {
	private _menu: core.BoxRenderable;

	constructor(items: (Button | Divider)[]) {
		super(
			new core.BoxRenderable(ctx, {
				width: "100%",
				height: "100%",
				position: "absolute",
				top: 0,
				left: 0,
				zIndex: 100,
				visible: false,
				onMouseDown: (): void => {
					this.component.destroyRecursively();

					$menuOpen.set(false);
				},
			}),
		);

		this._menu = new core.BoxRenderable(ctx, {
			minWidth: 24,
			backgroundColor: theme.bg,
			border: true,
			borderColor: theme.border,
			position: "absolute",
			zIndex: 101,
		});

		items.forEach((item: Button | Divider): void => {
			this._menu.add(item.component);
		});

		this.component.add(this._menu);

		ctx.root.add(this.component);
	}

	public static make(items: (Button | Divider)[]): Menu {
		return new this(items);
	}

	public show(x: number, y: number): this {
		if ($menuOpen.get()) {
			return this;
		}

		this._menu.left = x;
		this._menu.top = y;
		this.component.visible = true;

		$menuOpen.set(true);

		return this;
	}
}
