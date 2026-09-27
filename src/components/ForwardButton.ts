import type * as core from "@opentui/core";
import { forward } from "../lib/navigation";
import { $forwardHistory } from "../lib/store";
import { IconButton } from "./IconButton";

export class ForwardButton {
	private _options: core.BoxOptions;
	private _component: core.BoxRenderable;

	constructor(options: core.BoxOptions) {
		this._options = options;

		this._component = IconButton.make({
			icon: "\uf061",
			marginRight: 1,
			opacity: 0.4,
			disabled: (): boolean => !$forwardHistory.get().length,
			onClick: forward,
			...this._options,
		});

		this.registerStoreListeners();
	}

	public static make(options: core.BoxOptions = {}): core.BoxRenderable {
		return new this(options)._component;
	}

	private registerStoreListeners(): void {
		$forwardHistory.listen((history: readonly string[]): void => {
			this._component.opacity = history.length ? 1 : 0.4;
		});
	}
}
