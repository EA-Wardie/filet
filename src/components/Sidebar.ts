import { BoxRenderable } from "@opentui/core";
import { theme } from "../lib/config";
import { ctx, homeDirectory } from "../lib/context";
import { go } from "../lib/navigation";
import { $selectedSidebarLink, $tasks, $trashFull } from "../lib/store";
import { Bar } from "./Bar";
import { Component } from "./Component";
import { Divider } from "./Divider";
import { SidebarLink } from "./SidebarLink";
import { Spacer } from "./Spacer";
import { Text } from "./Text";

export class Sidebar extends Component<BoxRenderable> {
  private _homeLink: SidebarLink;
  private _trashLink: SidebarLink;
  private _footer: Bar;
  private _tasksCount: Text;

  constructor() {
    super(
      new BoxRenderable(ctx, {
        width: 34,
        height: "100%",
        border: ["left", "right"],
        borderColor: theme.bg_dark,
      }),
    );

    this._homeLink = SidebarLink.make()
      .label("\uf015  Home")
      .onClick((): void => {
        go(`${homeDirectory}`);
      });

    $selectedSidebarLink.set(this._homeLink);

    this._trashLink = SidebarLink.make()
      .label("\uf1f8  Trash")
      .onClick((): void => {
        go(`${homeDirectory}/.local/share/Trash/files`);
      });

    this._tasksCount = Text.make("[0]");

    this._footer = Bar.make().components([
      Text.make("\udb82\udd96 Tasks"),
      this._tasksCount,
    ]);

    this._footer.component.visible = false;

    this.components([
      Bar.make().components([Text.make("🐠 Filet").center()]),
      this._homeLink,
      SidebarLink.make()
        .label("\uf019  Downloads")
        .onClick((): void => {
          go(`${homeDirectory}/Downloads`);
        }),
      SidebarLink.make()
        .label("\udb85\udd17  Documents")
        .onClick((): void => {
          go(`${homeDirectory}/Documents`);
        }),
      SidebarLink.make()
        .label("\uf03e  Pictures")
        .onClick((): void => {
          go(`${homeDirectory}/Pictures`);
        }),
      SidebarLink.make()
        .label("\uf001  Music")
        .onClick((): void => {
          go(`${homeDirectory}/Music`);
        }),
      SidebarLink.make()
        .label("\uf03d  Videos")
        .onClick((): void => {
          go(`${homeDirectory}/Videos`);
        }),
      Divider.make(),
      this._trashLink,
      Divider.make(),
      SidebarLink.make()
        .label("\udb85\udedf  Root")
        .onClick((): void => {
          go("/");
        }),
      Spacer.make(),
      this._footer,
    ]);

    $trashFull.subscribe((full: boolean): void => {
      if (full) {
        this._trashLink.label("\uf1f8  Trash");
      } else {
        this._trashLink.label("\uf48e  Trash");
      }
    });

    $tasks.subscribe((tasks: readonly string[]): void => {
      if (tasks.length) {
        this._footer.component.visible = true;
        this._tasksCount.content(`[${tasks.length}]`);
      } else {
        this._footer.component.visible = false;
      }
    });
  }

  public static make(): Sidebar {
    return new this();
  }
}
