import * as core from "@opentui/core";
import { bookmarks, theme } from "../lib/config";
import { HOME_DIRECTORY } from "../lib/consts";
import { ctx } from "../lib/context";
import { $tasks } from "../lib/store";
import { Divider } from "./Divider";
import { SidebarLink } from "./SidebarLink";
import { Spacer } from "./Spacer";
import { TrashSidebarLink } from "./TrashSidebarLink";

export class Sidebar {
	private _options: core.BoxOptions;
	private _component: core.BoxRenderable;
	private _header: core.BoxRenderable | null = null;
	private _footer: core.BoxRenderable | null = null;
	private _taskCount: core.TextRenderable | null = null;

	constructor(options: core.BoxOptions) {
		this._options = options;

		this._component = new core.BoxRenderable(ctx, {
			width: 34,
			height: "100%",
			border: ["left", "right"],
			borderColor: theme.border,
			...this._options,
		});

		this.addHeader();
		this.addPlaces();
		this.addBookmarks();
		this.addTrash();
		this.addDrives();
		this.addFooter();
		this.registerStoreEvents();
		this.registerContextEvents();
	}

	public static make(options: core.BoxOptions = {}): core.BoxRenderable {
		return new this(options)._component;
	}

	private addHeader(): void {
		this._header = new core.BoxRenderable(ctx, {
			border: ["top", "bottom"],
			borderColor: theme.border,
			flexDirection: "row",
			justifyContent: "center",
			paddingX: 1,
		});

		this._header.add(
			new core.TextRenderable(ctx, {
				content: "📁 Filet",
				fg: theme.fg,
			}),
		);

		this._component.add(this._header);
	}

	private addPlaces(): void {
		this._component.add(
			SidebarLink.make({
				path: HOME_DIRECTORY,
				label: " Home",
			}),
		);

		this._component.add(
			SidebarLink.make({
				path: `${HOME_DIRECTORY}/Downloads`,
				label: " Downloads",
			}),
		);

		this._component.add(
			SidebarLink.make({
				path: `${HOME_DIRECTORY}/Documents`,
				label: "󱔗 Documents",
			}),
		);

		this._component.add(
			SidebarLink.make({
				path: `${HOME_DIRECTORY}/Pictures`,
				label: " Pictures",
			}),
		);

		this._component.add(
			SidebarLink.make({
				path: `${HOME_DIRECTORY}/Music`,
				label: " Music",
			}),
		);

		this._component.add(
			SidebarLink.make({
				path: `${HOME_DIRECTORY}/Videos`,
				label: "󰿎 Videos",
			}),
		);
	}

	private addBookmarks(): void {
		this._component.add(Divider.make());

		for (const bookmark of bookmarks) {
			this._component.add(
				SidebarLink.make({
					path: bookmark.mount,
					label: ` ${bookmark.label}`,
				}),
			);
		}
	}

	private addTrash(): void {
		this._component.add(Divider.make());
		this._component.add(TrashSidebarLink.make());
	}

	private addDrives(): void {
		this._component.add(Divider.make());

		this._component.add(
			SidebarLink.make({
				path: "/",
				label: "󰋊 Root",
			}),
		);
	}

	private addFooter(): void {
		this._component.add(Spacer.make());

		this._footer = new core.BoxRenderable(ctx, {
			border: ["top", "bottom"],
			borderColor: theme.border,
			flexDirection: "row",
			justifyContent: "space-between",
			paddingX: 1,
		});

		this._taskCount = new core.TextRenderable(ctx, {
			content: `[${$tasks.get().length}]`,
			fg: theme.fg,
			selectable: false,
		});

		this._footer.add(
			new core.TextRenderable(ctx, {
				content: "Tasks",
				fg: theme.fg,
				selectable: false,
			}),
		);

		this._footer.add(this._taskCount);
		this._component.add(this._footer);
	}

	private registerStoreEvents(): void {
		$tasks.listen((tasks: readonly string[]): void => {
			if (this._taskCount) {
				this._taskCount.content = `[${tasks.length}]`;
			}
		});
	}

	private registerContextEvents(): void {
		ctx.on("resize", (width: number): void => {
			this._component.visible = width > 100;
		});
	}
}
