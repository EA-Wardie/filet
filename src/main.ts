import { App } from "./components/App";
import { Explorer } from "./components/Explorer";
import { Flex } from "./components/Flex";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { makeApp } from "./lib/context";

function main() {
	makeApp((): void => {
		App.make({
			components: [
				Sidebar.make().component,
				Flex.make({
					components: [
						Header.make(),
						Explorer.make().component,
						Footer.make().component,
					],
				}),
			],
		});
	});
}

main();
