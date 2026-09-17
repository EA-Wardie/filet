import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import { Button, type ButtonVaraintType } from "./Button";
import { Component } from "./Component";

export class Confirmation extends Component<core.BoxRenderable> {
  private _dialog: core.BoxRenderable;
  private _heading: core.TextRenderable;
  private _dialogButtons: core.BoxRenderable;
  private _cancelCallback: (() => void) | null = null;
  private _confirmCallback: (() => void) | null = null;

  constructor(variant: ButtonVaraintType = "default") {
    super(
      new core.BoxRenderable(ctx, {
        width: "100%",
        height: "100%",
        backgroundColor: core.RGBA.fromHex("#ffffff0D"),
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 100,
      }),
    );

    this._dialog = new core.BoxRenderable(ctx, {
      width: 44,
      backgroundColor: theme.bg,
      border: true,
      borderColor: theme.bg_dark,
      paddingX: 4,
      paddingY: 2,
      zIndex: 101,
    });

    this._heading = new core.TextRenderable(ctx, {
      content: "Are you sure you want to do this?",
      alignSelf: "center",
      marginBottom: 1,
    });

    this._dialogButtons = new core.BoxRenderable(ctx, {
      flexDirection: "row",
      justifyContent: "center",
      columnGap: 2,
    });

    this._dialogButtons.add(
      Button.make()
        .label("Cancel")
        .onClick(() => {
          this.component.destroyRecursively();
          this._cancelCallback?.();
        }).component,
    );

    this._dialogButtons.add(
      Button.make()
        .label("Confirm")
        .variant(variant)
        .onClick(() => {
          this.component.destroyRecursively();
          this._confirmCallback?.();
        }).component,
    );

    this._dialog.add(this._heading);
    this._dialog.add(this._dialogButtons);
    this.component.add(this._dialog);

    this.registerEvents();

    ctx.root.add(this.component);
  }

  public static make(variant: ButtonVaraintType = "default"): Confirmation {
    return new this(variant);
  }

  private registerEvents(): void {
    ctx.keyInput.on("keypress", (key: core.KeyEvent): void => {
      if (key.name === "escape") {
        this.component.destroyRecursively();
      }
    });
  }

  public heading(heading: string): this {
    this._heading.content = heading;

    return this;
  }

  public onConfirm(callback: () => void): this {
    this._confirmCallback = callback;

    return this;
  }

  public onCancel(callback: () => void): this {
    this._cancelCallback = callback;

    return this;
  }
}
