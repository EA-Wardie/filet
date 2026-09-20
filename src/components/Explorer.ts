import { type Dirent, readdir, type Stats } from "node:fs";
import { stat } from "node:fs/promises";
import * as core from "@opentui/core";
import { MouseButtons } from "@opentui/core/testing";
import { trashPath } from "../lib/config";
import { ctx } from "../lib/context";
import {
  copy,
  createFile,
  createFolder,
  cut,
  getFileIcon,
  moveToTrash,
  paste,
  remove,
  rename,
} from "../lib/filesystem";
import { getDirentPath, go, openInDefault } from "../lib/navigation";
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
import { Preview } from "./Preview";
import { Prompt } from "./Prompt";
import { Text } from "./Text";

export class Explorer extends Component<core.ScrollBoxRenderable> {
  private _emptyText: Text | null = null;
  private _dirents: Dirent[] = [];

  constructor() {
    super(
      new core.ScrollBoxRenderable(ctx, {
        width: "100%",
        height: "100%",
        viewportCulling: true,
        onMouseDown: (event: core.MouseEvent): void => {
          if (event.button === MouseButtons.RIGHT) {
            Menu.make([
              Button.make()
                .label("\uea7f New File")
                .variant("link")
                .onClick((): void => {
                  Prompt.make()
                    .heading("Create a new file")
                    .label("Filename")
                    .variant("success")
                    .onSubmit((filename: string): void => {
                      createFile(filename);
                    });
                }),
              Button.make()
                .label("\uea80 New Folder")
                .variant("link")
                .onClick((): void => {
                  Prompt.make()
                    .heading("Create a new folder")
                    .label("Folder Name")
                    .variant("success")
                    .onSubmit((folderName: string): void => {
                      createFolder(folderName);
                    });
                }),
              Divider.make().visible(!!$copyDirent.get() || !!$cutDirent.get()),
              Button.make()
                .label("Paste")
                .variant("link")
                .visible(!!$copyDirent.get() || !!$cutDirent.get())
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

      stat(path)
        .then((dirent: Stats): void => {
          if (dirent.isDirectory()) {
            try {
              readdir(
                path,
                { withFileTypes: true },
                (
                  error: NodeJS.ErrnoException | null,
                  dirents: Dirent[],
                ): void => {
                  if (error) {
                    console.warn(error);

                    return;
                  }

                  if (dirents.length) {
                    this._dirents = dirents;

                    this.sortDirents();
                    this.drawDirents();

                    return;
                  } else {
                    this._emptyText = Text.make("\uf07c  --Empty--").dim();
                    this._emptyText.component.paddingX = 1;

                    this.component.add(this._emptyText.component);

                    return;
                  }
                },
              );
            } catch (error) {
              console.warn(error);
            }
          } else {
            this.component.add(Preview.make().component);
          }
        })
        .catch((error: Error): void => {
          console.warn(error);
        });
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
    if (this._dirents.length > 1000) {
      return;
    }

    const rank = (dirent: Dirent): number => {
      if (!dirent.isDirectory()) {
        return 2;
      }

      return dirent.name.startsWith(".") ? 1 : 0;
    };

    this._dirents.sort((a: Dirent, b: Dirent): number => {
      const rankDifference: number = rank(a) - rank(b);

      if (rankDifference !== 0) {
        return rankDifference;
      }

      return a.name.localeCompare(b.name);
    });
  }

  private drawDirents() {
    this.components(
      this._dirents.map((dirent: Dirent): FileLink => {
        return FileLink.make()
          .dirent(dirent)
          .label(`${getFileIcon(dirent)}  ${dirent.name}`)
          .onDoubleClick((): void => {
            go(getDirentPath(dirent));
          })
          .onRightClick((event: core.MouseEvent) => {
            Menu.make([
              Button.make()
                .label("\udb80\udfcc Open")
                .variant("link")
                .onClick((): void => {
                  openInDefault(dirent);
                }),
              Divider.make(),
              Button.make()
                .label("\udb80\udd47 Copy")
                .variant("link")
                .onClick((): void => {
                  copy(dirent);
                }),
              Button.make()
                .label("\uf0c4 Cut")
                .variant("link")
                .onClick((): void => {
                  cut(dirent);
                }),
              Divider.make(),
              Button.make()
                .label("\uf040 Rename")
                .variant("link")
                .onClick((): void => {
                  Prompt.make()
                    .heading("Rename file")
                    .label("Filename")
                    .variant("success")
                    .value(dirent.name)
                    .onSubmit((filename: string): void => {
                      rename(dirent, filename);
                    });
                }),
              Divider.make().visible(!$currentPath.get().includes(trashPath)),
              Button.make()
                .label("\uf1f8 Trash")
                .variant("link")
                .visible(!$currentPath.get().includes(trashPath))
                .onClick((): void => {
                  Confirmation.make()
                    .heading("Move to trash?")
                    .description(
                      `Are you sure you want to move '${dirent.name}' to trash?`,
                    )
                    .variant("danger")
                    .onConfirm((): void => {
                      moveToTrash(dirent);
                    });
                }),
              Button.make()
                .label("\udb81\ude91 Delete")
                .variant("link")
                .visible(!$currentPath.get().includes(trashPath))
                .onClick((): void => {
                  Confirmation.make()
                    .heading("Permanently delete?")
                    .description(
                      `Are you sure you want to permanently delete '${dirent.name}'?`,
                    )
                    .variant("danger")
                    .onConfirm((): void => {
                      remove(dirent);
                    });
                }),
            ]).show(event.x, event.y);
          });
      }),
    );
  }
}
