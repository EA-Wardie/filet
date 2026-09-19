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
  private _displayToggle: Button;

  constructor() {
    super(
      new core.BoxRenderable(ctx, {
        border: ["top", "bottom"],
        borderColor: theme.border,
        flexDirection: "row",
        paddingX: 1,
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

    this._displayToggle = Button.make()
      .label($displayType.get() === "list" ? "\udb81\udf58" : "\uf03a")
      .variant("link")
      .onClick((): void => {
        $displayType.set($displayType.get() === "grid" ? "list" : "grid");
      });

    this.components([
      this._backButton,
      this._forwardButton,
      this._currentPathText,
      Spacer.make(),
      this._displayToggle,
    ]);

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
      this._displayToggle.label(type === "list" ? "\udb81\udf58" : "\uf03a");
    });
  }

  public static make(): Toolbar {
    return new this();
  }
}
