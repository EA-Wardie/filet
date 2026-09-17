import type { Renderable } from "@opentui/core";

export class Component<T extends Renderable> {
  public component: T;

  constructor(component: T) {
    this.component = component;
  }

  public id(id: string): this {
    this.component.id = id;

    return this;
  }

  public components(
    components: Component<Renderable>[] | (() => Component<Renderable>[]),
  ): this {
    if (typeof components === "function") {
      components().forEach((component: Component<Renderable>) => {
        this.component.add(component.component);
      });
    } else {
      components.forEach((component: Component<Renderable>) => {
        this.component.add(component.component);
      });
    }

    return this;
  }
}
