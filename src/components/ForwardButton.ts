import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import { forward } from "../lib/navigation";
import { $forwardHistory } from "../lib/store";

export class ForwardButton {
	private _options: core.BoxOptions;
	private _component: core.BoxRenderable;
	private _icon: core.TextRenderable | null = null;

	constructor(options: core.BoxOptions) {
		this._options = options;

		this._component = new core.BoxRenderable(ctx, {
			flexDirection: "row",
			justifyContent: "center",
			paddingX: 1,
			marginRight: 1,
			opacity: 0.4,
			onMouseOver: () => {
				if (!$forwardHistory.get().length) {
					return;
				}

				this._component.backgroundColor = theme.fg;

				if (this._icon) {
					this._icon.fg = theme.bg;
				}
			},
			onMouseOut: () => {
				if (!$forwardHistory.get().length) {
					return;
				}

				this._component.backgroundColor = undefined;

				if (this._icon) {
					this._icon.fg = theme.fg;
				}
			},
			onMouseDown: () => {
				if (!$forwardHistory.get().length) {
					return;
				}

				this._component.backgroundColor = theme.fg_dark;

				if (this._icon) {
					this._icon.fg = theme.bg;
				}
			},
			onMouseUp: () => {
				if (!$forwardHistory.get().length) {
					return;
				}

				this._component.backgroundColor = undefined;

				if (this._icon) {
					this._icon.fg = theme.fg;
				}

				forward();
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
			content: "\uf061",
			fg: theme.fg,
			attributes: core.TextAttributes.BOLD,
			selectable: false,
		});

		this._component.add(this._icon);
	}

	private registerStoreListeners(): void {
		$forwardHistory.listen((history: readonly string[]): void => {
			this._component.opacity = history.length ? 1 : 0.4;
		});
	}
}
