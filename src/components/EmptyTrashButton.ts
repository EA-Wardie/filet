import * as core from "@opentui/core";
import { theme, trashPath } from "../lib/config";
import { ctx } from "../lib/context";
import { emptyTrash } from "../lib/filesystem";
import { $currentPath, $trashFull } from "../lib/store";
import { Confirmation } from "./Confirmation";

export class EmptyTrashButton {
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
			visible: $currentPath.get().includes(trashPath),
			onMouseOver: () => {
				if (!$trashFull.get()) {
					return;
				}

				this._component.backgroundColor = theme.fg;

				if (this._icon) {
					this._icon.fg = theme.bg;
				}
			},
			onMouseOut: () => {
				if (!$trashFull.get()) {
					return;
				}

				this._component.backgroundColor = undefined;

				if (this._icon) {
					this._icon.fg = theme.fg;
				}
			},
			onMouseDown: () => {
				if (!$trashFull.get()) {
					return;
				}

				this._component.backgroundColor = theme.fg_dark;

				if (this._icon) {
					this._icon.fg = theme.bg;
				}
			},
			onMouseUp: () => {
				if (!$trashFull.get()) {
					return;
				}

				this._component.backgroundColor = undefined;

				if (this._icon) {
					this._icon.fg = theme.fg;
				}

				Confirmation.make({
					heading: "Empty trash?",
					description: "Are you sure you want to empty your trash folder?",
					variant: "danger",
					onConfirm: (): void => {
						emptyTrash();
					},
				});
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
			content: "\uf48e",
			fg: theme.fg,
			attributes: core.TextAttributes.BOLD,
			selectable: false,
		});

		this._component.add(this._icon);
	}

	private registerStoreListeners(): void {
		$currentPath.listen((path: string): void => {
			this._component.visible = path.includes(trashPath);
		});

		$trashFull.listen((full: boolean): void => {
			this._component.opacity = full ? 1 : 0.4;
		});
	}
}
