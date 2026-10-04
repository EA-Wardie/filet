import type { Dirent } from "node:fs";
import * as core from "@opentui/core";
import { ctx } from "./context";
import { logError } from "./log";
import { getDirentPath } from "./navigation";
import { $notice } from "./store";

let clipboard: core.ClipboardService | null = null;

function getClipboard(): core.ClipboardService {
	if (!clipboard) {
		clipboard = core.createClipboard({
			host: core.createHostClipboard(),
			terminal: core.createRendererClipboardAdapter(ctx),
		});

		ctx.once(core.CliRenderEvents.DESTROY, (): void => {
			clipboard?.dispose().catch(logError);
		});
	}

	return clipboard;
}

export function copyPaths(dirents: Dirent[]): void {
	getClipboard()
		.writeText(dirents.map(getDirentPath).join("\n"), {
			destination: "best-available",
		})
		.then((result: core.ClipboardWriteResult): boolean => {
			if (result.host.status === "failed") {
				logError(result.host.error);
			}

			return (
				result.host.status === "written" ||
				result.terminal.status === "attempted"
			);
		})
		.catch((error: unknown): boolean => {
			logError(error);

			return false;
		})
		.then((copied: boolean): void => {
			if (!copied) {
				$notice.set("Couldn't copy paths to the system clipboard");
			}
		});
}
