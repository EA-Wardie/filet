import * as core from "@opentui/core";
import { theme } from "./config";

interface Palette {
	keyword: string;
	string: string;
	comment: string;
	number: string;
	function: string;
	type: string;
}

const DARK_PALETTE: Palette = {
	keyword: "#FF7B72",
	string: "#A5D6FF",
	comment: "#8B949E",
	number: "#79C0FF",
	function: "#D2A8FF",
	type: "#FFA657",
};

const LIGHT_PALETTE: Palette = {
	keyword: "#CF222E",
	string: "#0A3069",
	comment: "#6E7781",
	number: "#0550AE",
	function: "#8250DF",
	type: "#953800",
};

function isLight(color: core.RGBA): boolean {
	return 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b > 0.5;
}

let styles: core.SyntaxStyle | undefined;

function createStyles(): core.SyntaxStyle {
	const palette: Palette = isLight(theme.bg) ? LIGHT_PALETTE : DARK_PALETTE;
	const keyword: core.RGBA = core.RGBA.fromHex(palette.keyword);
	const number: core.RGBA = core.RGBA.fromHex(palette.number);
	const fn: core.RGBA = core.RGBA.fromHex(palette.function);
	const type: core.RGBA = core.RGBA.fromHex(palette.type);

	return core.SyntaxStyle.fromStyles({
		keyword: { fg: keyword, bold: true },
		"keyword.import": { fg: keyword, bold: true },
		"keyword.operator": { fg: keyword },

		string: { fg: core.RGBA.fromHex(palette.string) },
		comment: { fg: core.RGBA.fromHex(palette.comment), italic: true },
		number: { fg: number },
		boolean: { fg: number },
		constant: { fg: number },

		function: { fg: fn },
		"function.call": { fg: fn },
		"function.method.call": { fg: fn },
		type: { fg: type },
		constructor: { fg: type },

		variable: { fg: theme.fg },
		"variable.member": { fg: number },
		property: { fg: number },

		operator: { fg: keyword },
		punctuation: { fg: theme.fg },
		"punctuation.bracket": { fg: theme.fg },
		"punctuation.delimiter": { fg: theme.fg_dark },

		default: { fg: theme.fg },
	});
}

export function syntaxStyles(): core.SyntaxStyle {
	styles ??= createStyles();

	return styles;
}
