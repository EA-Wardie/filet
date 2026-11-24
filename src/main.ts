import { App } from "./components/App";
import { ExplorerFooter } from "./components/ExplorerFooter";
import { ExplorerHeader } from "./components/ExplorerHeader";
import { Flex } from "./components/Flex";
import { PreviewSidebar } from "./components/PreviewSidebar";
import { Sidebar } from "./components/Sidebar";
import { VirtualExplorer } from "./components/VirtualExplorer";
import { startPath } from "./lib/chooser";
import { makeApp } from "./lib/context";
import { watchDrives } from "./lib/drives";
import { openStartPath } from "./lib/navigation";
import { registerKeyboardShortcuts } from "./lib/shortcuts";
import { checkTrash } from "./lib/trash";

function main() {
	makeApp((): void => {
		openStartPath(startPath, (): void => {
			checkTrash();
			watchDrives();
			registerKeyboardShortcuts();

			App.make({
				components: [
					Sidebar.make(),
					Flex.make({
						components: [
							ExplorerHeader.make(),
							Flex.make({
								components: [VirtualExplorer.make(), PreviewSidebar.make()],
								height: "auto",
								flexGrow: 1,
								flexShrink: 1,
								minHeight: 0,
							}),
							ExplorerFooter.make(),
						],
					}),
				],
			});
		});
	});
}

main();
