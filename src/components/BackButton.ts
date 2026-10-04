import type * as core from "@opentui/core";
import { back } from "../lib/navigation";
import { $backHistory } from "../lib/store";
import { IconButton } from "./IconButton";

export class BackButton {
	private _options: core.BoxOptions;
	private _component: core.BoxRenderable;

	constructor(options: core.BoxOptions) {
		this._options = options;

		this._component = IconButton.make({
			icon: "",
			opacity: 0.4,
			disabled: (): boolean => !$backHistory.get().length,
			onClick: back,
			...this._options,
		});

		this.registerStoreListeners();
	}

	public static make(options: core.BoxOptions = {}): core.BoxRenderable {
		return new this(options)._component;
	}

	private registerStoreListeners(): void {
		$backHistory.listen((history: readonly string[]): void => {
			this._component.opacity = history.length ? 1 : 0.4;
		});
	}
}
