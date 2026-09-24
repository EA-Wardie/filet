import { readFile } from "node:fs";
import { extname } from "node:path";
import * as core from "@opentui/core";
import { ctx, syntaxStyles } from "../lib/context";
import { CODE_FILETYPES, IMAGE_FILETYPES } from "../lib/filesystem";
import { $currentPath } from "../lib/store";

export class Preview {
  private _options: core.BoxOptions;
  private _component: core.BoxRenderable;
  private _code: core.CodeRenderable | null = null;
  private _lineNumbers: core.LineNumberRenderable | null = null;
  private _markdown: core.MarkdownRenderable | null = null;
  private _image: core.ImageRenderable | null = null;

  constructor(options: core.BoxOptions) {
    this._options = options;

    this._component = new core.BoxRenderable(ctx, {
      paddingX: 1,
      ...this._options,
    });

    if (IMAGE_FILETYPES.has(extname($currentPath.get()).toLowerCase())) {
      this.addImage();
    } else {
      this.addCodeOrMarkdown();
    }
  }

  public static make(options: core.BoxOptions = {}): core.BoxRenderable {
    return new this(options)._component;
  }

  private addImage(): void {
    this._image = new core.ImageRenderable(ctx, {
      width: "100%",
      height: "100%",
      source: $currentPath.get(),
      fit: "fit",
    });

    this._component.add(this._image);
  }

  private addCodeOrMarkdown(): void {
    readFile(
      $currentPath.get(),
      { encoding: "utf-8" },
      async (
        error: NodeJS.ErrnoException | null,
        content: string,
      ): Promise<void> => {
        if (error) {
          console.warn(error);

          return;
        }

        const fileType: string =
          CODE_FILETYPES[extname($currentPath.get())] || "text";

        if (fileType === "markdown") {
          this._markdown = new core.MarkdownRenderable(ctx, {
            width: "100%",
            height: "100%",
            content: content,
            syntaxStyle: syntaxStyles(),
          });

          this._component.add(this._markdown);
        } else {
          const tsClient: core.TreeSitterClient = core.getTreeSitterClient();

          await tsClient.initialize();

          this._code = new core.CodeRenderable(ctx, {
            width: "100%",
            height: "100%",
            content: content,
            wrapMode: "word",
            syntaxStyle: syntaxStyles(),
            flexGrow: 1,
            filetype: fileType,
            treeSitterClient: tsClient,
          });

          this._lineNumbers = new core.LineNumberRenderable(ctx, {
            target: this._code,
          });

          this._component.add(this._lineNumbers);
        }
      },
    );
  }
}
