import { existsSync } from "node:fs";
import * as core from "@opentui/core";
import { bookmarks, theme } from "../lib/config";
import {
	CONTROLS_ICON,
	DRIVE_ICON,
	HOME_DIRECTORY,
	SIDEBAR_MIN_WIDTH,
} from "../lib/consts";
import { ctx } from "../lib/context";
import { osName } from "../lib/os";
import { SHORTCUTS } from "../lib/shortcuts";
import { $drives, $tasksCount, type Drive } from "../lib/store";
import { Divider } from "./Divider";
import { DriveSidebarLink } from "./DriveSidebarLink";
import { IconButton } from "./IconButton";
import { SidebarLink } from "./SidebarLink";
import { Spacer } from "./Spacer";
import { TrashSidebarLink } from "./TrashSidebarLink";

export class Sidebar {
	private _options: core.BoxOptions;
	private _component: core.BoxRenderable;
	private _header: core.BoxRenderable | null = null;
	private _drives: core.BoxRenderable | null = null;
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
			justifyContent: "space-between",
			paddingX: 1,
		});

		this._header.add(
			new core.TextRenderable(ctx, {
				content: "📁 Filet",
				fg: theme.fg,
			}),
		);

		this._header.add(
			IconButton.make({
				icon: CONTROLS_ICON,
				flexShrink: 0,
				onClick: SHORTCUTS.controls.run,
			}),
		);

		this._component.add(this._header);
	}

	private addPlaces(): void {
		const places: { path: string; label: string }[] = [
			{ path: HOME_DIRECTORY, label: " Home" },
			{ path: `${HOME_DIRECTORY}/Downloads`, label: " Downloads" },
			{ path: `${HOME_DIRECTORY}/Documents`, label: "󱔗 Documents" },
			{ path: `${HOME_DIRECTORY}/Pictures`, label: " Pictures" },
			{ path: `${HOME_DIRECTORY}/Music`, label: " Music" },
			{ path: `${HOME_DIRECTORY}/Videos`, label: "󰿎 Videos" },
		];

		for (const place of places) {
			if (place.path === HOME_DIRECTORY || existsSync(place.path)) {
				this._component.add(SidebarLink.make(place));
			}
		}
	}

	private addBookmarks(): void {
		if (!bookmarks.length) {
			return;
		}

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
				label: `${DRIVE_ICON} ${osName}`,
			}),
		);

		this._drives = new core.BoxRenderable(ctx, {});

		this._component.add(this._drives);
	}

	private showDrives(drives: readonly Drive[]): void {
		if (!this._drives) {
			return;
		}

		for (const child of this._drives.getChildren()) {
			child.destroyRecursively();
		}

		for (const drive of drives) {
			this._drives.add(DriveSidebarLink.make({ drive: drive }));
		}
	}

	private addFooter(): void {
		this._component.add(Spacer.make());

		this._footer = new core.BoxRenderable(ctx, {
			border: ["top", "bottom"],
			borderColor: theme.border,
			flexDirection: "row",
			justifyContent: "space-between",
			paddingX: 1,
			visible: false,
		});

		this._taskCount = new core.TextRenderable(ctx, {
			content: `[${$tasksCount.get()}]`,
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
		$drives.subscribe((drives: readonly Drive[]): void => {
			this.showDrives(drives);
		});

		$tasksCount.listen((count: number): void => {
			if (this._taskCount) {
				this._taskCount.content = `[${count}]`;
			}

			if (this._footer) {
				this._footer.visible = count > 0;
			}
		});
	}

	private registerContextEvents(): void {
		ctx.on("resize", (width: number): void => {
			this._component.visible = width > SIDEBAR_MIN_WIDTH;
		});
	}
}
