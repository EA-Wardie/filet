import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import { BackButton } from "./BackButton";
import { CurrentPathInput } from "./CurrentPathInput";
import { DisplayTypeToggle } from "./DisplayTypeToggle";
import { EmptyTrashButton } from "./EmptyTrashButton";
import { ForwardButton } from "./ForwardButton";
import { Spacer } from "./Spacer";

export class ExplorerHeader {
	private _options: core.BoxOptions;
	private _component: core.BoxRenderable;

	constructor(options: core.BoxOptions) {
		this._options = options;

		this._component = new core.BoxRenderable(ctx, {
			border: ["top", "bottom"],
			borderColor: theme.border,
			flexDirection: "row",
			paddingX: 1,
			...this._options,
		});

		this.addComponents();
	}

	public static make(options: core.BoxOptions = {}): core.BoxRenderable {
		return new this(options)._component;
	}

	public addComponents(): void {
		this._component.add(BackButton.make());
		this._component.add(ForwardButton.make());
		this._component.add(CurrentPathInput.make());
		this._component.add(Spacer.make());
		this._component.add(EmptyTrashButton.make());
		this._component.add(DisplayTypeToggle.make());
	}
}
