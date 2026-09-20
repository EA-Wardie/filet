Bun.build({
	entrypoints: ["./src/main.ts"],
	compile: {
		target: "bun-linux-x64",
		outfile: "./dist/filet",
		autoloadDotenv: false,
		autoloadBunfig: false,
	},
	minify: true,
	bytecode: true,
	splitting: true,
	format: "esm",
	define: {
		"process.env.NODE_ENV": JSON.stringify("production"),
		VERSION: JSON.stringify("0.0.1"),
	},
})
	.then(async (): Promise<void> => {
		await Bun.write("./dist/install.sh", Bun.file("./scripts/install.sh"));
		await Bun.$`chmod +x ./dist/install.sh`;

		const icon = Bun.file("./assets/icon.png");

		if (await icon.exists()) {
			await Bun.write("./dist/icon.png", icon);
		}

		console.log("Build successful.");
	})
	.catch((error): void => {
		console.error(error);
		process.exit(1);
	});
