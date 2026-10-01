import { readFile, type Stats, stat } from "node:fs";
import { extname } from "node:path";
import * as core from "@opentui/core";
import { theme } from "../lib/config";
import {
	BINARY_CHECK_SIZE,
	CODE_FILETYPES,
	IMAGE_FILETYPES,
	PREVIEW_MAX_SIZE,
	syntaxStyles,
} from "../lib/consts";
import { ctx } from "../lib/context";
import { logError } from "../lib/log";
import { Message } from "./Message";

interface Options extends core.BoxOptions {
	path: string;
}

export class Preview {
	private _options: Options;
	private _component: core.BoxRenderable;
	private _extension: string;

	constructor(options: Options) {
		this._options = options;
		this._extension = extname(this._options.path).toLowerCase();

		this._component = new core.BoxRenderable(ctx, {
			paddingX: 1,
			...this._options,
		});

		this.load();
	}

	public static make(options: Options): core.BoxRenderable {
		return new this(options)._component;
	}

	private load(): void {
		stat(
			this._options.path,
			(error: NodeJS.ErrnoException | null, stats: Stats): void => {
				if (this._component.isDestroyed) {
					return;
				}

				if (error || !stats.isFile()) {
					this.addNoPreview();

					return;
				}

				if (IMAGE_FILETYPES.has(this._extension)) {
					this.addImage();

					return;
				}

				if (stats.size > PREVIEW_MAX_SIZE) {
					this.addMessage("  --Too Large To Preview--");

					return;
				}

				this.addCode();
			},
		);
	}

	private addNoPreview(): void {
		this.addMessage("\uf05e  --No Preview--");
	}

	private addMessage(content: string): void {
		this._component.add(Message.make({ content: content }));
	}

	private addImage(): void {
		const image: core.ImageRenderable = new core.ImageRenderable(ctx, {
			width: "100%",
			height: "100%",
			source: this._options.path,
			fit: "fit",
			onError: (error: unknown): void => {
				image.destroy();

				this.addImageError(error);
			},
		});

		this._component.add(image);
	}

	private addImageError(error: unknown): void {
		const code: string | null =
			error instanceof core.ImageError ? error.code : null;

		if (code === "dimension-limit" || code === "memory-limit") {
			this.addMessage("  --Image Too Large To Preview--");

			return;
		}

		if (code !== "unsupported-format") {
			logError(error);
		}

		this.addNoPreview();
	}

	private addCode(): void {
		readFile(
			this._options.path,
			async (
				error: NodeJS.ErrnoException | null,
				buffer: Buffer,
			): Promise<void> => {
				if (this._component.isDestroyed) {
					return;
				}

				if (error) {
					this.addNoPreview();

					return;
				}

				if (buffer.subarray(0, BINARY_CHECK_SIZE).includes(0)) {
					this.addMessage("  --Binary File--");

					return;
				}

				const tsClient: core.TreeSitterClient = core.getTreeSitterClient();

				await tsClient.initialize();

				if (this._component.isDestroyed) {
					return;
				}

				const code: core.CodeRenderable = new core.CodeRenderable(ctx, {
					width: "100%",
					height: "100%",
					content: buffer.toString("utf-8"),
					wrapMode: "word",
					syntaxStyle: syntaxStyles(),
					flexGrow: 1,
					filetype: CODE_FILETYPES[this._extension] ?? "text",
					treeSitterClient: tsClient,
				});

				this._component.add(
					new core.LineNumberRenderable(ctx, {
						minWidth: 0,
						paddingRight: 1,
						fg: theme.fg,
						target: code,
					}),
				);
			},
		);
	}
}
