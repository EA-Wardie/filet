import * as core from "@opentui/core";

export let ctx: core.CliRenderer;

export function makeApp(callback: () => void) {
	core
		.createCliRenderer({
			exitOnCtrlC: false,
			consoleOptions: {
				sizePercent: 20,
			},
		})
		.then((context: core.CliRenderer) => {
			ctx = context;

			// ctx.console.show();

			callback();
		})
		.catch((error: Error) => {
			console.warn(error);
		});
}
