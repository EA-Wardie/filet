import { resolve } from "node:path";
import { parseColor, RGBA } from "@opentui/core";
import { HOME_DIRECTORY, TRASH_PATH, USER_CONFIG_PATH } from "./consts";
import { logError, setLogsPath } from "./log";

export interface BookmarkType {
	label: string;
	mount: string;
}

const THEME_KEYS = [
	"bg",
	"fg",
	"border",
	"success",
	"danger",
	"accent",
	"surface",
] as const;

const SYNTAX_KEYS = [
	"keyword",
	"string",
	"comment",
	"number",
	"function",
	"type",
] as const;

type ThemeKey = (typeof THEME_KEYS)[number];

type BaseColorKey = Exclude<ThemeKey, "surface">;

type SyntaxKey = (typeof SYNTAX_KEYS)[number];

export interface ThemeType {
	bg: RGBA;
	surface: RGBA;
	fg: RGBA;
	fg_inverse: RGBA;
	muted: RGBA;
	border: RGBA;
	hover: RGBA;
	selected: RGBA;
	active: RGBA;
	pressed: RGBA;
	input_bg: RGBA;
	overlay: RGBA;
	transparent: RGBA;
	marked: RGBA;
	marked_selected: RGBA;
	success: RGBA;
	success_pressed: RGBA;
	danger: RGBA;
	danger_pressed: RGBA;
	syntax: Record<SyntaxKey, RGBA>;
}

interface ConfigFile {
	bookmarks?: BookmarkType[];
	trash_path?: string;
	logs_path?: string;
	double_click_timeout?: number;
	theme?: unknown;
}

async function loadUserConfig(): Promise<ConfigFile> {
	const file = Bun.file(USER_CONFIG_PATH);

	if (!(await file.exists())) {
		return {};
	}

	try {
		return Bun.TOML.parse(await file.text()) as ConfigFile;
	} catch (error) {
		logError(error);

		return {};
	}
}

export function expandHome(path: string): string {
	if (path === "~" || path.startsWith("~/")) {
		return HOME_DIRECTORY + path.slice(1);
	}

	return path;
}

function normalizePath(path: string): string {
	return resolve(expandHome(path));
}

const userConfig: ConfigFile = await loadUserConfig();

export const bookmarks: BookmarkType[] = (userConfig.bookmarks ?? []).map(
	(bookmark: BookmarkType): BookmarkType => ({
		...bookmark,
		mount: normalizePath(bookmark.mount),
	}),
);

export const trashPath: string = normalizePath(
	userConfig.trash_path ?? TRASH_PATH,
);

export const trashFilesPath: string = `${trashPath}/files`;

export const trashInfoPath: string = `${trashPath}/info`;

if (userConfig.logs_path) {
	setLogsPath(normalizePath(userConfig.logs_path));
}

export const doubleClickTimeout: number =
	userConfig.double_click_timeout ?? 250;

const COLOR_PATTERN: RegExp =
	/^#?([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

const BLACK: RGBA = RGBA.fromValues(0, 0, 0, 1);

const WHITE: RGBA = RGBA.fromValues(1, 1, 1, 1);

const TRANSPARENT: RGBA = RGBA.fromValues(0, 0, 0, 0);

const DARK_SYNTAX: Record<SyntaxKey, string> = {
	keyword: "#FF7B72",
	string: "#A5D6FF",
	comment: "#8B949E",
	number: "#79C0FF",
	function: "#D2A8FF",
	type: "#FFA657",
};

const LIGHT_SYNTAX: Record<SyntaxKey, string> = {
	keyword: "#CF222E",
	string: "#0A3069",
	comment: "#6E7781",
	number: "#0550AE",
	function: "#8250DF",
	type: "#953800",
};

const defaultTheme: Record<BaseColorKey, string> = {
	bg: "#0C0C0C",
	fg: "#fafafa",
	border: "#d4d4d4",
	success: "#16a34a",
	danger: "#dc2626",
	accent: "#0369a1",
};

function isValidColor(value: unknown): value is string {
	return (
		typeof value === "string" &&
		(value.toLowerCase() === "transparent" || COLOR_PATTERN.test(value))
	);
}

function parseThemeColor(key: string, value: unknown): RGBA | undefined {
	if (value === undefined) {
		return undefined;
	}

	if (isValidColor(value)) {
		return parseColor(value);
	}

	logError(new Error(`Invalid color for "${key}": ${String(value)}`));

	return undefined;
}

function withAlpha(color: RGBA, alpha: number): RGBA {
	return RGBA.fromValues(color.r, color.g, color.b, alpha);
}

function isLight(color: RGBA): boolean {
	return 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b > 0.5;
}

function isTable(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOneOf<K extends string>(keys: readonly K[], key: string): key is K {
	return (keys as readonly string[]).includes(key);
}

function parseColorTable<K extends string>(
	name: string,
	value: unknown,
	keys: readonly K[],
	tables: readonly string[] = [],
): Partial<Record<K, RGBA>> {
	const colors: Partial<Record<K, RGBA>> = {};

	if (value === undefined) {
		return colors;
	}

	if (!isTable(value)) {
		logError(new Error(`Invalid ${name} table: ${String(value)}`));

		return colors;
	}

	for (const [key, color] of Object.entries(value)) {
		if (tables.includes(key)) {
			continue;
		}

		if (!isOneOf(keys, key)) {
			logError(new Error(`Unknown ${name} key "${key}"`));

			continue;
		}

		const parsed: RGBA | undefined = parseThemeColor(`${name}.${key}`, color);

		if (parsed) {
			colors[key] = parsed;
		}
	}

	return colors;
}

function makeTheme(config: unknown): ThemeType {
	const colors: Partial<Record<ThemeKey, RGBA>> = parseColorTable(
		"theme",
		config,
		THEME_KEYS,
		["syntax"],
	);
	const overrides: Partial<Record<SyntaxKey, RGBA>> = parseColorTable(
		"theme.syntax",
		isTable(config) ? config.syntax : undefined,
		SYNTAX_KEYS,
	);
	const color = (key: BaseColorKey): RGBA =>
		colors[key] ?? parseColor(defaultTheme[key]);

	const bg: RGBA = color("bg");
	const fg: RGBA = color("fg");
	const success: RGBA = color("success");
	const danger: RGBA = color("danger");
	const accent: RGBA = color("accent");
	const transparent: boolean = bg.a === 0;
	const dark: boolean = transparent ? isLight(fg) : !isLight(bg);
	const fallback: RGBA = dark ? BLACK : WHITE;
	const opaqueBg: RGBA = transparent ? fallback : withAlpha(bg, 1);
	const palette: Record<SyntaxKey, string> = dark ? DARK_SYNTAX : LIGHT_SYNTAX;
	const syntax = (key: SyntaxKey): RGBA =>
		overrides[key] ?? parseColor(palette[key]);

	return {
		bg,
		surface: colors.surface ?? opaqueBg,
		fg,
		fg_inverse: opaqueBg,
		muted: withAlpha(fg, 0.75),
		border: color("border"),
		hover: withAlpha(fg, 0.25),
		selected: withAlpha(fg, 0.75),
		active: fg,
		pressed: withAlpha(fg, 0.75),
		input_bg: withAlpha(fg, 0.25),
		overlay: withAlpha(fg, 0.1),
		transparent: TRANSPARENT,
		marked: withAlpha(accent, 0.25),
		marked_selected: withAlpha(accent, 0.75),
		success,
		success_pressed: withAlpha(success, 0.75),
		danger,
		danger_pressed: withAlpha(danger, 0.75),
		syntax: {
			keyword: syntax("keyword"),
			string: syntax("string"),
			comment: syntax("comment"),
			number: syntax("number"),
			function: syntax("function"),
			type: syntax("type"),
		},
	};
}

export const theme: ThemeType = makeTheme(userConfig.theme);
