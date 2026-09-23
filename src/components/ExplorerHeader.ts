import * as core from "@opentui/core";
import { theme, trashPath } from "../lib/config";
import { ctx } from "../lib/context";
import { emptyTrash } from "../lib/filesystem";
import { $currentPath } from "../lib/store";
import { BackButton } from "./BackButton";
import { Button } from "./Button";
import { Confirmation } from "./Confirmation";
import { CurrentPathInput } from "./CurrentPathInput";
import { DisplayTypeToggle } from "./DisplayTypeToggle";
import { Divider } from "./Divider";
import { ForwardButton } from "./ForwardButton";
import { Spacer } from "./Spacer";

export class ExplorerHeader {
  private _options: core.BoxOptions;
  private _component: core.BoxRenderable;
  private _emptyTrashDivider: Divider;
  private _emptyTrashButton: Button;

  constructor(options: core.BoxOptions) {
    this._options = options;

    this._component = new core.BoxRenderable(ctx, {
      border: ["top", "bottom"],
      borderColor: theme.border,
      flexDirection: "row",
      paddingX: 1,
      ...this._options,
    });

    this._emptyTrashDivider = Divider.make()
      .visible($currentPath.get().includes(trashPath))
      .vertical();

    this._emptyTrashButton = Button.make()
      .label("\udb81\udecc Empty Trash")
      .variant("link")
      .align("center")
      .visible($currentPath.get().includes(trashPath))
      .onClick((): void => {
        Confirmation.make()
          .heading("Empty trash?")
          .description("Are you sure you want to empty your trash folder?")
          .variant("danger")
          .onConfirm((): void => {
            emptyTrash();
          });
      });

    this.addComponents();
    this.registerStoreListeners();
  }

  public static make(options: core.BoxOptions = {}): core.BoxRenderable {
    return new this(options)._component;
  }

  public addComponents(): void {
    this._component.add(BackButton.make());
    this._component.add(ForwardButton.make());
    this._component.add(CurrentPathInput.make());
    this._component.add(Spacer.make().component);
    this._component.add(this._emptyTrashButton.component);
    this._component.add(this._emptyTrashDivider.component);
    this._component.add(DisplayTypeToggle.make());
  }

  public registerStoreListeners(): void {
    $currentPath.listen((path: string): void => {
      this._emptyTrashButton.visible(path.includes(trashPath));
      this._emptyTrashDivider.visible(path.includes(trashPath));
    });
  }
}
