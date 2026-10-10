import { type Dirent, lstat, readdir, readlink, type Stats } from "node:fs";
import type { $, Subprocess } from "bun";
import { logError } from "./log";
import { getDirentPath, isFolder } from "./navigation";

export interface Property {
	label: string;
	value: string;
}

interface PermissionClass {
	shift: number;
	special: number;
	symbol: string;
}

type Update = (label: string, value: string) => void;

const PENDING: string = "Calculating…";

const UNKNOWN: string = "Unknown";

const SIZE_UNITS: string[] = ["KB", "MB", "GB", "TB", "PB"];

const NUMBER_FORMAT: Intl.NumberFormat = new Intl.NumberFormat();

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
	dateStyle: "medium",
	timeStyle: "medium",
};

const PERMISSION_CLASSES: PermissionClass[] = [
	{ shift: 6, special: 0o4000, symbol: "s" },
	{ shift: 3, special: 0o2000, symbol: "s" },
	{ shift: 0, special: 0o1000, symbol: "t" },
];

function plural(count: number, noun: string): string {
	return `${NUMBER_FORMAT.format(count)} ${noun}${count === 1 ? "" : "s"}`;
}

function formatSize(bytes: number): string {
	const exact: string = plural(bytes, "byte");

	if (bytes < 1024) {
		return exact;
	}

	let size: number = bytes / 1024;
	let unit: number = 0;

	while (size >= 1024 && unit < SIZE_UNITS.length - 1) {
		size /= 1024;
		unit += 1;
	}

	return `${size.toFixed(1)} ${SIZE_UNITS[unit]} (${exact})`;
}

function formatPermissions(mode: number): string {
	const symbols: string = PERMISSION_CLASSES.map(
		({ shift, special, symbol }: PermissionClass): string => {
			const bits: number = (mode >> shift) & 0o7;
			const execute: boolean = (bits & 0o1) !== 0;
			let executeSymbol: string = execute ? "x" : "-";

			if (mode & special) {
				executeSymbol = execute ? symbol : symbol.toUpperCase();
			}

			return `${bits & 0o4 ? "r" : "-"}${bits & 0o2 ? "w" : "-"}${executeSymbol}`;
		},
	).join("");

	return `${symbols} (${(mode & 0o7777).toString(8)})`;
}

function formatDate(milliseconds: number): string {
	return Temporal.Instant.fromEpochMilliseconds(Math.round(milliseconds))
		.toZonedDateTimeISO(Temporal.Now.timeZoneId())
		.toLocaleString(undefined, DATE_FORMAT);
}

function describeType(path: string, stats: Stats, folder: boolean): string {
	if (stats.isDirectory()) {
		return "Folder";
	}

	if (stats.isSymbolicLink()) {
		return folder ? "Symbolic link to folder" : "Symbolic link";
	}

	if (stats.isFIFO()) {
		return "Named pipe";
	}

	if (stats.isSocket()) {
		return "Socket";
	}

	if (stats.isBlockDevice()) {
		return "Block device";
	}

	if (stats.isCharacterDevice()) {
		return "Character device";
	}

	return Bun.file(path).type.split(";")[0] || "File";
}

function describe(
	path: string,
	stats: Stats,
	folder: boolean,
	target: string | null,
): Property[] {
	const properties: Property[] = [
		{ label: "Type", value: describeType(path, stats, folder) },
	];

	if (target !== null) {
		properties.push({ label: "Target", value: target });
	}

	properties.push(
		{ label: "Path", value: path },
		{ label: "Size", value: folder ? PENDING : formatSize(stats.size) },
	);

	if (folder) {
		properties.push({ label: "Contents", value: PENDING });
	}

	properties.push(
		{ label: "Permissions", value: formatPermissions(stats.mode) },
		{ label: "Owner", value: String(stats.uid) },
		{ label: "Group", value: String(stats.gid) },
		{ label: "Modified", value: formatDate(stats.mtimeMs) },
		{ label: "Accessed", value: formatDate(stats.atimeMs) },
	);

	if (stats.birthtimeMs > 0) {
		properties.push({ label: "Created", value: formatDate(stats.birthtimeMs) });
	}

	return properties;
}

function readName(
	database: "passwd" | "group",
	id: number,
	callback: (name: string) => void,
): void {
	Bun.$`getent ${database} ${id}`
		.nothrow()
		.quiet()
		.then(({ exitCode, stdout }: $.ShellOutput): void => {
			const name: string | undefined = stdout.toString().split(":")[0];

			if (exitCode === 0 && name) {
				callback(`${name} (${id})`);
			}
		})
		.catch(logError);
}

function readContents(path: string, callback: (value: string) => void): void {
	readdir(
		path,
		(error: NodeJS.ErrnoException | null, names: string[]): void => {
			if (error) {
				logError(error);
			}

			callback(error ? UNKNOWN : plural(names.length, "item"));
		},
	);
}

function readFolderSize(
	path: string,
	signal: AbortSignal,
	callback: (value: string) => void,
): void {
	function fail(error: unknown): void {
		if (signal.aborted) {
			return;
		}

		logError(error);
		callback(UNKNOWN);
	}

	try {
		const du: Subprocess<"ignore", "pipe", "ignore"> = Bun.spawn(
			["du", "-sbD", path],
			{
				stdin: "ignore",
				stdout: "pipe",
				stderr: "ignore",
				signal: signal,
			},
		);

		Promise.all([new Response(du.stdout).text(), du.exited])
			.then(([output, exitCode]: [string, number]): void => {
				const size: number = Number.parseInt(output, 10);

				if (signal.aborted) {
					return;
				}

				if (Number.isNaN(size)) {
					fail(new Error(`du could not size ${path}`));
				} else if (exitCode === 0) {
					callback(formatSize(size));
				} else {
					callback(`${formatSize(size)}, some folders unreadable`);
				}
			})
			.catch(fail);
	} catch (error) {
		fail(error);
	}
}

function readTarget(
	path: string,
	stats: Stats,
	callback: (target: string | null) => void,
): void {
	if (!stats.isSymbolicLink()) {
		callback(null);

		return;
	}

	readlink(
		path,
		(error: NodeJS.ErrnoException | null, target: string): void => {
			if (error) {
				logError(error);
			}

			callback(error ? UNKNOWN : target);
		},
	);
}

export function readProperties(
	dirent: Dirent,
	signal: AbortSignal,
	onLoad: (properties: Property[] | null) => void,
	onUpdate: Update,
): void {
	const path: string = getDirentPath(dirent);
	const folder: boolean = isFolder(dirent);

	const update: Update = (label: string, value: string): void => {
		if (!signal.aborted) {
			onUpdate(label, value);
		}
	};

	lstat(path, (error: NodeJS.ErrnoException | null, stats: Stats): void => {
		if (error) {
			logError(error);

			if (!signal.aborted) {
				onLoad(null);
			}

			return;
		}

		readTarget(path, stats, (target: string | null): void => {
			if (signal.aborted) {
				return;
			}

			onLoad(describe(path, stats, folder, target));

			readName("passwd", stats.uid, (name: string): void => {
				update("Owner", name);
			});
			readName("group", stats.gid, (name: string): void => {
				update("Group", name);
			});

			if (folder) {
				readContents(path, (value: string): void => {
					update("Contents", value);
				});
				readFolderSize(path, signal, (value: string): void => {
					update("Size", value);
				});
			}
		});
	});
}
