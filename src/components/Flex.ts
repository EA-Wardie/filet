import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";

interface Options extends core.BoxOptions {
  components: core.Renderable[];
}

export class Flex {
  private _component;

  constructor(options: Options) {
    this._component = new core.BoxRenderable(ctx, {
      width: "100%",
      height: "100%",
      border: ["right"],
      borderColor: theme.border,
      flexDirection: "column",
      justifyContent: "space-between",
      ...options,
    });

    this.addComponents(options.components);
  }

  public static make(options: Options): core.BoxRenderable {
    return new this(options)._component;
  }

  private addComponents(components: core.Renderable[]): void {
    for (const component of components) {
      this._component.add(component);
    }
  }
}
