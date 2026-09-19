import { readdir } from "node:fs";
import * as core from "@opentui/core";
import { Confirmation } from "../components/Confirmation";
import { trashPath } from "./config";
import { $selectedFileLink, $trashFull } from "./store";

export let ctx: core.CliRenderer;

export function makeApp(callback: () => void) {
  core
    .createCliRenderer({
      consoleOptions: {
        sizePercent: 20,
      },
    })
    .then((context: core.CliRenderer) => {
      ctx = context;

      // ctx.console.show();

      ctx.keyInput.on("keypress", (key: core.KeyEvent): void => {
        if (key.name === "escape") {
          $selectedFileLink.set(null);
        }

        if (key.name === "q") {
          Confirmation.make()
            .heading("Quit?")
            .description("Are you sure you want to quit the application?")
            .variant("success")
            .onConfirm((): void => {
              ctx.destroy();
            });
        }
      });

      checkTrash();
      callback();
    });
}

function checkTrash(): void {
  readdir(
    `${trashPath}/files`,
    (error: NodeJS.ErrnoException | null, files: string[]) => {
      if (error) {
        return;
      }

      if (files.length) {
        $trashFull.set(true);
      }
    },
  );
}

export function syntaxStyles(): core.SyntaxStyle {
  return core.SyntaxStyle.fromStyles({
    // Basic tokens
    keyword: { fg: core.RGBA.fromHex("#FF7B72"), bold: true },
    "keyword.import": { fg: core.RGBA.fromHex("#FF7B72"), bold: true },
    "keyword.operator": { fg: core.RGBA.fromHex("#FF7B72") },

    string: { fg: core.RGBA.fromHex("#A5D6FF") },
    comment: { fg: core.RGBA.fromHex("#8B949E"), italic: true },
    number: { fg: core.RGBA.fromHex("#79C0FF") },
    boolean: { fg: core.RGBA.fromHex("#79C0FF") },
    constant: { fg: core.RGBA.fromHex("#79C0FF") },

    // Functions and types
    function: { fg: core.RGBA.fromHex("#D2A8FF") },
    "function.call": { fg: core.RGBA.fromHex("#D2A8FF") },
    "function.method.call": { fg: core.RGBA.fromHex("#D2A8FF") },
    type: { fg: core.RGBA.fromHex("#FFA657") },
    constructor: { fg: core.RGBA.fromHex("#FFA657") },

    // Variables and properties
    variable: { fg: core.RGBA.fromHex("#E6EDF3") },
    "variable.member": { fg: core.RGBA.fromHex("#79C0FF") },
    property: { fg: core.RGBA.fromHex("#79C0FF") },

    // Operators and punctuation
    operator: { fg: core.RGBA.fromHex("#FF7B72") },
    punctuation: { fg: core.RGBA.fromHex("#F0F6FC") },
    "punctuation.bracket": { fg: core.RGBA.fromHex("#F0F6FC") },
    "punctuation.delimiter": { fg: core.RGBA.fromHex("#C9D1D9") },

    // Default fallback
    default: { fg: core.RGBA.fromHex("#E6EDF3") },
  });
}
