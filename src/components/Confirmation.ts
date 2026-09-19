import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import { Button, type ButtonVaraintType } from "./Button";
import { Component } from "./Component";

export class Confirmation extends Component<core.BoxRenderable> {
  private _dialog: core.BoxRenderable;
  private _heading: core.TextRenderable;
  private _description: core.TextRenderable;
  private _cancelButton: Button;
  private _confirmButton: Button;
  private _dialogButtons: core.BoxRenderable;
  private _confirmCallback: (() => void) | null = null;

  constructor() {
    super(
      new core.BoxRenderable(ctx, {
        width: "100%",
        height: "100%",
        backgroundColor: core.RGBA.fromHex("#ffffff1A"),
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 100,
      }),
    );

    this._dialog = new core.BoxRenderable(ctx, {
      width: 42,
      backgroundColor: theme.bg,
      border: true,
      borderColor: theme.border,
      paddingX: 1,
      zIndex: 101,
    });

    this._heading = new core.TextRenderable(ctx, {
      content: "Are you sure?",
      wrapMode: "word",
      marginBottom: 1,
    });

    this._description = new core.TextRenderable(ctx, {
      content: "Are you sure you want to do this?",
      wrapMode: "word",
      marginBottom: 1,
    });

    this._dialogButtons = new core.BoxRenderable(ctx, {
      width: "100%",
      flexDirection: "row",
      justifyContent: "flex-end",
      columnGap: 1,
    });

    this._cancelButton = Button.make()
      .label("\uf00d Cancel")
      .onClick(() => {
        this.component.destroyRecursively();
      });

    this._confirmButton = Button.make()
      .label("\uf00c Confirm")
      .onClick(() => {
        this._confirmCallback?.();
        this.component.destroyRecursively();
      });

    this._dialogButtons.add(this._cancelButton.component);
    this._dialogButtons.add(this._confirmButton.component);

    this._dialog.add(this._heading);
    this._dialog.add(this._description);
    this._dialog.add(this._dialogButtons);

    this.component.add(this._dialog);

    this.registerEvents();

    ctx.root.add(this.component);
  }

  public static make(): Confirmation {
    return new this();
  }

  private registerEvents(): void {
    ctx.keyInput.on("keypress", (key: core.KeyEvent): void => {
      if (key.name === "return") {
        this._confirmCallback?.();
        this.component.destroyRecursively();
      }

      if (key.name === "escape") {
        this.component.destroyRecursively();
      }
    });
  }

  public heading(heading: string): this {
    this._heading.content = heading;

    return this;
  }

  public description(description: string): this {
    this._description.content = description;

    return this;
  }

  public variant(variant: ButtonVaraintType): this {
    this._confirmButton.variant(variant);

    return this;
  }

  public onConfirm(callback: () => void): this {
    this._confirmCallback = callback;

    return this;
  }
}
