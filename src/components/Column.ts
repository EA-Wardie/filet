import { BoxRenderable } from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import { Component } from "./Component";

export class Column extends Component<BoxRenderable> {
  constructor() {
    super(
      new BoxRenderable(ctx, {
        width: "100%",
        height: "100%",
        border: ["right"],
        borderColor: theme.border,
        flexDirection: "column",
        justifyContent: "space-between",
      }),
    );
  }

  public static make(): Column {
    return new this();
  }
}
