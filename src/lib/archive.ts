import type { Dirent } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { ARCHIVE_EXTENSIONS } from "./consts";
import { getDirentPath, isFolder } from "./navigation";
import { runTask } from "./tasks";

function getArchiveExtension(dirent: Dirent): string | null {
	if (isFolder(dirent)) {
		return null;
	}

	const name: string = dirent.name.toLowerCase();

	return (
		ARCHIVE_EXTENSIONS.find((extension: string): boolean =>
			name.endsWith(extension),
		) ?? null
	);
}

export function isArchive(dirent: Dirent): boolean {
	return getArchiveExtension(dirent) !== null;
}

export async function extract(dirent: Dirent): Promise<void> {
	const extension: string | null = getArchiveExtension(dirent);

	if (!extension) {
		return;
	}

	const path: string = getDirentPath(dirent);
	const toPath: string = path.slice(0, -extension.length);

	await runTask(async (): Promise<void> => {
		await mkdir(toPath);

		const { exitCode, stderr } = await (extension === ".zip"
			? Bun.$`unzip -q -n ${path} -d ${toPath}`
			: Bun.$`tar -xf ${path} -C ${toPath}`
		)
			.nothrow()
			.quiet();

		if (exitCode !== 0) {
			await rm(toPath, { recursive: true, force: true });

			throw new Error(stderr.toString().trim());
		}
	});
}
