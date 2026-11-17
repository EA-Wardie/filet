import { existsSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { expandHome } from "./config";
import { ctx } from "./context";
import { logError } from "./log";
import { $notice } from "./store";

export interface Chooser {
	out: string;
	multiple: boolean;
	directory: boolean;
	save: boolean;
	suggested: string | null;
}

interface ParsedArgs {
	values: {
		"chooser-file"?: string | undefined;
		multiple?: boolean | undefined;
		directory?: boolean | undefined;
		save?: boolean | undefined;
	};
	positionals: string[];
}

interface CommandLine {
	path: string | undefined;
	chooser: Chooser | null;
}

function parseCommandLine(): CommandLine {
	const args: string[] = process.argv.slice(2);

	try {
		const { values, positionals }: ParsedArgs = parseArgs({
			args: args,
			allowPositionals: true,
			options: {
				"chooser-file": { type: "string" },
				multiple: { type: "boolean" },
				directory: { type: "boolean" },
				save: { type: "boolean" },
			},
		});
		const path: string | undefined = positionals[0];
		const out: string | undefined = values["chooser-file"];

		return {
			path: path,
			chooser:
				out === undefined
					? null
					: {
							out: out,
							multiple: values.multiple ?? false,
							directory: values.directory ?? false,
							save: values.save ?? false,
							suggested: path ? resolve(expandHome(path)) : null,
						},
		};
	} catch (error) {
		logError(error);
		$notice.set("Couldn't read the command line, see the log");

		return { path: undefined, chooser: null };
	}
}

const commandLine: CommandLine = parseCommandLine();

export const chooser: Chooser | null = commandLine.chooser;

const HELP_FILE_MARKER: string = "xdg-desktop-portal-termfilechooser";

async function isHelpFile(path: string): Promise<boolean> {
	try {
		const start: string = await Bun.file(path).slice(0, 256).text();
		const firstLine: string = start.split("\n", 1)[0] ?? "";

		return firstLine.includes(HELP_FILE_MARKER);
	} catch {
		return false;
	}
}

const suggestedMissing: boolean =
	!!chooser?.suggested && !existsSync(chooser.suggested);

const helpFile: string | null =
	chooser?.save &&
	chooser.suggested &&
	!suggestedMissing &&
	(await isHelpFile(chooser.suggested))
		? chooser.suggested
		: null;

const suggestedNew: boolean = suggestedMissing || helpFile !== null;

export const startPath: string | undefined =
	chooser?.save && chooser.suggested && suggestedNew
		? dirname(chooser.suggested)
		: commandLine.path;

export function isHelpFileEntry(folder: string, name: string): boolean {
	return helpFile !== null && join(folder, name) === helpFile;
}

export const suggestedName: string = chooser?.suggested
	? basename(chooser.suggested)
	: "";

export function chooserHeading(): string {
	if (!chooser) {
		return "";
	}

	if (chooser.save) {
		return "Save file";
	}

	if (chooser.directory) {
		return chooser.multiple ? "Choose folders" : "Choose folder";
	}

	return chooser.multiple ? "Open files" : "Open file";
}

export function choose(paths: string[], onFailed?: () => void): void {
	if (!chooser || !paths.length) {
		return;
	}

	Bun.write(chooser.out, `${paths.join("\n")}\n`)
		.then((): void => {
			ctx.destroy();
		})
		.catch((error: unknown): void => {
			logError(error);
			$notice.set("Couldn't write the chosen paths");
			onFailed?.();
		});
}
