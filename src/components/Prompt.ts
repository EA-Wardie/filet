import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import { Button } from "./Button";

interface Options extends core.BoxOptions {
	heading: string;
	label: string;
	value?: string;
	onSubmit: (value: string) => void;
}

export class Prompt {
	private _options: Options;
	private _component: core.BoxRenderable;
	private _dialog: core.BoxRenderable | null = null;
	private _header: core.TextRenderable | null = null;
	private _input: core.InputRenderable | null = null;
	private _footer: core.BoxRenderable | null = null;

	constructor(options: Options) {
		this._options = options;

		this._component = new core.BoxRenderable(ctx, {
			width: "100%",
			height: "100%",
			backgroundColor: core.RGBA.fromHex("#ffffff1A"),
			alignItems: "center",
			justifyContent: "center",
			position: "absolute",
			top: 0,
			left: 0,
			zIndex: 100,
		});

		this.addDialog();
		this.addHeader();
		this.addInput();
		this.addFooter();
		this.registerKeyboardEvents();

		ctx.root.add(this._component);
	}

	public static make(options: Options): core.BoxRenderable {
		return new this(options)._component;
	}

	private addDialog(): void {
		this._dialog = new core.BoxRenderable(ctx, {
			width: 42,
			backgroundColor: theme.bg,
			border: true,
			borderColor: theme.border,
			paddingX: 1,
			zIndex: 101,
			...this._options,
		});

		this._component.add(this._dialog);
	}

	private addHeader(): void {
		this._header = new core.TextRenderable(ctx, {
			content: this._options.heading,
			wrapMode: "word",
			marginBottom: 1,
		});

		this._dialog?.add(this._header);
	}
	private addInput(): void {
		this._dialog?.add(
			new core.TextRenderable(ctx, {
				content: this._options.label,
				wrapMode: "word",
			}),
		);

		this._input = new core.InputRenderable(ctx, {
			value: this._options.value ?? "",
			backgroundColor: theme.fg_light,
			textColor: theme.fg,
			flexGrow: 1,
			marginBottom: 1,
		});

		this._dialog?.add(this._input);
	}

	private addFooter(): void {
		this._footer = new core.BoxRenderable(ctx, {
			width: "100%",
			flexDirection: "row",
			justifyContent: "flex-end",
			columnGap: 1,
		});

		this._footer?.add(
			Button.make({
				label: "\uf00d Cancel",
				onClick: () => {
					this._component.destroyRecursively();
				},
			}),
		);

		this._footer?.add(
			Button.make({
				label: "\uf00c Submit",
				variant: "success",
				onClick: () => {
					this._component.destroyRecursively();
					this._options.onSubmit(this._input?.value ?? "");
				},
			}),
		);

		this._dialog?.add(this._footer);
	}

	private registerKeyboardEvents(): void {
		ctx.keyInput.on("keypress", (key: core.KeyEvent): void => {
			if (key.name === "return") {
				this._input?.blur();
				this._options.onSubmit(this._input?.value ?? "");
				this._component.destroyRecursively();
			}

			if (key.name === "escape") {
				this._input?.blur();
				this._component.destroyRecursively();
			}
		});
	}
}
