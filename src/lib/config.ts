import config from "../../config.toml";
import { RGBA } from "@opentui/core";

export interface Theme {
  bg: RGBA;
  bg_light: RGBA;
  bg_dark: RGBA;
  fg: RGBA;
  fg_light: RGBA;
  fg_dark: RGBA;
  success: RGBA;
  success_light: RGBA;
  success_dark: RGBA;
  danger: RGBA;
  danger_light: RGBA;
  danger_dark: RGBA;
}

export const theme: Theme = {
  bg: RGBA.fromHex(config.theme.bg),
  bg_light: RGBA.fromHex(`${config.theme.fg}40`),
  bg_dark: RGBA.fromHex(`${config.theme.fg}BF`),
  fg: RGBA.fromHex(config.theme.fg),
  fg_light: RGBA.fromHex(`${config.theme.fg}40`),
  fg_dark: RGBA.fromHex(`${config.theme.fg}BF`),
  success: RGBA.fromHex(config.theme.success),
  success_light: RGBA.fromHex(`${config.theme.success}40`),
  success_dark: RGBA.fromHex(`${config.theme.success}BF`),
  danger: RGBA.fromHex(config.theme.danger),
  danger_light: RGBA.fromHex(`${config.theme.danger}40`),
  danger_dark: RGBA.fromHex(`${config.theme.danger}BF`),
};
