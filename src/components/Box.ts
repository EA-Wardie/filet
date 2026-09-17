import * as core from "@opentui/core";
import { ctx } from "../lib/context";
import { Component } from "./Component";

export class Box extends Component<core.BoxRenderable> {
  constructor() {
    super(
      new core.BoxRenderable(ctx, {
        border: true,
        borderStyle: "single",
      }),
    );
  }

  public static make(): Box {
    return new this();
  }
}
