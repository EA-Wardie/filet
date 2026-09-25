import { App } from "./components/App";
import { ExplorerFooter } from "./components/ExplorerFooter";
import { ExplorerHeader } from "./components/ExplorerHeader";
import { Flex } from "./components/Flex";
import { ListExplorer } from "./components/ListExplorer";
import { Sidebar } from "./components/Sidebar";
import { makeApp } from "./lib/context";
import { registerKeyboardShortcuts } from "./lib/shortcuts";

function main() {
	makeApp((): void => {
		registerKeyboardShortcuts();

		App.make({
			components: [
				Sidebar.make(),
				Flex.make({
					components: [
						ExplorerHeader.make(),
						ListExplorer.make(),
						ExplorerFooter.make(),
					],
				}),
			],
		});
	});
}

main();
