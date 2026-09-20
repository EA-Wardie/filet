import { Column } from "./components/Column";
import { Explorer } from "./components/Explorer";
import { Footer } from "./components/Footer";
import { Layout } from "./components/Layout";
import { Sidebar } from "./components/Sidebar";
import { Toolbar } from "./components/Toolbar";
import { makeApp } from "./lib/context";

function main() {
	makeApp((): void => {
		Layout.make().components([
			Sidebar.make(),
			Column.make().components([
				Toolbar.make(),
				Explorer.make(),
				Footer.make(),
			]),
		]);
	});
}

main();
