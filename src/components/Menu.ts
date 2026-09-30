import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import { $menuOpen } from "../lib/store";

interface Options extends core.BoxOptions {
	items: core.BoxRenderable[];
	x: number;
	y: number;
}

export class Menu {
	private _options: Options;
	private _component: core.BoxRenderable | null = null;
	private _menu: core.BoxRenderable | null = null;

	constructor(options: Options) {
		this._options = options;

		if ($menuOpen.get()) {
			return;
		}

		this._component = new core.BoxRenderable(ctx, {
			width: "100%",
			height: "100%",
			position: "absolute",
			top: 0,
			left: 0,
			zIndex: 100,
			onMouseDown: (): void => {
				this._component?.destroyRecursively();

				$menuOpen.set(false);
			},
		});

		this.addMenu();
		this.addItems();
		this.showMenu();
	}

	public static make(options: Options): core.BoxRenderable | null {
		return new this(options)._component;
	}

	private addMenu(): void {
		this._menu = new core.BoxRenderable(ctx, {
			minWidth: 24,
			backgroundColor: theme.bg,
			border: true,
			borderColor: theme.border,
			position: "absolute",
			left: this._options.x,
			top: this._options.y + 1,
			zIndex: 101,
			...this._options,
		});

		this._component?.add(this._menu);
	}

	private addItems(): void {
		if (this._menu) {
			for (const item of this._options.items) {
				this._menu.add(item);
			}
		}
	}

	private showMenu(): void {
		if ($menuOpen.get()) {
			return;
		}

		ctx.root.add(this._component);

		$menuOpen.set(true);
	}
}
