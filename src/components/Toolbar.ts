import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import { back, canGoBack, canGoForward, forward } from "../lib/navigation";
import {
  $backHistory,
  $currentPath,
  $displayType,
  $forwardHistory,
} from "../lib/store";
import { Button } from "./Button";
import { Component } from "./Component";
import { Spacer } from "./Spacer";
import { Text } from "./Text";

export class Toolbar extends Component<core.BoxRenderable> {
  private _backButton: Button;
  private _forwardButton: Button;
  private _currentPathText: Text;
  private _spacer: Spacer;
  private _displayToggle: Button;

  constructor() {
    super(
      new core.BoxRenderable(ctx, {
        border: ["top", "bottom"],
        borderColor: theme.bg_dark,
        flexDirection: "row",
        // paddingX: 1,
      }),
    );

    this._backButton = Button.make()
      .label("\uf060")
      .variant("link")
      .onClick((): void => {
        back();
      });

    this._forwardButton = Button.make()
      .label("\uf061")
      .variant("link")
      .onClick((): void => {
        forward();
      });

    this._currentPathText = Text.make(`\uf015  ${$currentPath.get()}`);
    this._currentPathText.component.marginLeft = 1;

    this._spacer = Spacer.make();

    this._displayToggle = Button.make()
      .label($displayType.get() ? "\uf00a" : "\uf00b")
      .variant("link")
      .onClick((): void => {
        const newType: "list" | "grid" =
          $displayType.get() === "grid" ? "list" : "grid";

        $displayType.set(newType);
      });

    this.component.add(this._backButton.component);
    this.component.add(this._forwardButton.component);
    this.component.add(this._currentPathText.component);
    this.component.add(this._spacer.component);
    this.component.add(this._displayToggle.component);

    $currentPath.subscribe((path: string): void => {
      this._currentPathText.content(`\uf015  ${path}`);
    });

    $backHistory.subscribe((): void => {
      this._backButton.disabled(!canGoBack());
    });

    $forwardHistory.subscribe((): void => {
      this._forwardButton.disabled(!canGoForward());
    });

    $displayType.subscribe((type: "list" | "grid"): void => {
      this._displayToggle.label(type === "list" ? "\uf00a" : "\udb86\udeb6");
    });
  }

  public static make(): Toolbar {
    return new this();
  }
}
