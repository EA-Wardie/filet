import { BoxRenderable, TextRenderable } from "@opentui/core";
import * as config from "../lib/config";
import { ctx } from "../lib/context";
import { homeDirectory } from "../lib/home";
import { $tasks } from "../lib/store";
import { Component } from "./Component";
import { Divider } from "./Divider";
import { SidebarLink } from "./SidebarLink";
import { Spacer } from "./Spacer";
import { TrashSidebarLink } from "./TrashSidebarLink";

export class Sidebar extends Component<BoxRenderable> {
	private _header: BoxRenderable | null = null;
	private _footer: BoxRenderable | null = null;
	private _taskCount: TextRenderable | null = null;

	constructor() {
		super(
			new BoxRenderable(ctx, {
				width: 34,
				height: "100%",
				border: ["left", "right"],
				borderColor: config.theme.border,
			}),
		);

		this.addHeader();
		this.addPlaces();
		this.addBookmarks();
		this.addTrash();
		this.addDrives();
		this.addFooter();
		this.registerStoreEvents();
	}

	public static make(): Sidebar {
		return new this();
	}

	private addHeader(): void {
		this._header = new BoxRenderable(ctx, {
			border: ["top", "bottom"],
			borderColor: config.theme.border,
			flexDirection: "row",
			justifyContent: "center",
			paddingX: 1,
		});

		this._header.add(
			new TextRenderable(ctx, {
				content: "🐠 Filet",
				fg: config.theme.fg,
			}),
		);

		this.component.add(this._header);
	}

	private addPlaces(): void {
		this.component.add(
			SidebarLink.make({
				path: homeDirectory,
				label: "\uf015 Home",
			}),
		);

		this.component.add(
			SidebarLink.make({
				path: `${homeDirectory}/Downloads`,
				label: "\uf019 Downloads",
			}),
		);

		this.component.add(
			SidebarLink.make({
				path: `${homeDirectory}/Documents`,
				label: "\udb85\udd17 Documents",
			}),
		);

		this.component.add(
			SidebarLink.make({
				path: `${homeDirectory}/Pictures`,
				label: "\uf03e Pictures",
			}),
		);

		this.component.add(
			SidebarLink.make({
				path: `${homeDirectory}/Music`,
				label: "\uf001 Music",
			}),
		);

		this.component.add(
			SidebarLink.make({
				path: `${homeDirectory}/Videos`,
				label: "\udb83\udfce Videos",
			}),
		);
	}

	private addBookmarks(): void {
		this.component.add(Divider.make());

		for (const bookmark of config.bookmarks) {
			this.component.add(
				SidebarLink.make({
					path: bookmark.mount,
					label: `\uf02e ${bookmark.label}`,
				}),
			);
		}
	}

	private addTrash(): void {
		this.component.add(Divider.make());
		this.component.add(TrashSidebarLink.make());
	}

	private addDrives(): void {
		this.component.add(Divider.make());

		this.component.add(
			SidebarLink.make({
				path: "/",
				label: "\udb80\udeca Root",
			}),
		);
	}

	private addFooter(): void {
		this.component.add(Spacer.make());

		this._footer = new BoxRenderable(ctx, {
			border: ["top", "bottom"],
			borderColor: config.theme.border,
			flexDirection: "row",
			justifyContent: "space-between",
			paddingX: 1,
		});

		this._taskCount = new TextRenderable(ctx, {
			content: `[${$tasks.get().length}]`,
			fg: config.theme.fg,
		});

		this._footer.add(
			new TextRenderable(ctx, {
				content: "Tasks",
				fg: config.theme.fg,
			}),
		);

		this._footer.add(this._taskCount);
		this.component.add(this._footer);
	}

	private registerStoreEvents(): void {
		$tasks.listen((tasks: readonly string[]): void => {
			if (this._taskCount) {
				this._taskCount.content = `[${tasks.length}]`;
			}
		});
	}
}
