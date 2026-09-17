import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import { $selectedTiles } from "../lib/store";
import { Component } from "./Component";
import { MouseButtons } from "@opentui/core/testing";

export class Tile extends Component<core.BoxRenderable> {
  private _clickCallback: ((x: number, y: number) => void) | null = null;
  private _rightClickCallback: ((x: number, y: number) => void) | null = null;

  constructor() {
    super(
      new core.BoxRenderable(ctx, {
        border: true,
        borderColor: theme.fg_dark,
        justifyContent: "center",
        paddingX: 1,
      }),
    );

    this.component.onMouseOver = (): void => {
      this.component.borderColor = theme.fg;
    };

    this.component.onMouseOut = (): void => {
      if (!$selectedTiles.get().includes(this)) {
        this.component.borderColor = theme.fg_dark;
      }
    };

    this.component.onMouseDown = (event: core.MouseEvent): void => {
      if (event.button === MouseButtons.LEFT && !event.modifiers.ctrl) {
        $selectedTiles.set([this]);

        this._clickCallback?.(event.x, event.y);
      } else if (event.button === MouseButtons.LEFT && event.modifiers.ctrl) {
        $selectedTiles.set([...$selectedTiles.get(), this]);
      } else if (event.button === MouseButtons.RIGHT) {
        this._rightClickCallback?.(event.x, event.y);
      }
    };

    this.registerEvents();
  }

  public static make(): Tile {
    return new this();
  }

  private registerEvents(): void {
    $selectedTiles.subscribe((tiles: readonly Tile[]) => {
      if (tiles.includes(this)) {
        this.component.borderColor = theme.fg;
      } else {
        this.component.borderColor = theme.fg_dark;
      }
    });
  }

  public onClick(callback: (x: number, y: number) => void): this {
    this._clickCallback = callback;

    return this;
  }

  public onRightClick(callback: (x: number, y: number) => void): this {
    this._rightClickCallback = callback;

    return this;
  }
}
