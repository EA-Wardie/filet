import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import { $displayType } from "../lib/store";

export class DisplayTypeToggle {
	private _options: core.BoxOptions;
	private _component: core.BoxRenderable;
	private _icon: core.TextRenderable | null = null;

	constructor(options: core.BoxOptions) {
		this._options = options;

		this._component = new core.BoxRenderable(ctx, {
			flexDirection: "row",
			justifyContent: "center",
			paddingX: 1,
			onMouseOver: () => {
				this._component.backgroundColor = theme.fg;

				if (this._icon) {
					this._icon.fg = theme.bg;
				}
			},
			onMouseOut: () => {
				this._component.backgroundColor = undefined;

				if (this._icon) {
					this._icon.fg = theme.fg;
				}
			},
			onMouseDown: () => {
				this._component.backgroundColor = theme.fg_dark;

				if (this._icon) {
					this._icon.fg = theme.bg;
				}
			},
			onMouseUp: () => {
				this._component.backgroundColor = undefined;

				if (this._icon) {
					this._icon.fg = theme.fg;
				}

				$displayType.set($displayType.get() === "grid" ? "list" : "grid");
			},
			...this._options,
		});

		this.addIcon();
		this.registerStoreListeners();
	}

	public static make(options: core.BoxOptions = {}): core.BoxRenderable {
		return new this(options)._component;
	}

	private addIcon(): void {
		this._icon = new core.TextRenderable(ctx, {
			content: $displayType.get() === "list" ? "\udb81\udf58" : "\uf03a",
			fg: theme.fg,
			attributes: core.TextAttributes.BOLD,
			selectable: false,
		});

		this._component.add(this._icon);
	}

	private registerStoreListeners(): void {
		$displayType.listen((type: "list" | "grid"): void => {
			if (this._icon) {
				this._icon.content = type === "list" ? "\udb81\udf58" : "\uf03a";
			}
		});
	}
}
