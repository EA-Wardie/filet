import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import { isTrashPath } from "../lib/navigation";
import { $currentPath, $searchTerm } from "../lib/store";
import { IconButton } from "./IconButton";

export class DirectorySearch {
	private _options: core.BoxOptions;
	private _component: core.BoxRenderable;
	private _button: core.BoxRenderable | null = null;
	private _input: core.InputRenderable | null = null;

	constructor(options: core.BoxOptions) {
		this._options = options;

		this._component = new core.BoxRenderable(ctx, {
			maxWidth: 50,
			flexDirection: "row",
			flexGrow: 0,
			visible: !isTrashPath($currentPath.get()),
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
		this._button = IconButton.make({
			icon: "\uf002",
			onClick: (): void => {
				if (this._input?.visible) {
					this.clearSearch();
				} else {
					this.showInput();
				}
			},
		});

		this._component.add(this._button);
	}

	private showInput(): void {
		if (this._button && this._input) {
			this._button.visible = false;
			this._input.visible = true;
			this._component.flexGrow = 1;

			this._input.focus();
		}
	}

	private clearSearch(): void {
		$searchTerm.set("");

		this.hideInput();
	}

	private hideInput(): void {
		if (this._button && this._input) {
			this._input.value = "";
			this._button.visible = true;
			this._input.visible = false;
			this._component.flexGrow = 0;

			this._input.blur();
		}
	}

	private addInput(): void {
		this._input = new core.InputRenderable(ctx, {
			maxWidth: 50,
			value: $searchTerm.get(),
			placeholder: "Search...",
			placeholderColor: theme.fg_dark,
			textColor: theme.fg,
			cursorColor: theme.fg,
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
			this._component.visible = !isTrashPath(path);

			this.hideInput();
		});
	}

	private registerKeyboardEvents(): void {
		ctx.keyInput.on("keypress", (key: core.KeyEvent): void => {
			if (key.name === "escape" && this._input?.visible) {
				this.clearSearch();
			}
		});
	}
}
