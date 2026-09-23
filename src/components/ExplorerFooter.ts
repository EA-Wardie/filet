import type { Dirent } from "node:fs";
import * as core from "@opentui/core";
import { version } from "../../package.json";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import { $copyDirent, $cutDirent } from "../lib/store";

export class ExplorerFooter {
	private _options: core.BoxOptions;
	private _component: core.BoxRenderable;
	private _text: core.TextRenderable | null = null;

	constructor(options: core.BoxOptions) {
		this._options = options;

		this._component = new core.BoxRenderable(ctx, {
			border: ["top", "bottom"],
			borderColor: theme.border,
			bottomTitle: ` v${version} `,
			bottomTitleAlignment: "right",
			flexDirection: "row",
			justifyContent: "center",
			paddingX: 1,
			...this._options,
		});

		this.addText();
		this.registerStoreEvents();
	}

	public static make(options: core.BoxOptions = {}): core.BoxRenderable {
		return new this(options)._component;
	}

	private addText(): void {
		this._text = new core.TextRenderable(ctx, {
			content: "",
			fg: theme.fg,
		});

		this._component.add(this._text);
	}

	private registerStoreEvents(): void {
		$copyDirent.subscribe((dirent: Dirent | null): void => {
			if (dirent) {
				if (this._text) {
					this._text.content = `Copied ${dirent.name} to clipboard`;
				}
			} else {
				if (this._text) {
					this._text.content = "";
				}
			}
		});

		$cutDirent.subscribe((dirent: Dirent | null): void => {
			if (dirent) {
				if (this._text) {
					this._text.content = `Cut ${dirent.name} to clipboard`;
				}
			} else {
				if (this._text) {
					this._text.content = "";
				}
			}
		});
	}
}
