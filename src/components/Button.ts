import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";

export type ButtonVaraintType = "default" | "success" | "danger" | "link";

interface Options extends core.BoxOptions {
	label: string;
	variant?: "default" | "success" | "danger";
	onClick: (event: core.MouseEvent) => void;
}

export class Button {
	private _options: Options;
	private _component: core.BoxRenderable;
	private _label: core.TextRenderable | null = null;

	constructor(options: Options) {
		this._options = options;

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

	private getBackgroundColor(dark: boolean = false): core.RGBA {
		if (this._options.variant === "success") {
			return dark ? theme.success_dark : theme.success;
		} else if (this._options.variant === "danger") {
			return dark ? theme.danger_dark : theme.danger;
		} else {
			return dark ? theme.fg_dark : theme.fg;
		}
	}

	private addLabel(): void {
		this._label = new core.TextRenderable(ctx, {
			content: this._options.label,
			fg: theme.bg,
			attributes: core.TextAttributes.BOLD,
			selectable: false,
		});

		this._component.add(this._label);
	}
}

// export class Button extends Component<core.BoxRenderable> {
// 	private _label: core.TextRenderable;
// 	private _callback: (() => void) | null = null;
// 	private _disabled: boolean = false;

// 	constructor() {
// 		super(
// 			new core.BoxRenderable(ctx, {
// 				backgroundColor: theme.fg,
// 				alignItems: "center",
// 				paddingX: 1,
// 			}),
// 		);

// 		this._label = new core.TextRenderable(ctx, {
// 			content: "Button",
// 			fg: theme.bg,
// 			attributes: core.TextAttributes.BOLD,
// 			selectable: false,
// 		});

// 		this.component.add(this._label);

// 		this.registerEvents();
// 	}

// 	private guard(handler: () => void): () => void {
// 		return (): void => {
// 			if (this._disabled) {
// 				return;
// 			}

// 			handler();
// 		};
// 	}

// 	private registerEvents(): void {
// 		this.component.onMouseOver = this.guard((): void => {
// 			this.component.backgroundColor = theme.fg_dark;
// 		});

// 		this.component.onMouseOut = this.guard((): void => {
// 			this.component.backgroundColor = theme.fg;
// 		});

// 		this.component.onMouseDown = this.guard((): void => {
// 			this.component.backgroundColor = theme.fg;

// 			this._callback?.();
// 		});

// 		this.component.onMouseUp = (): void => {
// 			this.component.backgroundColor = theme.fg_dark;
// 		};
// 	}

// 	public static make(): Button {
// 		return new this();
// 	}

// 	public label(label: string): this {
// 		this._label.content = label;

// 		return this;
// 	}

// 	public variant(variant: ButtonVaraintType): this {
// 		if (variant === "success") {
// 			this.component.backgroundColor = theme.success;
// 			this._label.fg = theme.fg;

// 			this.component.onMouseOver = this.guard((): void => {
// 				this.component.backgroundColor = theme.success_dark;
// 			});

// 			this.component.onMouseOut = this.guard((): void => {
// 				this.component.backgroundColor = theme.success;
// 			});

// 			this.component.onMouseDown = this.guard((): void => {
// 				this.component.backgroundColor = theme.success;

// 				this._callback?.();
// 			});

// 			this.component.onMouseUp = (): void => {
// 				this.component.backgroundColor = theme.success_dark;
// 			};
// 		} else if (variant === "danger") {
// 			this.component.backgroundColor = theme.danger;
// 			this._label.fg = theme.fg;

// 			this.component.onMouseOver = this.guard((): void => {
// 				this.component.backgroundColor = theme.danger_dark;
// 			});

// 			this.component.onMouseOut = this.guard((): void => {
// 				this.component.backgroundColor = theme.danger;
// 			});

// 			this.component.onMouseDown = this.guard((): void => {
// 				this.component.backgroundColor = theme.danger;

// 				this._callback?.();
// 			});

// 			this.component.onMouseUp = (): void => {
// 				this.component.backgroundColor = theme.danger_dark;
// 			};
// 		} else if (variant === "link") {
// 			this.component.backgroundColor = undefined;
// 			this.component.alignItems = "flex-start";
// 			this._label.fg = theme.fg;

// 			this.component.onMouseOver = this.guard((): void => {
// 				this.component.backgroundColor = theme.fg_light;
// 			});

// 			this.component.onMouseOut = this.guard((): void => {
// 				this.component.backgroundColor = undefined;
// 			});

// 			this.component.onMouseDown = this.guard((): void => {
// 				this.component.backgroundColor = theme.fg_dark;
// 				this._label.fg = theme.bg;

// 				this._callback?.();
// 			});

// 			this.component.onMouseUp = (): void => {
// 				this.component.backgroundColor = undefined;
// 				this._label.fg = theme.fg;
// 			};
// 		}

// 		return this;
// 	}

// 	public onClick(callback: () => void): this {
// 		this._callback = callback;

// 		return this;
// 	}
// }
