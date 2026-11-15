import { basename, dirname } from "node:path";
import { terminalCommand } from "./config";
import { COLLATOR, HOME_DIRECTORY } from "./consts";
import { logError } from "./log";
import { spawnDetached } from "./navigation";
import { $notice } from "./store";

export interface Application {
	id: string;
	name: string;
	exec: string;
	terminal: boolean;
}

export interface Applications {
	type: string | null;
	defaultId: string | null;
	apps: Application[];
}

type Ini = Map<string, Map<string, string>>;

type Quote = '"' | "'" | null;

interface Entry extends Application {
	types: string[];
	noDisplay: boolean;
}

interface Associations {
	added: string[];
	removed: Set<string>;
}

const DATA_HOME: string =
	Bun.env.XDG_DATA_HOME || `${HOME_DIRECTORY}/.local/share`;

const CONFIG_HOME: string =
	Bun.env.XDG_CONFIG_HOME || `${HOME_DIRECTORY}/.config`;

const DATA_DIRS: string[] = [
	DATA_HOME,
	...(
		Bun.env.XDG_DATA_DIRS ||
		`${DATA_HOME}/flatpak/exports/share:/var/lib/flatpak/exports/share:/usr/local/share:/usr/share`
	)
		.split(":")
		.filter(Boolean),
];

const MIMEAPPS_PATHS: string[] = [
	`${CONFIG_HOME}/mimeapps.list`,
	...(Bun.env.XDG_CONFIG_DIRS || "/etc/xdg")
		.split(":")
		.filter(Boolean)
		.map((dir: string): string => `${dir}/mimeapps.list`),
	...DATA_DIRS.map(
		(dir: string): string => `${dir}/applications/mimeapps.list`,
	),
];

const LOCALE: string = (
	Bun.env.LC_ALL ||
	Bun.env.LC_MESSAGES ||
	Bun.env.LANG ||
	""
).split(/[.@]/)[0] as string;

const FILE_CODES: string = "fFuU";

const VALUE_ESCAPES: Record<string, string> = {
	s: " ",
	n: "\n",
	t: "\t",
	r: "\r",
	"\\": "\\",
};

const DOUBLE_QUOTE_ESCAPES: string = '"`$\\';

const TERMINAL_EXEC_ARGS: Record<string, string[]> = {
	alacritty: ["-e"],
	ghostty: ["-e"],
	konsole: ["-e"],
	lxterminal: ["-e"],
	qterminal: ["-e"],
	rxvt: ["-e"],
	st: ["-e"],
	tilix: ["-e"],
	urxvt: ["-e"],
	uxterm: ["-e"],
	xterm: ["-e"],
	"mate-terminal": ["-x"],
	terminator: ["-x"],
	"xfce4-terminal": ["-x"],
	"gnome-terminal": ["--"],
	kgx: ["--"],
	ptyxis: ["--"],
	wezterm: ["start", "--"],
};

async function readText(path: string): Promise<string | null> {
	try {
		return await Bun.file(path).text();
	} catch {
		return null;
	}
}

function parseIni(text: string): Ini {
	const groups: Ini = new Map();
	let group: Map<string, string> | null = null;

	for (const raw of text.split("\n")) {
		const line: string = raw.trim();

		if (!line || line.startsWith("#")) {
			continue;
		}

		if (line.startsWith("[") && line.endsWith("]")) {
			const name: string = line.slice(1, -1);

			group = groups.get(name) ?? new Map();
			groups.set(name, group);

			continue;
		}

		const equals: number = line.indexOf("=");

		if (!group || equals < 0) {
			continue;
		}

		const key: string = line.slice(0, equals).trim();

		if (!group.has(key)) {
			group.set(key, line.slice(equals + 1).trim());
		}
	}

	return groups;
}

function splitList(value: string | undefined): string[] {
	return (value ?? "").split(";").filter(Boolean);
}

function unescapeValue(value: string): string {
	return value.replace(
		/\\(.)/g,
		(match: string, char: string): string => VALUE_ESCAPES[char] ?? match,
	);
}

function shellQuote(value: string): string {
	return `'${value.replaceAll("'", "'\\''")}'`;
}

function escapeDoubleQuoted(value: string): string {
	return value.replace(/["`$\\]/g, "\\$&");
}

function quoteFor(value: string, quote: Quote): string {
	const quoted: string = shellQuote(value);

	if (quote === '"') {
		return escapeDoubleQuoted(quoted);
	}

	if (quote === "'") {
		return `'"${escapeDoubleQuoted(quoted)}"'`;
	}

	return quoted;
}

function expandExec(exec: string, path: string, name: string): string {
	let expanded: string = "";
	let quote: Quote = null;
	let hasFile: boolean = false;

	for (let index: number = 0; index < exec.length; index++) {
		const char: string = exec[index] as string;

		if (char === "%" && index + 1 < exec.length) {
			const code: string = exec[++index] as string;

			if (code === "%") {
				expanded += "%";
			} else if (FILE_CODES.includes(code)) {
				expanded += quoteFor(path, quote);
				hasFile = true;
			} else if (code === "c") {
				expanded += quoteFor(name, quote);
			}

			continue;
		}

		if (char === "\\" && quote !== "'" && index + 1 < exec.length) {
			expanded += char + exec[++index];

			continue;
		}

		if (quote === null && (char === '"' || char === "'")) {
			quote = char;
		} else if (char === quote) {
			quote = null;
		}

		expanded += char;
	}

	return hasFile ? expanded : `${expanded} ${shellQuote(path)}`;
}

function splitCommandLine(line: string): string[] {
	const args: string[] = [];
	let current: string = "";
	let started: boolean = false;
	let quote: Quote = null;

	for (let index: number = 0; index < line.length; index++) {
		const char: string = line[index] as string;
		const next: string | undefined = line[index + 1];

		if (quote === "'") {
			if (char === "'") {
				quote = null;
			} else {
				current += char;
			}
		} else if (quote === '"') {
			if (char === "\\" && next && DOUBLE_QUOTE_ESCAPES.includes(next)) {
				current += next;
				index++;
			} else if (char === '"') {
				quote = null;
			} else {
				current += char;
			}
		} else if (char === "\\" && next !== undefined) {
			current += next;
			started = true;
			index++;
		} else if (char === '"' || char === "'") {
			quote = char;
			started = true;
		} else if (char === " " || char === "\t" || char === "\n") {
			if (started) {
				args.push(current);
				current = "";
				started = false;
			}
		} else {
			current += char;
			started = true;
		}
	}

	if (started) {
		args.push(current);
	}

	return args;
}

function localized(fields: Map<string, string>, key: string): string {
	const [language] = LOCALE.split("_");

	return (
		fields.get(`${key}[${LOCALE}]`) ??
		fields.get(`${key}[${language}]`) ??
		fields.get(key) ??
		""
	);
}

function toEntry(id: string, text: string): Entry | null {
	const fields: Map<string, string> | undefined =
		parseIni(text).get("Desktop Entry");
	const exec: string | undefined = fields?.get("Exec");
	const tryExec: string | undefined = fields?.get("TryExec");

	if (
		!fields ||
		!exec ||
		fields.get("Type") !== "Application" ||
		fields.get("Hidden") === "true" ||
		(tryExec && !Bun.which(unescapeValue(tryExec)))
	) {
		return null;
	}

	return {
		id: id,
		name: unescapeValue(localized(fields, "Name")) || id,
		exec: unescapeValue(exec),
		terminal: fields.get("Terminal") === "true",
		types: splitList(fields.get("MimeType")),
		noDisplay: fields.get("NoDisplay") === "true",
	};
}

async function listDesktopFiles(folder: string): Promise<string[]> {
	const files: string[] = [];

	try {
		for await (const file of new Bun.Glob("**/*.desktop").scan({
			cwd: folder,
			followSymlinks: true,
		})) {
			files.push(file);
		}
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
			logError(error);
		}
	}

	return files;
}

async function readEntries(): Promise<Map<string, Entry | null>> {
	const folders: string[] = DATA_DIRS.map(
		(dir: string): string => `${dir}/applications`,
	);
	const listed: string[][] = await Promise.all(folders.map(listDesktopFiles));
	const paths: Map<string, string> = new Map();

	listed.forEach((files: string[], index: number): void => {
		for (const file of files) {
			const id: string = file.replaceAll("/", "-");

			if (!paths.has(id)) {
				paths.set(id, `${folders[index]}/${file}`);
			}
		}
	});

	const ids: string[] = [...paths.keys()];
	const texts: (string | null)[] = await Promise.all(
		[...paths.values()].map(readText),
	);

	return new Map(
		ids.map((id: string, index: number): [string, Entry | null] => {
			const text: string | null = texts[index] ?? null;

			return [id, text === null ? null : toEntry(id, text)];
		}),
	);
}

async function readParents(): Promise<Map<string, string[]>> {
	const parents: Map<string, string[]> = new Map();
	const texts: (string | null)[] = await Promise.all(
		DATA_DIRS.map(
			(dir: string): Promise<string | null> =>
				readText(`${dir}/mime/subclasses`),
		),
	);

	for (const text of texts) {
		for (const line of text?.split("\n") ?? []) {
			const [child, parent] = line.trim().split(/\s+/);

			if (child && parent) {
				parents.set(child, [...(parents.get(child) ?? []), parent]);
			}
		}
	}

	return parents;
}

function withParents(type: string, parents: Map<string, string[]>): string[] {
	const types: string[] = [type];

	for (let index: number = 0; index < types.length; index++) {
		const current: string = types[index] as string;
		const next: string[] = [
			...(parents.get(current) ?? []),
			...(current.startsWith("text/") ? ["text/plain"] : []),
		];

		for (const parent of next) {
			if (!types.includes(parent)) {
				types.push(parent);
			}
		}
	}

	return types;
}

async function readAssociations(types: string[]): Promise<Associations> {
	const associations: Associations = { added: [], removed: new Set() };
	const texts: (string | null)[] = await Promise.all(
		MIMEAPPS_PATHS.map(readText),
	);

	for (const text of texts) {
		if (text === null) {
			continue;
		}

		const ini: Ini = parseIni(text);

		for (const type of types) {
			for (const id of splitList(ini.get("Added Associations")?.get(type))) {
				if (!associations.removed.has(id)) {
					associations.added.push(id);
				}
			}
		}

		for (const type of types) {
			for (const id of splitList(ini.get("Removed Associations")?.get(type))) {
				if (!associations.added.includes(id)) {
					associations.removed.add(id);
				}
			}
		}
	}

	return associations;
}

async function queryXdgMime(
	query: "filetype" | "default",
	value: string,
): Promise<string | null> {
	try {
		const subprocess: Bun.Subprocess<"ignore", "pipe", "ignore"> = Bun.spawn(
			["xdg-mime", "query", query, value],
			{ stdin: "ignore", stdout: "pipe", stderr: "ignore" },
		);
		const output: string = await new Response(subprocess.stdout).text();

		return (await subprocess.exited) === 0
			? output.trim().split(/[;\s]/)[0] || null
			: null;
	} catch (error) {
		logError(error);

		return null;
	}
}

export async function findApplications(path: string): Promise<Applications> {
	const type: string | null = await queryXdgMime("filetype", path);

	if (!type) {
		return { type: null, defaultId: null, apps: [] };
	}

	const [entries, parents, defaultId]: [
		Map<string, Entry | null>,
		Map<string, string[]>,
		string | null,
	] = await Promise.all([
		readEntries(),
		readParents(),
		queryXdgMime("default", type),
	]);
	const types: string[] = withParents(type, parents);
	const { added, removed }: Associations = await readAssociations(types);
	const apps: Application[] = [];
	const seen: Set<string> = new Set();
	const usable = (id: string): Entry | null => {
		const entry: Entry | null | undefined = entries.get(id);

		return entry && !removed.has(id) && !seen.has(id) ? entry : null;
	};
	const add = (entry: Entry): void => {
		seen.add(entry.id);
		apps.push({
			id: entry.id,
			name: entry.name,
			exec: entry.exec,
			terminal: entry.terminal,
		});
	};

	const defaultEntry: Entry | null = defaultId ? usable(defaultId) : null;

	if (defaultEntry) {
		add(defaultEntry);
	}

	for (const id of added) {
		const entry: Entry | null = usable(id);

		if (entry) {
			add(entry);
		}
	}

	const rest: Entry[] = [...entries.values()].filter(
		(entry: Entry | null): entry is Entry =>
			entry !== null &&
			!entry.noDisplay &&
			usable(entry.id) !== null &&
			entry.types.some((entryType: string): boolean =>
				types.includes(entryType),
			),
	);

	rest.sort((a: Entry, b: Entry): number => COLLATOR.compare(a.name, b.name));

	for (const entry of rest) {
		add(entry);
	}

	return { type: type, defaultId: defaultEntry?.id ?? null, apps: apps };
}

function terminalArgs(): string[] {
	const [program, ...options] = terminalCommand;
	const execArgs: string[] = TERMINAL_EXEC_ARGS[basename(program ?? "")] ?? [];

	return [
		...terminalCommand,
		...execArgs.filter((arg: string): boolean => !options.includes(arg)),
	];
}

export function launchApplication(app: Application, path: string): void {
	const args: string[] = splitCommandLine(expandExec(app.exec, path, app.name));
	const command: string[] = app.terminal ? [...terminalArgs(), ...args] : args;

	if (!args.length || !spawnDetached(command, dirname(path))) {
		$notice.set(`Can't open ${app.name}`);
	}
}
