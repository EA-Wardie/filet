import type { Dirent } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import type { $ } from "bun";
import { ARCHIVE_EXTENSIONS, ARCHIVE_FORMATS } from "./consts";
import { canUseName, pathExists } from "./filesystem";
import { logError } from "./log";
import { getDirentPath, isFolder } from "./navigation";
import { $notice, clearMarks, describeDirents } from "./store";
import { runTask } from "./tasks";

interface Archiver {
	command: $.ShellPromise;
	outputPath: string;
	warningCode: number;
	warning: string;
	failure: string;
}

function findArchiveExtension(name: string): string | null {
	const lowerName: string = name.toLowerCase();

	return (
		ARCHIVE_EXTENSIONS.find((extension: string): boolean =>
			lowerName.endsWith(extension),
		) ?? null
	);
}

function getArchiveExtension(dirent: Dirent): string | null {
	if (isFolder(dirent)) {
		return null;
	}

	return findArchiveExtension(dirent.name);
}

export function isArchive(dirent: Dirent): boolean {
	return getArchiveExtension(dirent) !== null;
}

async function runArchiver({
	command,
	outputPath,
	warningCode,
	warning,
	failure,
}: Archiver): Promise<void> {
	const { exitCode, stderr }: $.ShellOutput = await command.nothrow().quiet();
	const error: Error = new Error(stderr.toString().trim());

	if (exitCode === warningCode) {
		$notice.set(warning);
		logError(error);
	} else if (exitCode !== 0) {
		$notice.set(failure);

		await rm(outputPath, { recursive: true, force: true }).catch(logError);

		throw error;
	}
}

function stripExtension(dirent: Dirent): string {
	if (isFolder(dirent)) {
		return dirent.name;
	}

	const extension: string =
		findArchiveExtension(dirent.name) ?? extname(dirent.name);

	return dirent.name.slice(0, dirent.name.length - extension.length);
}

export async function extract(dirent: Dirent): Promise<void> {
	const extension: string | null = getArchiveExtension(dirent);
	const folderName: string = stripExtension(dirent);

	if (!extension || !canUseName(dirent.parentPath, folderName, "extract")) {
		return;
	}

	const path: string = getDirentPath(dirent);
	const toPath: string = join(dirent.parentPath, folderName);
	const failure: string = `Couldn't extract '${dirent.name}'`;

	await runTask(async (): Promise<void> => {
		await mkdir(toPath).catch((error: unknown): never => {
			$notice.set(failure);

			throw error;
		});

		await runArchiver({
			command:
				extension === ".zip"
					? Bun.$`unzip -q -n ${path} -d ${toPath}`
					: Bun.$`tar -xf ${path} -C ${toPath}`,
			outputPath: toPath,
			warningCode: 1,
			warning: `Extracted '${dirent.name}' with warnings, see the log`,
			failure: failure,
		});
	});
}

export function archiveName(dirents: Dirent[]): string {
	const dirent: Dirent | undefined = dirents[0];
	const folder: string = dirent?.parentPath ?? "";
	const name: string =
		(dirent && dirents.length === 1
			? stripExtension(dirent)
			: basename(folder)) || "archive";
	let archive: string = `${name}.zip`;

	for (let count: number = 2; pathExists(join(folder, archive)); count++) {
		archive = `${name}-${count}.zip`;
	}

	return archive;
}

export async function compress(dirents: Dirent[], name: string): Promise<void> {
	const folder: string | undefined = dirents[0]?.parentPath;
	const archive: string = name.trim();

	if (!folder || !canUseName(folder, archive, "compress")) {
		return;
	}

	const extension: string | null = findArchiveExtension(archive);

	if (!extension) {
		$notice.set(`Unsupported archive format '${archive}'`);

		return;
	}

	const toPath: string = join(folder, archive);
	const names: string[] = dirents.map(
		(dirent: Dirent): string => `./${dirent.name}`,
	);
	const targets: string = describeDirents(dirents, "'");

	clearMarks();

	await runTask(
		(): Promise<void> =>
			runArchiver({
				command: (extension === ".zip"
					? Bun.$`zip -qry ${toPath} ${names}`
					: Bun.$`tar -c ${ARCHIVE_FORMATS[extension] ?? []} -f ${toPath} ${names}`
				).cwd(folder),
				outputPath: toPath,
				warningCode: extension === ".zip" ? 18 : 1,
				warning: `Compressed ${targets} with warnings, see the log`,
				failure: `Couldn't compress ${targets}`,
			}),
		archive,
	);
}
