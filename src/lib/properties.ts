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

function lookupName(database: "passwd" | "group", id: number): Promise<string> {
	return Bun.$`getent ${database} ${id}`
		.nothrow()
		.quiet()
		.then(({ exitCode, stdout }: $.ShellOutput): string => {
			const name: string | undefined = stdout.toString().split(":")[0];

			return exitCode === 0 && name ? `${name} (${id})` : String(id);
		})
		.catch((error: unknown): string => {
			logError(error);

			return String(id);
		});
}

function plural(count: number, noun: string): string {
	return `${NUMBER_FORMAT.format(count)} ${noun}${count === 1 ? "" : "s"}`;
}

export function formatSize(bytes: number): string {
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
	owner: string,
	group: string,
): Property[] {
	const properties: Property[] = [
		{ label: "Type", value: describeType(path, stats, folder) },
		{ label: "Path", value: path },
		{ label: "Size", value: folder ? PENDING : formatSize(stats.size) },
	];

	if (folder) {
		properties.push({ label: "Contents", value: PENDING });
	}

	properties.push(
		{ label: "Permissions", value: formatPermissions(stats.mode) },
		{ label: "Owner", value: owner },
		{ label: "Group", value: group },
		{ label: "Modified", value: formatDate(stats.mtimeMs) },
		{ label: "Accessed", value: formatDate(stats.atimeMs) },
	);

	if (stats.birthtimeMs > 0) {
		properties.push({ label: "Created", value: formatDate(stats.birthtimeMs) });
	}

	return properties;
}

function setProperty(
	properties: Property[],
	label: string,
	value: string,
): void {
	const property: Property | undefined = properties.find(
		(candidate: Property): boolean => candidate.label === label,
	);

	if (property) {
		property.value = value;
	}
}

function readFolderSize(
	path: string,
	callback: (size: number | null, complete: boolean) => void,
): Subprocess | null {
	try {
		const du: Subprocess<"ignore", "pipe", "ignore"> = Bun.spawn(
			["du", "-sbD", path],
			{
				stdin: "ignore",
				stdout: "pipe",
				stderr: "ignore",
			},
		);

		Promise.all([new Response(du.stdout).text(), du.exited])
			.then(([output, exitCode]: [string, number]): void => {
				const size: number = Number.parseInt(output, 10);

				callback(Number.isNaN(size) ? null : size, exitCode === 0);
			})
			.catch((error: unknown): void => {
				logError(error);
				callback(null, false);
			});

		return du;
	} catch (error) {
		logError(error);
		callback(null, false);

		return null;
	}
}

export function readProperties(
	dirent: Dirent,
	onChange: (
		error: NodeJS.ErrnoException | null,
		properties: Property[],
	) => void,
): () => void {
	const path: string = getDirentPath(dirent);
	const folder: boolean = isFolder(dirent);
	let cancelled: boolean = false;
	let du: Subprocess | null = null;

	function update(
		error: NodeJS.ErrnoException | null,
		properties: Property[],
	): void {
		if (!cancelled) {
			onChange(error, properties);
		}
	}

	function readFolder(properties: Property[]): void {
		readdir(
			path,
			(error: NodeJS.ErrnoException | null, names: string[]): void => {
				if (error) {
					logError(error);
				}

				setProperty(
					properties,
					"Contents",
					error ? UNKNOWN : plural(names.length, "item"),
				);
				update(null, properties);
			},
		);

		du = readFolderSize(
			path,
			(size: number | null, complete: boolean): void => {
				du = null;

				if (cancelled) {
					return;
				}

				if (size === null) {
					logError(new Error(`du could not size ${path}`));
				}

				let value: string = size === null ? UNKNOWN : formatSize(size);

				if (size !== null && !complete) {
					value = `${value}, some folders unreadable`;
				}

				setProperty(properties, "Size", value);
				update(null, properties);
			},
		);
	}

	function show(properties: Property[]): void {
		if (cancelled) {
			return;
		}

		update(null, properties);

		if (folder) {
			readFolder(properties);
		}
	}

	function readTarget(properties: Property[]): void {
		readlink(
			path,
			(error: NodeJS.ErrnoException | null, target: string): void => {
				if (error) {
					logError(error);
				}

				properties.splice(1, 0, {
					label: "Target",
					value: error ? UNKNOWN : target,
				});
				show(properties);
			},
		);
	}

	lstat(path, (error: NodeJS.ErrnoException | null, stats: Stats): void => {
		if (error) {
			update(error, []);

			return;
		}

		Promise.all([
			lookupName("passwd", stats.uid),
			lookupName("group", stats.gid),
		]).then(([owner, group]: [string, string]): void => {
			if (cancelled) {
				return;
			}

			const properties: Property[] = describe(
				path,
				stats,
				folder,
				owner,
				group,
			);

			if (stats.isSymbolicLink()) {
				readTarget(properties);
			} else {
				show(properties);
			}
		});
	});

	return (): void => {
		cancelled = true;

		du?.kill();
	};
}
