import * as core from "@opentui/core";
import { MouseButtons } from "@opentui/core/testing";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import { goToPath } from "../lib/navigation";
import { $currentPath } from "../lib/store";

interface Options extends core.BoxOptions {
	path: string;
	label: string;
}

export class SidebarLink {
	private _options: Options;
	private _component: core.BoxRenderable;
	private _label: core.TextRenderable | null = null;

	constructor(options: Options) {
		this._options = options;

		this._component = new core.BoxRenderable(ctx, {
			backgroundColor:
				$currentPath.get() === this._options.path ? theme.fg_dark : undefined,
			paddingX: 1,
			onMouseOver: (): void => {
				if ($currentPath.get() === this._options.path) {
					return;
				}

				this._component.backgroundColor = theme.fg_light;
			},
			onMouseOut: (): void => {
				if ($currentPath.get() === this._options.path) {
					return;
				}

				this._component.backgroundColor = undefined;
			},
			onMouseDown: (event: core.MouseEvent): void => {
				if (event.button === MouseButtons.LEFT) {
					goToPath(this._options.path);
				}
			},
			...this._options,
		});

		this.addLabel();
		this.registerStoreEvents();
	}

	public static make(options: Options): core.BoxRenderable {
		return new this(options)._component;
	}

	private addLabel(): void {
		this._label = new core.TextRenderable(ctx, {
			content: this._options.label,
			fg: $currentPath.get() === this._options.path ? theme.bg : theme.fg,
			attributes: core.TextAttributes.BOLD,
			selectable: false,
		});

		this._component.add(this._label);
	}

	private registerStoreEvents(): void {
		$currentPath.listen((path: string): void => {
			if (this._options.path === path) {
				this._component.backgroundColor = theme.fg_dark;

				if (this._label) {
					this._label.fg = theme.bg;
				}
			} else {
				this._component.backgroundColor = undefined;

				if (this._label) {
					this._label.fg = theme.fg;
				}
			}
		});
	}
}
