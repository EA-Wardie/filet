import * as core from "@opentui/core";
import { theme, trashPath } from "../lib/config";
import { ctx } from "../lib/context";
import { $currentPath, $searchTerm } from "../lib/store";

export class DirectorySearch {
	private _options: core.BoxOptions;
	private _component: core.BoxRenderable;
	private _button: core.BoxRenderable | null = null;
	private _icon: core.TextRenderable | null = null;
	private _input: core.InputRenderable | null = null;

	constructor(options: core.BoxOptions) {
		this._options = options;

		this._component = new core.BoxRenderable(ctx, {
			flexDirection: "row",
			flexGrow: 0,
			visible: !$currentPath.get().includes(trashPath),
			...this._options,
		});

		this.addButton();
		this.addInput();
		this.registerStoreEvents();
		this.registerKeyboardEvents();
	}

	public static make(options: core.BoxOptions = {}): core.BoxRenderable {
		return new this(options)._component;
	}

	private addButton(): void {
		this._button = new core.BoxRenderable(ctx, {
			flexDirection: "row",
			flexShrink: 1,
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

				if (this._button && this._input) {
					this._button.visible = !this._button.visible;
					this._input.visible = !this._input.visible;
					this._component.flexGrow = !this._button.visible ? 1 : 0;
				}
			},
		});

		this._icon = new core.TextRenderable(ctx, {
			content: "\uf002",
			fg: theme.fg,
			attributes: core.TextAttributes.BOLD,
			selectable: false,
		});

		this._button.add(this._icon);
		this._component.add(this._button);
	}

	private addInput(): void {
		this._input = new core.InputRenderable(ctx, {
			value: $searchTerm.get(),
			placeholder: "Search...",
			focusedBackgroundColor: theme.bg_light,
			flexGrow: 1,
			visible: false,
		});

		this._input.on(core.InputRenderableEvents.ENTER, (value: string) => {
			$searchTerm.set(value);

			this._input?.blur();
		});

		this._component.add(this._input);
	}

	private registerStoreEvents(): void {
		$currentPath.listen((path: string) => {
			this._component.visible = !path.includes(trashPath);
		});
	}

	private registerKeyboardEvents(): void {
		ctx.keyInput.on("keypress", (key: core.KeyEvent): void => {
			if (key.name === "escape" && this._input) {
				this._input.blur();
			}
		});
	}
}
