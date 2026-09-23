import * as core from "@opentui/core";
import { theme, trashPath } from "../lib/config";
import { ctx } from "../lib/context";
import { emptyTrash } from "../lib/filesystem";
import { $currentPath, $trashFull } from "../lib/store";
import { Confirmation } from "./Confirmation";

export class EmptyTrashButton {
	private _options: core.BoxOptions;
	private _component: core.BoxRenderable;
	private _label: core.TextRenderable | null = null;

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

				if (this._label) {
					this._label.fg = theme.bg;
				}
			},
			onMouseOut: () => {
				if (!$trashFull.get()) {
					return;
				}

				this._component.backgroundColor = undefined;

				if (this._label) {
					this._label.fg = theme.fg;
				}
			},
			onMouseDown: () => {
				if (!$trashFull.get()) {
					return;
				}

				this._component.backgroundColor = theme.fg_dark;

				if (this._label) {
					this._label.fg = theme.bg;
				}
			},
			onMouseUp: () => {
				if (!$trashFull.get()) {
					return;
				}

				this._component.backgroundColor = undefined;

				if (this._label) {
					this._label.fg = theme.fg;
				}

				Confirmation.make()
					.heading("Empty trash?")
					.description("Are you sure you want to empty your trash folder?")
					.variant("danger")
					.onConfirm((): void => {
						emptyTrash();
					});
			},
			...this._options,
		});

		this.addLabel();
		this.registerStoreListeners();
	}

	public static make(options: core.BoxOptions = {}): core.BoxRenderable {
		return new this(options)._component;
	}

	private addLabel(): void {
		this._label = new core.TextRenderable(ctx, {
			content: "\udb81\udecc Empty Trash",
			fg: theme.fg,
			attributes: core.TextAttributes.BOLD,
			selectable: false,
		});

		this._component.add(this._label);
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
