import { readdir } from "node:fs";
import { homedir } from "node:os";
import * as core from "@opentui/core";
import { $selectedFileLink, $trashFull } from "./store";

export let ctx: core.CliRenderer;
export const homeDirectory: string = homedir();

export function makeApp(callback: () => void) {
  core
    .createCliRenderer({
      consoleOptions: {
        position: core.ConsolePosition.RIGHT,
        sizePercent: 20,
      },
    })
    .then((context: core.CliRenderer) => {
      ctx = context;

      ctx.console.show();

      ctx.keyInput.on("keypress", (key: core.KeyEvent): void => {
        if (key.name === "escape") {
          $selectedFileLink.set(null);
        }
      });

      checkTrash();
      callback();
    });
}

function checkTrash(): void {
  const trashPath: string = `${homeDirectory}/.local/share/Trash/files`;

  readdir(trashPath, (error: NodeJS.ErrnoException | null, files: string[]) => {
    if (error) {
      return;
    }

    if (files.length) {
      $trashFull.set(true);
    }
  });
}
