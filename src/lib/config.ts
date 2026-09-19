import { RGBA } from "@opentui/core";
import defaultConfig from "../../config.toml";
import { homeDirectory } from "./context";
import { USER_CONFIG_PATH } from "./filesystem";

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
    console.warn(error);

    return {};
  }
}

const userConfig: ConfigFile = await loadUserConfig();

export const bookmarks: BookmarkType[] =
  userConfig.bookmarks ?? defaultConfig.bookmarks;

export const trashPath: string =
  userConfig.trash_path ?? `${homeDirectory}/.local/share/Trash`;

export const doubleClickTimeout: number =
  userConfig.double_click_timeout ?? defaultConfig.double_click_timeout;

const themeConfig: ThemeConfig = {
  ...defaultConfig.theme,
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
