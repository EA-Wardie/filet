import * as core from "@opentui/core";
import { MouseButtons } from "@opentui/core/testing";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import { isDoubleClick } from "../lib/input";
import { $displayType, $lastClick, $selectedFileLinks } from "../lib/store";
import { Component } from "./Component";

export class FileLink extends Component<core.BoxRenderable> {
  private _label: core.TextRenderable;
  private _clickCallback: ((event: core.MouseEvent) => void) | null = null;
  private _doubleClickCallback: ((event: core.MouseEvent) => void) | null =
    null;
  private _rightClickCallback: ((event: core.MouseEvent) => void) | null = null;

  constructor() {
    super(
      new core.BoxRenderable(ctx, {
        paddingX: 1,
      }),
    );

    this._label = new core.TextRenderable(ctx, {
      content: "Button",
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
      if (!$selectedFileLinks.get().includes(this)) {
        this.component.backgroundColor = theme.fg_light;
      }
    };

    this.component.onMouseOut = (): void => {
      if (!$selectedFileLinks.get().includes(this)) {
        this.component.backgroundColor = undefined;
      }
    };

    this.component.onMouseDown = (event: core.MouseEvent): void => {
      if (event.button === MouseButtons.LEFT) {
        $selectedFileLinks.set([this]);

        this._clickCallback?.(event);

        if (isDoubleClick()) {
          $lastClick.set(null);

          this._doubleClickCallback?.(event);
        }
      } else if (event.button === MouseButtons.RIGHT) {
        $selectedFileLinks.set([this]);

        this._rightClickCallback?.(event);
      }

      $lastClick.set(Date.now());
    };

    $selectedFileLinks.subscribe((links: readonly FileLink[]) => {
      if (links.includes(this)) {
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

  public label(label: string): this {
    this._label.content = label;

    return this;
  }

  public onClick(callback: (event: core.MouseEvent) => void): this {
    this._clickCallback = callback;

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
}
