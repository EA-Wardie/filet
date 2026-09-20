import { readFile } from "node:fs";
import { extname } from "node:path";
import * as core from "@opentui/core";
import { ctx, syntaxStyles } from "../lib/context";
import { CODE_FILETYPES, IMAGE_FILETYPES } from "../lib/filesystem";
import { $currentPath } from "../lib/store";
import { Component } from "./Component";

export class Preview extends Component<core.BoxRenderable> {
	private _code: core.CodeRenderable;
	private _lineNumbers: core.LineNumberRenderable;
	private _markdown: core.MarkdownRenderable;
	private _image: core.ImageRenderable;

	constructor() {
		super(
			new core.BoxRenderable(ctx, {
				paddingX: 1,
			}),
		);

		this._code = new core.CodeRenderable(ctx, {
			width: "100%",
			height: "100%",
			content: "",
			wrapMode: "word",
			syntaxStyle: syntaxStyles(),
			flexGrow: 1,
		});

		this._lineNumbers = new core.LineNumberRenderable(ctx, {
			target: this._code,
		});

		this._markdown = new core.MarkdownRenderable(ctx, {
			width: "100%",
			height: "100%",
			content: "",
			syntaxStyle: syntaxStyles(),
		});

		this._image = new core.ImageRenderable(ctx, {
			width: "100%",
			height: "100%",
			fit: "fit",
		});

		this.render();
	}

	public static make(): Preview {
		return new this();
	}

	private render(): void {
		const path: string = $currentPath.get();

		if (IMAGE_FILETYPES.has(extname(path).toLowerCase())) {
			this._image.source = path;

			this.component.add(this._image);
		} else {
			readFile(
				path,
				{ encoding: "utf-8" },
				(
					error: NodeJS.ErrnoException | null,
					content: string,
				): void => {
					if (error) {
						console.warn(error);

						return;
					}

					const fileType: string =
						CODE_FILETYPES[extname(path)] || "text";

					if (fileType === "markdown") {
						this._markdown.content = content;

						this.component.add(this._markdown);
					} else {
						const treeSitterClient: core.TreeSitterClient =
							core.getTreeSitterClient();

						treeSitterClient
							.initialize()
							.then((): void => {
								this._code.content = content;
								this._code.filetype = fileType;
								this._code.treeSitterClient = treeSitterClient;

								this.component.add(this._lineNumbers);
							})
							.catch((error: Error) => {
								console.warn(error);
							});
					}
				},
			);
		}
	}
}
