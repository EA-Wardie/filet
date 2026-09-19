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

  public components(components: Component<Renderable>[]): this {
    components.forEach((component: Component<Renderable>) => {
      this.component.add(component.component);
    });

    return this;
  }
}
