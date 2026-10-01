import { resolve } from "node:path";
import { RGBA } from "@opentui/core";
import { HOME_DIRECTORY, TRASH_PATH, USER_CONFIG_PATH } from "./consts";
import { logError, setLogsPath } from "./log";

export interface BookmarkType {
	label: string;
	mount: string;
}

export interface ThemeType {
	bg: RGBA;
	bg_light: RGBA;
	bg_dark: RGBA;
	fg: RGBA;
	fg_light: RGBA;
	fg_dark: RGBA;
	border: RGBA;
	success: RGBA;
	success_light: RGBA;
	success_dark: RGBA;
	danger: RGBA;
	danger_light: RGBA;
	danger_dark: RGBA;
}

interface ThemeConfig {
	bg: string;
	fg: string;
	border: string;
	success: string;
	danger: string;
}

interface ConfigFile {
	bookmarks?: BookmarkType[];
	trash_path?: string;
	logs_path?: string;
	double_click_timeout?: number;
	theme?: Partial<ThemeConfig>;
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

const themeConfig: ThemeConfig = {
	bg: "#0C0C0C",
	fg: "#fafafa",
	border: "#d4d4d4",
	success: "#16a34a",
	danger: "#dc2626",
	...userConfig.theme,
};

export const theme: ThemeType = {
	bg: RGBA.fromHex(themeConfig.bg),
	bg_light: RGBA.fromHex(`${themeConfig.fg}40`),
	bg_dark: RGBA.fromHex(`${themeConfig.fg}BF`),
	fg: RGBA.fromHex(themeConfig.fg),
	fg_light: RGBA.fromHex(`${themeConfig.fg}40`),
	fg_dark: RGBA.fromHex(`${themeConfig.fg}BF`),
	border: RGBA.fromHex(themeConfig.border),
	success: RGBA.fromHex(themeConfig.success),
	success_light: RGBA.fromHex(`${themeConfig.success}40`),
	success_dark: RGBA.fromHex(`${themeConfig.success}BF`),
	danger: RGBA.fromHex(themeConfig.danger),
	danger_light: RGBA.fromHex(`${themeConfig.danger}40`),
	danger_dark: RGBA.fromHex(`${themeConfig.danger}BF`),
};
