import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import { go } from "../lib/navigation";
import { $currentPath } from "../lib/store";

export class CurrentPathInput {
  private _options: core.BoxOptions;
  private _component: core.BoxRenderable;
  private _icon: core.TextRenderable | null = null;
  private _input: core.InputRenderable | null = null;

  constructor(options: core.BoxOptions) {
    this._options = options;

    this._component = new core.BoxRenderable(ctx, {
      height: 1,
      flexDirection: "row",
      flexGrow: 1,
      columnGap: 1,
      ...this._options,
    });

    this.addIcon();
    this.addInput();
    this.registerStoreListeners();
    this.registerKeyboardEvents();
  }

  public static make(options: core.BoxOptions = {}): core.BoxRenderable {
    return new this(options)._component;
  }

  private addIcon(): void {
    this._icon = new core.TextRenderable(ctx, {
      content: "\uf015",
      fg: theme.fg,
      flexShrink: 1,
    });

    this._component.add(this._icon);
  }

  private addInput(): void {
    this._input = new core.InputRenderable(ctx, {
      value: $currentPath.get(),
      flexGrow: 1,
    });

    this._component.add(this._input);
  }

  private registerStoreListeners(): void {
    $currentPath.listen((path: string): void => {
      if (this._input) {
        this._input.value = path;
      }
    });
  }

  private registerKeyboardEvents(): void {
    ctx.keyInput.on("keypress", (key: core.KeyEvent): void => {
      if (key.name === "return" && this._input) {
        go(this._input.value);

        this._input.blur();
      }

      if (key.name === "escape" && this._input) {
        this._input.blur();
      }
    });
  }
}
