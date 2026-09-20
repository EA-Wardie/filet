import type { Dirent } from "node:fs";
import * as core from "@opentui/core";
import { MouseButtons } from "@opentui/core/testing";
import { doubleClickTimeout, theme } from "../lib/config";
import { ctx } from "../lib/context";
import { $displayType, $selectedFileLink } from "../lib/store";
import { Component } from "./Component";

export class FileLink extends Component<core.BoxRenderable> {
  private _dirent: Dirent | null = null;
  private _label: core.TextRenderable;
  private _doubleClickCallback: ((event: core.MouseEvent) => void) | null =
    null;
  private _rightClickCallback: ((event: core.MouseEvent) => void) | null = null;
  private _lastClick: number | null = null;

  constructor() {
    super(
      new core.BoxRenderable(ctx, {
        paddingX: 1,
      }),
    );

    this._label = new core.TextRenderable(ctx, {
      content: "",
      fg: theme.fg,
      attributes: core.TextAttributes.BOLD,
      selectable: false,
    });

    this.component.add(this._label);

    this.registerEvents();

    $displayType.subscribe((type: "list" | "grid"): void => {
      if (type === "grid") {
        this.component.border = true;
        this.component.borderColor = theme.bg_dark;
      } else {
        this.component.border = false;
      }
    });
  }

  private registerEvents(): void {
    this.component.onMouseOver = (): void => {
      if ($selectedFileLink.get() !== this) {
        this.component.backgroundColor = theme.fg_light;
      }
    };

    this.component.onMouseOut = (): void => {
      if ($selectedFileLink.get() !== this) {
        this.component.backgroundColor = undefined;
      }
    };

    this.component.onMouseDown = (event: core.MouseEvent): void => {
      if (event.button === MouseButtons.LEFT) {
        $selectedFileLink.set(this);

        const lastClick: number = this._lastClick || 0;
        const isDoubleClick: boolean =
          lastClick !== 0 && Date.now() - lastClick < doubleClickTimeout;

        if (isDoubleClick) {
          this._lastClick = null;

          this._doubleClickCallback?.(event);
        }
      } else if (event.button === MouseButtons.RIGHT) {
        $selectedFileLink.set(this);

        this._rightClickCallback?.(event);
      }

      this._lastClick = Date.now();
    };

    $selectedFileLink.subscribe((link: Readonly<FileLink> | null) => {
      if (link === this) {
        this.component.backgroundColor = theme.fg_dark;
        this._label.fg = theme.bg;
      } else {
        this.component.backgroundColor = undefined;
        this._label.fg = theme.fg;
      }
    });
  }

  public static make(): FileLink {
    return new this();
  }

  public dirent(dirent: Dirent): this {
    this._dirent = dirent;

    return this;
  }

  public label(label: string): this {
    this._label.content = label;

    return this;
  }

  public onDoubleClick(callback: (event: core.MouseEvent) => void): this {
    this._doubleClickCallback = callback;

    return this;
  }

  public onRightClick(callback: (event: core.MouseEvent) => void): this {
    this._rightClickCallback = callback;

    return this;
  }

  public getDirent(): Dirent | null {
    return this._dirent;
  }
}
