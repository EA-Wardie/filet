import * as core from "@opentui/core";
import { MouseButtons } from "@opentui/core/testing";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import { $selectedSidebarLink } from "../lib/store";
import { Component } from "./Component";

export class SidebarLink extends Component<core.BoxRenderable> {
  private _label: core.TextRenderable;
  private _clickCallback: ((event: core.MouseEvent) => void) | null = null;
  private _rightClickCallback: ((event: core.MouseEvent) => void) | null = null;

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
  }

  private registerEvents(): void {
    this.component.onMouseOver = (): void => {
      if ($selectedSidebarLink.get() !== this) {
        this.component.backgroundColor = theme.fg_light;
      }
    };

    this.component.onMouseOut = (): void => {
      if ($selectedSidebarLink.get() !== this) {
        this.component.backgroundColor = undefined;
      }
    };

    this.component.onMouseDown = (event: core.MouseEvent): void => {
      if (event.button === MouseButtons.LEFT) {
        $selectedSidebarLink.set(this);

        this._clickCallback?.(event);
      } else if (event.button === MouseButtons.RIGHT) {
        this._rightClickCallback?.(event);
      }
    };

    $selectedSidebarLink.subscribe((link: Readonly<SidebarLink> | null) => {
      if (link === this) {
        this.component.backgroundColor = theme.fg_dark;
        this._label.fg = theme.bg;
      } else {
        this.component.backgroundColor = undefined;
        this._label.fg = theme.fg;
      }
    });
  }

  public static make(): SidebarLink {
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

  public onRightClick(callback: (event: core.MouseEvent) => void): this {
    this._rightClickCallback = callback;

    return this;
  }
}
