import * as core from "@opentui/core";
import { MouseButtons } from "@opentui/core/testing";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import { go } from "../lib/navigation";
import { $currentPath, $selectedSidebarLink } from "../lib/store";
import { Component } from "./Component";

export class SidebarLink extends Component<core.BoxRenderable> {
	private _path: string | null = null;
	private _label: core.TextRenderable;

	constructor() {
		super(
			new core.BoxRenderable(ctx, {
				paddingX: 1,
			}),
		);

		this._label = new core.TextRenderable(ctx, {
			content: "",
			fg: theme.fg,
			attributes: core.TextAttributes.BOLD,
			selectable: false,
		});

		this.component.add(this._label);

		this.registerEvents();

		$selectedSidebarLink.subscribe((link: Readonly<SidebarLink> | null) => {
			if (link === this) {
				this.component.backgroundColor = theme.fg_dark;
				this._label.fg = theme.bg;
			} else {
				this.component.backgroundColor = undefined;
				this._label.fg = theme.fg;
			}
		});

		$currentPath.subscribe((path: string): void => {
			if (this._path === path) {
				$selectedSidebarLink.set(this);
			}
		});
	}

	private registerEvents(): void {
		this.component.onMouseOver = (): void => {
			if ($selectedSidebarLink.get() !== this) {
				this.component.backgroundColor = theme.fg_light;
			}
		};

		this.component.onMouseOut = (): void => {
			if ($selectedSidebarLink.get() !== this) {
				this.component.backgroundColor = undefined;
			}
		};

		this.component.onMouseDown = (event: core.MouseEvent): void => {
			if (event.button === MouseButtons.LEFT) {
				$selectedSidebarLink.set(this);

				if (this._path) {
					go(this._path);
				}
			}
		};
	}

	public static make(): SidebarLink {
		return new this();
	}

	public path(path: string): this {
		this._path = path;

		return this;
	}

	public label(label: string): this {
		this._label.content = label;

		return this;
	}
}
