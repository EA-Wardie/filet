import type { Dirent } from "node:fs";
import type { Subprocess } from "bun";
import { logError } from "./log";
import { getDirentPath } from "./navigation";

let currentRipdrag: Subprocess | null = null;

export function dragOut(dirent: Dirent): void {
	currentRipdrag?.kill();

	try {
		const process: Subprocess = Bun.spawn(
			[
				"ripdrag",
				"--all-compact",
				"--no-click",
				"--basename",
				"--and-exit",
				getDirentPath(dirent),
			],
			{
				stdin: "ignore",
				stdout: "ignore",
				stderr: "ignore",
			},
		);

		currentRipdrag = process;

		process.exited.then((): void => {
			if (currentRipdrag === process) {
				currentRipdrag = null;
			}
		});
	} catch (error) {
		logError(error);
	}
}
