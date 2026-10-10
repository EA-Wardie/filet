import type { Dirent } from "node:fs";
import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import { getFileIcon } from "../lib/icons";
import { type Property, readProperties } from "../lib/properties";
import { $dialogOpen } from "../lib/store";
import { Button } from "./Button";
import { Message } from "./Message";

interface Options {
	dirent: Dirent;
}

export class Properties {
	private _options: Options;
	private _component: core.BoxRenderable;
	private _dialog: core.BoxRenderable | null = null;
	private _header: core.TextRenderable | null = null;
	private _body: core.BoxRenderable | null = null;
	private _values: Map<string, core.TextRenderable> = new Map<
		string,
		core.TextRenderable
	>();
	private _footer: core.BoxRenderable | null = null;
	private _abort: AbortController = new AbortController();

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

		readProperties(
			this._options.dirent,
			this._abort.signal,
			(properties: Property[] | null): void => {
				this.load(properties);
			},
			(label: string, value: string): void => {
				this.update(label, value);
			},
		);
	}

	public static make(options: Options): core.BoxRenderable | null {
		if ($dialogOpen.get()) {
			return null;
		}

		return new this(options)._component;
	}

	private addDialog(): void {
		this._dialog = new core.BoxRenderable(ctx, {
			width: 56,
			backgroundColor: theme.surface,
			border: true,
			borderColor: theme.border,
			paddingX: 1,
			zIndex: 101,
		});

		this._component.add(this._dialog);
	}

	private addHeader(): void {
		const { dirent } = this._options;

		this._header = new core.TextRenderable(ctx, {
			content: `${getFileIcon(dirent)} ${dirent.name}`,
			fg: theme.fg,
			wrapMode: "char",
			marginBottom: 1,
		});

		this._dialog?.add(this._header);
	}

	private addBody(): void {
		this._body = new core.BoxRenderable(ctx, {
			width: "100%",
			marginBottom: 1,
		});

		this._dialog?.add(this._body);
	}

	private addRow({ label, value }: Property): void {
		const row: core.BoxRenderable = new core.BoxRenderable(ctx, {
			width: "100%",
			flexDirection: "row",
		});

		row.add(
			new core.TextRenderable(ctx, {
				content: label,
				fg: theme.muted,
				width: 12,
				flexShrink: 0,
				selectable: false,
			}),
		);

		const text: core.TextRenderable = new core.TextRenderable(ctx, {
			content: value,
			fg: theme.fg,
			wrapMode: "char",
			flexGrow: 1,
			flexShrink: 1,
		});

		row.add(text);

		this._values.set(label, text);
		this._body?.add(row);
	}

	private load(properties: Property[] | null): void {
		if (!properties) {
			this._body?.add(Message.make({ content: "Can't read properties" }));

			return;
		}

		for (const property of properties) {
			this.addRow(property);
		}
	}

	private update(label: string, value: string): void {
		const text: core.TextRenderable | undefined = this._values.get(label);

		if (text) {
			text.content = value;
		}
	}

	private addFooter(): void {
		this._footer = new core.BoxRenderable(ctx, {
			width: "100%",
			flexDirection: "row",
			justifyContent: "flex-end",
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
		this._abort.abort();

		ctx.keyInput.off("keypress", this.onKeypress);
		this._component.destroyRecursively();

		$dialogOpen.set(false);
	}
}
