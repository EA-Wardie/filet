import { App } from "./components/App";
import { Explorer } from "./components/Explorer";
import { ExplorerFooter } from "./components/ExplorerFooter";
import { ExplorerHeader } from "./components/ExplorerHeader";
import { Flex } from "./components/Flex";
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
						ExplorerFooter.make(),
					],
				}),
			],
		});
	});
}

main();
