import { App } from "./components/App";
import { ExplorerFooter } from "./components/ExplorerFooter";
import { ExplorerHeader } from "./components/ExplorerHeader";
import { Flex } from "./components/Flex";
import { ListExplorer } from "./components/ListExplorer";
import { PreviewSidebar } from "./components/PreviewSidebar";
import { Sidebar } from "./components/Sidebar";
import { makeApp } from "./lib/context";
import { registerKeyboardShortcuts } from "./lib/shortcuts";
import { checkTrash } from "./lib/trash";

function main() {
	makeApp((): void => {
		checkTrash();
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
				PreviewSidebar.make(),
			],
		});
	});
}

main();
