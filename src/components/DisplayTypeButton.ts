import type * as core from "@opentui/core";
import type { DisplayType } from "../lib/consts";
import { $displayType } from "../lib/store";
import { IconButton } from "./IconButton";

export class DisplayTypeButton {
	private _options: core.BoxOptions;
	private _button: IconButton;
	private _component: core.BoxRenderable;

	constructor(options: core.BoxOptions) {
		this._options = options;

		this._button = new IconButton({
			icon: this.getIcon($displayType.get()),
			onClick: (): void => {
				$displayType.set($displayType.get() === "columns" ? "list" : "columns");
			},
			...this._options,
		});

		this._component = this._button.component;

		this.registerStoreListeners();
	}

	public static make(options: core.BoxOptions = {}): core.BoxRenderable {
		return new this(options)._component;
	}

	private getIcon(type: DisplayType): string {
		return type === "list" ? "\uf0db" : "\uf03a";
	}

	private registerStoreListeners(): void {
		$displayType.listen((type: DisplayType): void => {
			this._button.setIcon(this.getIcon(type));
		});
	}
}
