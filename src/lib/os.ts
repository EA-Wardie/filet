import type { BunFile } from "bun";
import { logError } from "./log";

const OS_RELEASE_PATHS: string[] = ["/etc/os-release", "/usr/lib/os-release"];

function parseOsName(text: string): string | null {
	for (const line of text.split("\n")) {
		if (!line.startsWith("NAME=")) {
			continue;
		}

		const name: string = line
			.slice("NAME=".length)
			.trim()
			.replace(/^["']|["']$/g, "")
			.replace(/\\(.)/g, "$1");

		if (name) {
			return name;
		}
	}

	return null;
}

async function readOsName(): Promise<string | null> {
	for (const path of OS_RELEASE_PATHS) {
		const file: BunFile = Bun.file(path);

		if (!(await file.exists())) {
			continue;
		}

		try {
			return parseOsName(await file.text());
		} catch (error) {
			logError(error);
		}
	}

	return null;
}

export const osName: string = (await readOsName()) ?? "Root";
