import * as core from "@opentui/core";
import { MouseButtons } from "@opentui/core/testing";
import * as nanostores from "nanostores";
import { theme } from "../lib/config";
import { HOME_DIRECTORY } from "../lib/consts";
import { ctx } from "../lib/context";
import { goToPath, isInsidePath } from "../lib/navigation";
import { $currentPath } from "../lib/store";

const EXACT_PATHS: ReadonlySet<string> = new Set<string>([HOME_DIRECTORY, "/"]);

const $linkPaths = nanostores.atom<string[]>([]);

const $activePath = nanostores.computed(
	[$currentPath, $linkPaths],
	(current: string, paths: string[]): string | null => {
		let active: string | null = null;

		for (const path of paths) {
			const matches: boolean =
				path === current ||
				(!EXACT_PATHS.has(path) && isInsidePath(current, path));

			if (matches && (active === null || path.length > active.length)) {
				active = path;
			}
		}

		return active;
	},
);

export function registerSidebarPath(path: string): () => void {
	$linkPaths.set([...$linkPaths.get(), path]);

	return (): void => {
		const paths: string[] = [...$linkPaths.get()];
		const index: number = paths.indexOf(path);

		if (index < 0) {
			return;
		}

		paths.splice(index, 1);

		$linkPaths.set(paths);
	};
}

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
			backgroundColor: this.isCurrent($activePath.get())
				? theme.selected
				: theme.transparent,
			paddingX: 1,
			onMouseOver: (): void => {
				if (this.isCurrent($activePath.get())) {
					return;
				}

				this._component.backgroundColor = theme.hover;
			},
			onMouseOut: (): void => {
				if (this.isCurrent($activePath.get())) {
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

	private isCurrent(active: string | null): boolean {
		return active !== null && this._options.path === active;
	}

	private labelColor(active: string | null): core.RGBA {
		if (this.isCurrent(active)) {
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
			fg: this.labelColor($activePath.get()),
			attributes: core.TextAttributes.BOLD,
			selectable: false,
		});

		this._component.add(this._label);
	}

	private registerStoreEvents(): void {
		const unregister: () => void =
			this._options.path === null
				? (): void => {}
				: registerSidebarPath(this._options.path);
		const unbindActivePath: () => void = $activePath.subscribe(
			(active: string | null): void => {
				this._component.backgroundColor = this.isCurrent(active)
					? theme.selected
					: theme.transparent;

				if (this._label) {
					this._label.fg = this.labelColor(active);
				}
			},
		);

		this._component.once(core.RenderableEvents.DESTROYED, (): void => {
			unbindActivePath();
			unregister();
		});
	}
}
