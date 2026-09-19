import type { Renderable } from "@opentui/core";

export class Component<T extends Renderable> {
  public component: T;

  constructor(component: T) {
    this.component = component;
  }

  public components(components: Component<Renderable>[]): this {
    components.forEach((component: Component<Renderable>) => {
      this.component.add(component.component);
    });

    return this;
  }
}
