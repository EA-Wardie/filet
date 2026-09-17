import { Bar } from "./components/Bar";
import { Column } from "./components/Column";
import { Explorer } from "./components/Explorer";
import { Layout } from "./components/Layout";
import { Sidebar } from "./components/Sidebar";
import { Text } from "./components/Text";
import { Toolbar } from "./components/Toolbar";
import { makeApp } from "./lib/context";

function main() {
  makeApp((): void => {
    Layout.make().components([
      Sidebar.make(),
      Column.make().components([
        Toolbar.make(),
        Explorer.make(),
        Bar.make().components([Text.make("mouse all | q quit").center()]),
      ]),
    ]);
  });
}

main();
