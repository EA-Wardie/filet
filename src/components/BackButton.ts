import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import { back } from "../lib/navigation";
import { $backHistory } from "../lib/store";

export class BackButton {
	private _options: core.BoxOptions;
	private _component: core.BoxRenderable;
	private _icon: core.TextRenderable | null = null;

	constructor(options: core.BoxOptions) {
		this._options = options;

		this._component = new core.BoxRenderable(ctx, {
			flexDirection: "row",
			justifyContent: "center",
			paddingX: 1,
			opacity: 0.4,
			onMouseOver: () => {
				if (!$backHistory.get().length) {
					return;
				}

				this._component.backgroundColor = theme.fg;

				if (this._icon) {
					this._icon.fg = theme.bg;
				}
			},
			onMouseOut: () => {
				if (!$backHistory.get().length) {
					return;
				}

				this._component.backgroundColor = undefined;

				if (this._icon) {
					this._icon.fg = theme.fg;
				}
			},
			onMouseDown: () => {
				if (!$backHistory.get().length) {
					return;
				}

				this._component.backgroundColor = theme.fg_dark;

				if (this._icon) {
					this._icon.fg = theme.bg;
				}
			},
			onMouseUp: () => {
				if (!$backHistory.get().length) {
					return;
				}

				this._component.backgroundColor = undefined;

				if (this._icon) {
					this._icon.fg = theme.fg;
				}

				back();
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
			content: "\uf060",
			fg: theme.fg,
			attributes: core.TextAttributes.BOLD,
			selectable: false,
		});

		this._component.add(this._icon);
	}

	private registerStoreListeners(): void {
		$backHistory.listen((history: readonly string[]): void => {
			this._component.opacity = history.length ? 1 : 0.4;
		});
	}
}
