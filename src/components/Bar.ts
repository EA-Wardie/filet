import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import { Component } from "./Component";

export class Bar extends Component<core.BoxRenderable> {
  constructor() {
    super(
      new core.BoxRenderable(ctx, {
        border: ["top", "bottom"],
        borderColor: theme.bg_dark,
        flexDirection: "row",
        justifyContent: "space-between",
        paddingX: 1,
      }),
    );
  }

  public static make(): Bar {
    return new this();
  }
}
