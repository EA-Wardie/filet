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
      fg:
        this._options.variant !== "success" &&
        this._options.variant !== "danger"
          ? theme.bg
          : theme.fg,
      attributes: core.TextAttributes.BOLD,
      selectable: false,
    });

    this._component.add(this._label);
  }
}
