import { readFile } from "node:fs";
import { extname } from "node:path";
import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { CODE_FILETYPES, IMAGE_FILETYPES, syntaxStyles } from "../lib/consts";
import { ctx } from "../lib/context";
import { logError } from "../lib/log";
import { $currentPath } from "../lib/store";

export class Preview {
	private _options: core.BoxOptions;
	private _component: core.BoxRenderable;
	private _path: string;
	private _code: core.CodeRenderable | null = null;
	private _lineNumbers: core.LineNumberRenderable | null = null;
	private _image: core.ImageRenderable | null = null;

	constructor(options: core.BoxOptions) {
		this._options = options;
		this._path = $currentPath.get();

		this._component = new core.BoxRenderable(ctx, {
			paddingX: 1,
			...this._options,
		});

		if (IMAGE_FILETYPES.has(extname(this._path).toLowerCase())) {
			this.addImage();
		} else {
			this.addCode();
		}
	}

	public static make(options: core.BoxOptions = {}): core.BoxRenderable {
		return new this(options)._component;
	}

	private addImage(): void {
		this._image = new core.ImageRenderable(ctx, {
			width: "100%",
			height: "100%",
			source: this._path,
			fit: "fit",
		});

		this._component.add(this._image);
	}

	private addCode(): void {
		readFile(
			this._path,
			{ encoding: "utf-8" },
			async (
				error: NodeJS.ErrnoException | null,
				content: string,
			): Promise<void> => {
				if (this._component.isDestroyed) {
					return;
				}

				if (error) {
					logError(error);

					return;
				}

				const tsClient: core.TreeSitterClient = core.getTreeSitterClient();

				await tsClient.initialize();

				if (this._component.isDestroyed) {
					return;
				}

				this._code = new core.CodeRenderable(ctx, {
					width: "100%",
					height: "100%",
					content: content,
					wrapMode: "word",
					syntaxStyle: syntaxStyles(),
					flexGrow: 1,
					filetype: CODE_FILETYPES[extname(this._path).toLowerCase()] ?? "text",
					treeSitterClient: tsClient,
				});

				this._lineNumbers = new core.LineNumberRenderable(ctx, {
					minWidth: 0,
					paddingRight: 1,
					fg: theme.fg,
					target: this._code,
				});

				this._component.add(this._lineNumbers);
			},
		);
	}
}
