import { BoxRenderable } from "@opentui/core";
import * as config from "../lib/config";
import { ctx, homeDirectory } from "../lib/context";
import { $selectedSidebarLink, $tasks, $trashFull } from "../lib/store";
import { Bar } from "./Bar";
import { Button } from "./Button";
import { Component } from "./Component";
import { Divider } from "./Divider";
import { SidebarLink } from "./SidebarLink";
import { Spacer } from "./Spacer";
import { Text } from "./Text";

export class Sidebar extends Component<BoxRenderable> {
  private _homeLink: SidebarLink;
  private _trashLink: SidebarLink;
  private _tasksButton: Button;
  private _footer: Bar;

  constructor() {
    super(
      new BoxRenderable(ctx, {
        width: 34,
        height: "100%",
        border: ["left", "right"],
        borderColor: config.theme.border,
      }),
    );

    this._homeLink = SidebarLink.make()
      .path(homeDirectory)
      .label("\uf015 Home");

    $selectedSidebarLink.set(this._homeLink);

    this._trashLink = SidebarLink.make()
      .path(`${config.trashPath}/files`)
      .label("\uf1f8 Trash");

    this._tasksButton = Button.make()
      .label("\udb82\udd96 Tasks [0]")
      .variant("link")
      .align("center")
      .width("100%")
      .onClick(() => {});

    this._footer = Bar.make().components([this._tasksButton]);

    this._footer.component.visible = false;

    this.components([
      Bar.make().components([Text.make("🐠 Filet").center()]),
      this._homeLink,
      SidebarLink.make()
        .path(`${homeDirectory}/Downloads`)
        .label("\uf019 Downloads"),
      SidebarLink.make()
        .path(`${homeDirectory}/Documents`)
        .label("\udb85\udd17 Documents"),
      SidebarLink.make()
        .path(`${homeDirectory}/Pictures`)
        .label("\uf03e Pictures"),
      SidebarLink.make().path(`${homeDirectory}/Music`).label("\uf001 Music"),
      SidebarLink.make()
        .path(`${homeDirectory}/Videos`)
        .label("\udb83\udfce Videos"),
      Divider.make(),
    ]);

    this.components(
      config.bookmarks.map((bookmark: config.BookmarkType) =>
        SidebarLink.make()
          .path(bookmark.mount)
          .label(`\uf02e ${bookmark.label}`),
      ),
    );

    this.components([
      Divider.make(),
      this._trashLink,
      Divider.make(),
      SidebarLink.make().path("/").label("\udb80\udeca Root"),
      Spacer.make(),
      this._footer,
    ]);

    $trashFull.subscribe((full: boolean): void => {
      if (full) {
        this._trashLink.label("\uf1f8 Trash");
      } else {
        this._trashLink.label("\uf48e Trash");
      }
    });

    $tasks.subscribe((tasks: readonly string[]): void => {
      if (tasks.length) {
        this._tasksButton.label(`\udb82\udd96 Tasks [${tasks.length}]`);
        this._footer.component.visible = true;
      } else {
        this._footer.component.visible = false;
      }
    });
  }

  public static make(): Sidebar {
    return new this();
  }
}
