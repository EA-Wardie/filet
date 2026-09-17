import { type Dirent, readdir, type Stats, statSync } from "node:fs";
import * as core from "@opentui/core";
import { MouseButtons } from "@opentui/core/testing";
import { ctx } from "../lib/context";
import { copy, cut, getFileIcon, paste, remove } from "../lib/filesystem";
import { getDirentPath, go } from "../lib/navigation";
import {
  $copyDirent,
  $currentPath,
  $cutDirent,
  $displayType,
} from "../lib/store";
import { Button } from "./Button";
import { Component } from "./Component";
import { Confirmation } from "./Confirmation";
import { Divider } from "./Divider";
import { FileLink } from "./FileLink";
import { Menu } from "./Menu";

export class Explorer extends Component<core.ScrollBoxRenderable> {
  private _dirents: Dirent[] = [];

  constructor() {
    super(
      new core.ScrollBoxRenderable(ctx, {
        width: "100%",
        height: "100%",
        viewportCulling: true,
        onMouseDown: (event: core.MouseEvent): void => {
          const hasCopyOrCut: boolean =
            !!$copyDirent.get() || !!$cutDirent.get();

          if (event.button === MouseButtons.RIGHT && hasCopyOrCut) {
            Menu.make([
              Button.make()
                .label("Paste")
                .variant("link")
                .onClick((): void => {
                  paste();
                }),
            ]).show(event.x, event.y);
          }
        },
      }),
    );

    $currentPath.subscribe((path: string): void => {
      if (this.component.getChildrenCount()) {
        this.component.getChildren().forEach((child: core.Renderable) => {
          this.component.remove(child);
        });
      }

      const dirent: Stats = statSync(path);

      if (dirent.isDirectory()) {
        try {
          readdir(
            path,
            { withFileTypes: true },
            (error: NodeJS.ErrnoException | null, dirents: Dirent[]): void => {
              if (error) {
                return;
              }

              if (!dirents.length) {
                return;
              }

              this._dirents = dirents;

              this.sortDirents();
              this.drawDirents();
            },
          );
        } catch (error) {
          console.warn(error);
        }
      }
    });

    $displayType.subscribe((type: "list" | "grid"): void => {
      this.component.contentOptions = {
        flexDirection: type === "list" ? "column" : "row",
        flexWrap: type === "list" ? "no-wrap" : "wrap",
        columnGap: type === "list" ? 0 : 1,
        paddingX: type === "list" ? 0 : 1,
      };
    });
  }

  public static make(): Explorer {
    return new this();
  }

  private sortDirents(): void {
    if (this._dirents.length > 100) {
      return;
    }

    this._dirents.sort((a: Dirent, b: Dirent): number => {
      if (a.isDirectory() !== b.isDirectory()) {
        return a.isDirectory() ? -1 : 1;
      }

      return a.name.localeCompare(b.name);
    });
  }

  private drawDirents() {
    this._dirents.forEach((dirent: Dirent) => {
      this.component.add(
        FileLink.make()
          .label(`${getFileIcon(dirent)}  ${dirent.name}`)
          .onDoubleClick((): void => {
            // if (dirent.isDirectory()) {
            //   go(getDirentPath(dirent));
            // }

            go(getDirentPath(dirent));
          })
          .onRightClick((event: core.MouseEvent) => {
            Menu.make([
              Button.make().label("Open").variant("link"),
              Divider.make(),
              Button.make()
                .label("Copy")
                .variant("link")
                .onClick((): void => {
                  copy(dirent);
                }),
              Button.make()
                .label("Cut")
                .variant("link")
                .onClick((): void => {
                  cut(dirent);
                }),
              Divider.make(),
              Button.make()
                .label("Trash")
                .variant("link")
                .onClick((): void => {
                  Confirmation.make("danger")
                    .heading(`Move ${dirent.name} to trash?`)
                    .onConfirm((): void => {});
                }),
              Button.make()
                .label("Delete")
                .variant("link")
                .onClick((): void => {
                  Confirmation.make("danger")
                    .heading(`Permanently delete ${dirent.name}?`)
                    .onConfirm((): void => {
                      remove(dirent);
                    });
                }),
            ]).show(event.x, event.y);
          }).component,
      );
    });
  }
}
