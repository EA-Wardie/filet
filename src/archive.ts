import { version } from "../package.json";

const FILES: readonly string[] = ["filet", "install.sh", "icon.png"];

async function archive(): Promise<string> {
	const name: string = `Release ${version}.tar.xz`;

	for (const file of FILES) {
		if (!(await Bun.file(`./dist/${file}`).exists())) {
			throw new Error(`dist/${file} not found. Run \`bun run build\` first.`);
		}
	}

	await Bun.$`tar -cJf ${`./dist/${name}`} -C ./dist ${FILES}`;

	return name;
}

archive()
	.then((name: string): void => {
		console.log(`Archived dist/${name}`);
	})
	.catch((error): void => {
		console.error(error instanceof Error ? error.message : error);
		process.exit(1);
	});
