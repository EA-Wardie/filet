import type { Dirent } from "node:fs";
import type * as core from "@opentui/core";
import { TRASH_FULL_ICON } from "../lib/consts";
import { getDirentPath, isFolder, openTerminal } from "../lib/navigation";
import { SHORTCUTS, shortcutLabel } from "../lib/shortcuts";
import { $previewOpen } from "../lib/store";
import { Divider } from "./Divider";
import { Menu } from "./Menu";
import { MenuButton } from "./MenuButton";

interface Options {
	x: number;
	y: number;
	dirent: Dirent;
}

export class DirentMenu {
	private _component: core.BoxRenderable | null;

	constructor({ x, y, dirent }: Options) {
		const canPreview: boolean =
			SHORTCUTS.preview.when(dirent) && !$previewOpen.get();
		const canExtract: boolean = SHORTCUTS.extract.when(dirent);
		const canTrash: boolean = SHORTCUTS.trash.when(dirent);
		const canRestore: boolean = SHORTCUTS.restore.when(dirent);

		this._component = Menu.make({
			x: x,
			y: y,
			items: [
				MenuButton.make({
					label: "󰏌 Open",
					shortcut: shortcutLabel(SHORTCUTS.open),
					onClick: (): void => {
						SHORTCUTS.open.run(dirent);
					},
				}),
				MenuButton.make({
					label: " Open in Terminal",
					visible: isFolder(dirent),
					onClick: (): void => {
						openTerminal(getDirentPath(dirent));
					},
				}),
				MenuButton.make({
					label: " Preview",
					shortcut: shortcutLabel(SHORTCUTS.preview),
					visible: canPreview,
					onClick: (): void => {
						SHORTCUTS.preview.run();
					},
				}),
				Divider.make({ visible: canExtract }),
				MenuButton.make({
					label: " Extract",
					shortcut: shortcutLabel(SHORTCUTS.extract),
					visible: canExtract,
					onClick: (): void => {
						SHORTCUTS.extract.run(dirent);
					},
				}),
				Divider.make(),
				MenuButton.make({
					label: " Copy",
					shortcut: shortcutLabel(SHORTCUTS.copy),
					onClick: (): void => {
						SHORTCUTS.copy.run(dirent);
					},
				}),
				MenuButton.make({
					label: " Cut",
					shortcut: shortcutLabel(SHORTCUTS.cut),
					onClick: (): void => {
						SHORTCUTS.cut.run(dirent);
					},
				}),
				MenuButton.make({
					label: " Copy Path",
					shortcut: shortcutLabel(SHORTCUTS.copyPath),
					onClick: (): void => {
						SHORTCUTS.copyPath.run(dirent);
					},
				}),
				MenuButton.make({
					label: " Drag Out",
					shortcut: shortcutLabel(SHORTCUTS.dragOut),
					onClick: (): void => {
						SHORTCUTS.dragOut.run(dirent);
					},
				}),
				Divider.make(),
				MenuButton.make({
					label: " Rename",
					shortcut: shortcutLabel(SHORTCUTS.rename),
					onClick: (): void => {
						SHORTCUTS.rename.run(dirent);
					},
				}),
				Divider.make({ visible: canTrash }),
				MenuButton.make({
					label: `${TRASH_FULL_ICON} Trash`,
					shortcut: shortcutLabel(SHORTCUTS.trash),
					visible: canTrash,
					onClick: (): void => {
						SHORTCUTS.trash.run(dirent);
					},
				}),
				MenuButton.make({
					label: "󰚑 Delete",
					shortcut: shortcutLabel(SHORTCUTS.delete),
					visible: SHORTCUTS.delete.when(dirent),
					onClick: (): void => {
						SHORTCUTS.delete.run(dirent);
					},
				}),
				Divider.make({ visible: canRestore }),
				MenuButton.make({
					label: "󰦛 Restore",
					shortcut: shortcutLabel(SHORTCUTS.restore),
					visible: canRestore,
					onClick: (): void => {
						SHORTCUTS.restore.run(dirent);
					},
				}),
			],
		});
	}

	public static make(options: Options): core.BoxRenderable | null {
		return new this(options)._component;
	}
}
