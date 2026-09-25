import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";

type Variant = "default" | "success" | "danger";

interface Options extends core.BoxOptions {
	label: string;
	variant?: Variant;
	onClick: (event: core.MouseEvent) => void;
}

const BACKGROUND_COLORS: Record<
	Variant,
	{ idle: core.RGBA; pressed: core.RGBA }
> = {
	default: { idle: theme.fg, pressed: theme.fg_dark },
	success: { idle: theme.success, pressed: theme.success_dark },
	danger: { idle: theme.danger, pressed: theme.danger_dark },
};

export class Button {
	private _options: Options;
	private _variant: Variant;
	private _component: core.BoxRenderable;
	private _label: core.TextRenderable | null = null;

	constructor(options: Options) {
		this._options = options;
		this._variant = options.variant ?? "default";

		this._component = new core.BoxRenderable(ctx, {
			backgroundColor: this.getBackgroundColor(),
			alignItems: "center",
			paddingX: 1,
			onMouseDown: (): void => {
				this._component.backgroundColor = this.getBackgroundColor(true);
			},
			onMouseUp: (event: core.MouseEvent): void => {
				this._component.backgroundColor = this.getBackgroundColor();

				this._options.onClick(event);
			},
			...this._options,
		});

		this.addLabel();
	}

	public static make(options: Options): core.BoxRenderable {
		return new this(options)._component;
	}

	private getBackgroundColor(pressed: boolean = false): core.RGBA {
		const colors = BACKGROUND_COLORS[this._variant];

		return pressed ? colors.pressed : colors.idle;
	}

	private addLabel(): void {
		this._label = new core.TextRenderable(ctx, {
			content: this._options.label,
			fg: this._variant === "default" ? theme.bg : theme.fg,
			attributes: core.TextAttributes.BOLD,
			selectable: false,
		});

		this._component.add(this._label);
	}
}
