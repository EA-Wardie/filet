import * as core from "@opentui/core";
import { MouseButtons } from "@opentui/core/testing";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import { goToPath } from "../lib/navigation";
import { $currentPath } from "../lib/store";

interface Options extends core.BoxOptions {
	path: string | null;
	label: string;
	muted?: boolean;
	onClick?: () => void;
	onMenu?: (event: core.MouseEvent) => void;
}

export class SidebarLink {
	private _options: Options;
	private _component: core.BoxRenderable;
	private _label: core.TextRenderable | null = null;

	constructor(options: Options) {
		this._options = options;

		this._component = new core.BoxRenderable(ctx, {
			backgroundColor: this.isCurrent($currentPath.get())
				? theme.selected
				: theme.transparent,
			paddingX: 1,
			onMouseOver: (): void => {
				if (this.isCurrent($currentPath.get())) {
					return;
				}

				this._component.backgroundColor = theme.hover;
			},
			onMouseOut: (): void => {
				if (this.isCurrent($currentPath.get())) {
					return;
				}

				this._component.backgroundColor = theme.transparent;
			},
			onMouseDown: (event: core.MouseEvent): void => {
				if (event.button === MouseButtons.LEFT) {
					this.click();
				} else if (event.button === MouseButtons.RIGHT) {
					this._options.onMenu?.(event);
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

	private isCurrent(path: string): boolean {
		return this._options.path === path;
	}

	private labelColor(path: string): core.RGBA {
		if (this.isCurrent(path)) {
			return theme.fg_inverse;
		}

		return this._options.muted ? theme.muted : theme.fg;
	}

	private click(): void {
		if (this._options.onClick) {
			this._options.onClick();

			return;
		}

		if (this._options.path !== null) {
			goToPath(this._options.path);
		}
	}

	private addLabel(): void {
		this._label = new core.TextRenderable(ctx, {
			content: this._options.label,
			fg: this.labelColor($currentPath.get()),
			attributes: core.TextAttributes.BOLD,
			selectable: false,
		});

		this._component.add(this._label);
	}

	private registerStoreEvents(): void {
		const unbindCurrentPath: () => void = $currentPath.listen(
			(path: string): void => {
				this._component.backgroundColor = this.isCurrent(path)
					? theme.selected
					: theme.transparent;

				if (this._label) {
					this._label.fg = this.labelColor(path);
				}
			},
		);

		this._component.once(core.RenderableEvents.DESTROYED, unbindCurrentPath);
	}
}
