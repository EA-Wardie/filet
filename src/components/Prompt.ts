import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import { Button, type ButtonVaraintType } from "./Button";
import { Component } from "./Component";

export class Prompt extends Component<core.BoxRenderable> {
  private _dialog: core.BoxRenderable;
  private _heading: core.TextRenderable;
  private _label: core.TextRenderable;
  private _input: core.InputRenderable;
  private _cancelButton: Button;
  private _submitButton: Button;
  private _dialogButtons: core.BoxRenderable;
  private _submitCallback: ((value: string) => void) | null = null;

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
      content: "Enter a value to continue.",
      marginBottom: 1,
    });

    this._label = new core.TextRenderable(ctx, {
      content: "Value",
      fg: theme.fg,
    });

    this._input = new core.InputRenderable(ctx, {
      backgroundColor: theme.fg_light,
      textColor: theme.fg,
      flexGrow: 1,
      marginBottom: 1,
    });

    this._dialogButtons = new core.BoxRenderable(ctx, {
      width: "100%",
      flexDirection: "row",
      justifyContent: "flex-end",
      columnGap: 1,
    });

    this._cancelButton = Button.make()
      .label("Cancel")
      .onClick(() => {
        this._input.blur();
        this.component.destroyRecursively();
      });

    this._submitButton = Button.make()
      .label("Submit")
      .onClick(() => {
        this._input.blur();
        this._submitCallback?.(this._input.value);
        this.component.destroyRecursively();
      });


    this._dialog.add(this._heading);
    this._dialog.add(this._label);
    this._dialog.add(this._input);
    this._input.focus();
    this._dialogButtons.add(this._cancelButton.component);
    this._dialogButtons.add(this._submitButton.component);
    this._dialog.add(this._dialogButtons);
    this.component.add(this._dialog);

    this.registerEvents();

    ctx.root.add(this.component);
  }

  public static make(): Prompt {
    return new this();
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

  public label(label: string): this {
    this._label.content = label;

    return this;
  }

  public variant(variant: ButtonVaraintType): this {
    this._submitButton.variant(variant);

    return this;
  }

  public onSubmit(callback: (value: string) => void): this {
    this._submitCallback = callback;

    return this;
  }
}
