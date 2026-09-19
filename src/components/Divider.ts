import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import { Component } from "./Component";

export class Divider extends Component<core.BoxRenderable> {
  constructor() {
    super(
      new core.BoxRenderable(ctx, {
        border: ["top"],
        borderColor: theme.border,
      }),
    );
  }

  public static make(): Divider {
    return new this();
  }

  public visible(visible: boolean): this {
    this.component.visible = visible;

    return this;
  }

  public vertical(): this {
    this.component.border = ["left"];

    return this;
  }
}
