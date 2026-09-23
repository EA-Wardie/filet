import { App } from "./components/App";
import { Explorer } from "./components/Explorer";
import { ExplorerHeader } from "./components/ExplorerHeader";
import { Flex } from "./components/Flex";
import { Footer } from "./components/Footer";
import { Sidebar } from "./components/Sidebar";
import { makeApp } from "./lib/context";

function main() {
	makeApp((): void => {
		App.make({
			components: [
				Sidebar.make().component,
				Flex.make({
					components: [
						ExplorerHeader.make(),
						Explorer.make().component,
						Footer.make().component,
					],
				}),
			],
		});
	});
}

main();
