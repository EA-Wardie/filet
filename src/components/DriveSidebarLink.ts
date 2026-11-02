import type * as core from "@opentui/core";
import { DRIVE_ICON, REMOVABLE_DRIVE_ICON } from "../lib/consts";
import { ejectDrive, mountDrive } from "../lib/drives";
import { go } from "../lib/navigation";
import type { Drive } from "../lib/store";
import { Menu } from "./Menu";
import { MenuButton } from "./MenuButton";
import { SidebarLink } from "./SidebarLink";

interface Options {
	drive: Drive;
}

export class DriveSidebarLink {
	private _drive: Drive;
	private _component: core.BoxRenderable;

	constructor({ drive }: Options) {
		this._drive = drive;

		const icon: string = drive.removable ? REMOVABLE_DRIVE_ICON : DRIVE_ICON;

		this._component = SidebarLink.make({
			path: drive.mount,
			label: `${icon} ${drive.label}`,
			muted: drive.mount === null,
			onClick: (): void => {
				this.open();
			},
			onMenu: (event: core.MouseEvent): void => {
				this.showMenu(event);
			},
		});
	}

	public static make(options: Options): core.BoxRenderable {
		return new this(options)._component;
	}

	private open(): void {
		if (this._drive.mount === null) {
			mountDrive(this._drive);

			return;
		}

		go(this._drive.mount);
	}

	private showMenu(event: core.MouseEvent): void {
		const mounted: boolean = this._drive.mount !== null;

		Menu.make({
			x: event.x,
			y: event.y,
			items: [
				MenuButton.make({
					label: "󰏌 Open",
					visible: mounted,
					onClick: (): void => {
						this.open();
					},
				}),
				MenuButton.make({
					label: `${DRIVE_ICON} Mount`,
					visible: !mounted,
					onClick: (): void => {
						mountDrive(this._drive);
					},
				}),
				MenuButton.make({
					label: this._drive.removable ? " Eject" : " Unmount",
					visible: mounted,
					onClick: (): void => {
						ejectDrive(this._drive);
					},
				}),
			],
		});
	}
}
