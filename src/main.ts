import { App } from "./components/App";
// import { Column } from "./components/Column";
import { Explorer } from "./components/Explorer";
import { Flex } from "./components/Flex";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
// import { Toolbar } from "./components/Toolbar";
import { makeApp } from "./lib/context";

function main() {
  makeApp((): void => {
    App.make({
      components: [
        Sidebar.make().component,
        Flex.make({
          components: [
            Header.make(),
            // Toolbar.make().component,
            Explorer.make().component,
            Footer.make().component,
          ],
        }),
      ],
    });
    // Layout.make().components([
    // 	Sidebar.make(),
    // 	Column.make().components([
    // 		Toolbar.make(),
    // 		Explorer.make(),
    // 		Footer.make(),
    // 	]),
    // ]);
  });
}

main();
