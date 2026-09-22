import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";

interface Options extends core.BoxOptions {
  components: core.Renderable[];
}

export class App {
  private _component: core.BoxRenderable;

  constructor(options: Options) {
    this._component = new core.BoxRenderable(ctx, {
      id: "app",
      width: "100%",
      height: "100%",
      backgroundColor: theme.bg,
      flexDirection: "row",
      ...options,
    });

    this.addComponents(options.components);
    this.render();
  }

  public static make(options: Options): core.BoxRenderable {
    return new this(options)._component;
  }

  private addComponents(components: core.Renderable[]): void {
    for (const component of components) {
      this._component.add(component);
    }
  }

  public render(): void {
    ctx.root.add(this._component);
  }
}
