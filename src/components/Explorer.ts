import { type Dirent, readdir, type Stats, stat } from "node:fs";
import * as core from "@opentui/core";
import { MouseButtons } from "@opentui/core/testing";
import { theme, trashPath } from "../lib/config";
import { ctx } from "../lib/context";
import {
	copy,
	createFile,
	createFolder,
	cut,
	getFileIcon,
	moveToTrash,
	paste,
	remove,
	rename,
} from "../lib/filesystem";
import { getDirentPath, go, openInDefault } from "../lib/navigation";
import {
	$copyDirent,
	$currentPath,
	$cutDirent,
	$displayType,
	$selectedFileLink,
} from "../lib/store";
import { Component } from "./Component";
import { Confirmation } from "./Confirmation";
import { Divider } from "./Divider";
import { FileLink } from "./FileLink";
import { Menu } from "./Menu";
import { MenuButton } from "./MenuButton";
import { Preview } from "./Preview";
import { Prompt } from "./Prompt";

export class Explorer extends Component<core.ScrollBoxRenderable> {
	private _dirents: Dirent[] = [];

	constructor() {
		super(
			new core.ScrollBoxRenderable(ctx, {
				width: "100%",
				height: "100%",
				contentOptions: {
					flexDirection: $displayType.get() === "list" ? "column" : "row",
					flexWrap: $displayType.get() === "list" ? "no-wrap" : "wrap",
					columnGap: $displayType.get() === "list" ? 0 : 1,
				},
				viewportCulling: true,
				onMouseDown: (event: core.MouseEvent): void => {
					if (event.button === MouseButtons.RIGHT) {
						Menu.make({
							x: event.x,
							y: event.y,
							items: [
								MenuButton.make({
									label: "\ued80 New File",
									shortcut: "Ctrl+n",
									onClick: (): void => {
										Prompt.make({
											heading: "Create a new file",
											label: "Filename",
											onSubmit: (filename: string): void => {
												createFile(filename);
											},
										});
									},
								}),
								MenuButton.make({
									label: "\ueec7 New Folder",
									shortcut: "Ctrl+f",
									onClick: (): void => {
										Prompt.make({
											heading: "Create a new folder",
											label: "Folder Name",
											onSubmit: (folderName: string): void => {
												createFolder(folderName);
											},
										});
									},
								}),
								Divider.make({
									visible: !!$copyDirent.get() || !!$cutDirent.get(),
								}),
								MenuButton.make({
									label: "\uf07f Paste",
									shortcut: "Ctrl+v",
									visible: !!$copyDirent.get() || !!$cutDirent.get(),
									onClick: (): void => {
										paste();
									},
								}),
							],
						});
					}
				},
			}),
		);

		$currentPath.subscribe((path: string): void => {
			$selectedFileLink.set(null);

			if (this.component.getChildrenCount()) {
				this.component.getChildren().forEach((child: core.Renderable) => {
					this.component.remove(child);
				});
			}

			stat(path, (error: ErrnoException | null, dirent: Stats) => {
				if (error) {
					console.warn(error);

					return;
				}

				if (dirent.isDirectory()) {
					try {
						readdir(
							path,
							{ withFileTypes: true },
							(
								error: NodeJS.ErrnoException | null,
								dirents: Dirent[],
							): void => {
								if (error) {
									console.warn(error);

									return;
								}

								this._dirents = dirents;

								if (dirents.length) {
									this.sortDirents();
									this.drawDirents();

									return;
								} else {
									this.component.add(
										new core.TextRenderable(ctx, {
											content: "\uf07c  --Empty--",
											fg: theme.fg,
											attributes: core.TextAttributes.DIM,
											marginX: 1,
										}),
									);

									return;
								}
							},
						);
					} catch (error) {
						console.warn(error);
					}
				} else {
					this.component.add(Preview.make());
				}
			});
		});

		$displayType.listen((type: "list" | "grid"): void => {
			this.component.contentOptions = this.getContentOptions(type);
		});
	}

	public static make(): Explorer {
		return new this();
	}

	private getContentOptions(type: "list" | "grid"): core.BoxOptions {
		return {
			flexDirection: type === "list" ? "column" : "row",
			flexWrap: type === "list" ? "no-wrap" : "wrap",
			columnGap: type === "list" ? 0 : 1,
		};
	}

	private sortDirents(): void {
		if (this._dirents.length > 1000) {
			return;
		}

		const rank = (dirent: Dirent): number => {
			if (!dirent.isDirectory()) {
				return 2;
			}

			return dirent.name.startsWith(".") ? 1 : 0;
		};

		this._dirents.sort((a: Dirent, b: Dirent): number => {
			const rankDifference: number = rank(a) - rank(b);

			if (rankDifference !== 0) {
				return rankDifference;
			}

			return a.name.localeCompare(b.name);
		});
	}

	private drawDirents() {
		this._dirents.forEach((dirent): void => {
			this.component.add(
				FileLink.make()
					.dirent(dirent)
					.label(`${getFileIcon(dirent)} ${dirent.name}`)
					.onDoubleClick((): void => {
						go(getDirentPath(dirent));
					})
					.onRightClick((event: core.MouseEvent) => {
						Menu.make({
							x: event.x,
							y: event.y,
							items: [
								MenuButton.make({
									label: "\udb80\udfcc Open",
									shortcut: "Ctrl+_",
									onClick: (): void => {
										openInDefault(dirent);
									},
								}),
								Divider.make(),
								MenuButton.make({
									label: "\uf0c5 Copy",
									shortcut: "Ctrl+c",
									onClick: (): void => {
										copy(dirent);
									},
								}),
								MenuButton.make({
									label: "\uf0c4 Cut",
									shortcut: "Ctrl+x",
									onClick: (): void => {
										cut(dirent);
									},
								}),
								Divider.make(),
								MenuButton.make({
									label: "\uf040 Rename",
									shortcut: "Ctrl+r",
									onClick: (): void => {
										Prompt.make({
											heading: dirent.isDirectory()
												? "Rename folder"
												: "Rename file",
											label: dirent.isDirectory() ? "Folder name" : "Filename",
											value: dirent.name,
											onSubmit: (filename: string): void => {
												rename(dirent, filename);
											},
										});
									},
								}),
								Divider.make({
									visible: !$currentPath.get().includes(trashPath),
								}),
								MenuButton.make({
									label: "\uf1f8 Trash",
									shortcut: "Ctrl+t",
									visible: !$currentPath.get().includes(trashPath),
									onClick: (): void => {
										Confirmation.make({
											heading: "Move to trash?",
											description: `Are you sure you want to move '${dirent.name}' to trash?`,
											onConfirm: (): void => {
												moveToTrash(dirent);
											},
										});
									},
								}),
								MenuButton.make({
									label: "\udb81\ude91 Delete",
									shortcut: "Ctrl+d",
									visible: !$currentPath.get().includes(trashPath),
									onClick: (): void => {
										Confirmation.make({
											heading: "Permanently delete?",
											description: `Are you sure you want to permanently delete '${dirent.name}'?`,
											onConfirm: (): void => {
												remove(dirent);
											},
										});
									},
								}),
							],
						});
					}).component,
			);
		});
	}
}
