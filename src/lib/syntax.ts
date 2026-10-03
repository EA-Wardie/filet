import * as core from "@opentui/core";
import { theme } from "./config";

let styles: core.SyntaxStyle | undefined;

function createStyles(): core.SyntaxStyle {
	const { keyword, number, function: fn, type } = theme.syntax;

	return core.SyntaxStyle.fromStyles({
		keyword: { fg: keyword, bold: true },
		"keyword.import": { fg: keyword, bold: true },
		"keyword.operator": { fg: keyword },

		string: { fg: theme.syntax.string },
		comment: { fg: theme.syntax.comment, italic: true },
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
		"punctuation.delimiter": { fg: theme.muted },

		default: { fg: theme.fg },
	});
}

export function syntaxStyles(): core.SyntaxStyle {
	styles ??= createStyles();

	return styles;
}
