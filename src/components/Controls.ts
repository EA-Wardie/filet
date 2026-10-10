import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { CONTROLS_ICON } from "../lib/consts";
import { ctx } from "../lib/context";
import { $dialogOpen } from "../lib/store";
import { Button } from "./Button";

export interface Control {
	input: string;
	action: string;
}

interface Options {
	keyboard: Control[];
}

const MOUSE_CONTROLS: Control[] = [
	{
		input: "Left click",
		action: "Select an entry and clear marks, or open a link",
	},
	{ input: "Double click", action: "Open the file or folder" },
	{ input: "Ctrl+click", action: "Mark or unmark the entry, and select it" },
	{
		input: "Right click",
		action: "Open the entry's context menu, or the explorer's",
	},
	{ input: "Scroll", action: "Scroll the explorer, preview and lists" },
];

export class Controls {
	private _options: Options;
	private _component: core.BoxRenderable;
	private _dialog: core.BoxRenderable | null = null;
	private _header: core.TextRenderable | null = null;
	private _body: core.ScrollBoxRenderable | null = null;
	private _footer: core.BoxRenderable | null = null;
	private _lines: number = 0;

	constructor(options: Options) {
		this._options = options;

		this._component = new core.BoxRenderable(ctx, {
			width: "100%",
			height: "100%",
			alignItems: "center",
			justifyContent: "center",
			position: "absolute",
			top: 0,
			left: 0,
			zIndex: 100,
		});

		this.addDialog();
		this.addHeader();
		this.addBody();
		this.addFooter();

		ctx.keyInput.on("keypress", this.onKeypress);
		ctx.root.add(this._component);

		$dialogOpen.set(true);

		this._body?.focus();
	}

	public static make(options: Options): core.BoxRenderable | null {
		if ($dialogOpen.get()) {
			return null;
		}

		return new this(options)._component;
	}

	private addDialog(): void {
		this._dialog = new core.BoxRenderable(ctx, {
			width: 68,
			maxWidth: "90%",
			maxHeight: "90%",
			backgroundColor: theme.surface,
			border: true,
			borderColor: theme.border,
			paddingX: 1,
			zIndex: 101,
		});

		this._component.add(this._dialog);
	}

	private addHeader(): void {
		this._header = new core.TextRenderable(ctx, {
			content: `${CONTROLS_ICON} Controls`,
			fg: theme.fg,
			marginBottom: 1,
			flexShrink: 0,
			selectable: false,
		});

		this._dialog?.add(this._header);
	}

	private addBody(): void {
		this._body = new core.ScrollBoxRenderable(ctx, {
			width: "100%",
			flexGrow: 1,
			flexShrink: 1,
			marginBottom: 1,
			scrollbarOptions: {
				trackOptions: {
					foregroundColor: theme.scrollbar_thumb,
					backgroundColor: theme.scrollbar_track,
				},
			},
		});

		this.addSection("Keyboard");

		for (const control of this._options.keyboard) {
			this.addRow(control);
		}

		this.addSection("Mouse", 1);

		for (const control of MOUSE_CONTROLS) {
			this.addRow(control);
		}

		this._body.maxHeight = this._lines;
		this._dialog?.add(this._body);
	}

	private addSection(title: string, marginTop: number = 0): void {
		this._lines += marginTop + 1;
		this._body?.add(
			new core.TextRenderable(ctx, {
				content: title,
				fg: theme.muted,
				attributes: core.TextAttributes.BOLD,
				marginTop: marginTop,
				selectable: false,
			}),
		);
	}

	private addRow({ input, action }: Control): void {
		this._lines += 1;

		const row: core.BoxRenderable = new core.BoxRenderable(ctx, {
			width: "100%",
			flexDirection: "row",
		});

		row.add(
			new core.TextRenderable(ctx, {
				content: input,
				fg: theme.fg,
				attributes: core.TextAttributes.BOLD,
				width: 14,
				flexShrink: 0,
				selectable: false,
			}),
		);

		row.add(
			new core.TextRenderable(ctx, {
				content: action,
				fg: theme.fg,
				wrapMode: "none",
				truncate: true,
				flexGrow: 1,
				flexShrink: 1,
			}),
		);

		this._body?.add(row);
	}

	private addFooter(): void {
		this._footer = new core.BoxRenderable(ctx, {
			width: "100%",
			flexDirection: "row",
			justifyContent: "flex-end",
			flexShrink: 0,
		});

		this._footer.add(
			Button.make({
				label: " Close",
				onClick: (): void => {
					this.close();
				},
			}),
		);

		this._dialog?.add(this._footer);
	}

	private onKeypress = (key: core.KeyEvent): void => {
		if (key.name === "return" || key.name === "escape") {
			this.close();
		}
	};

	private close(): void {
		ctx.keyInput.off("keypress", this.onKeypress);
		this._component.destroyRecursively();

		$dialogOpen.set(false);
	}
}
