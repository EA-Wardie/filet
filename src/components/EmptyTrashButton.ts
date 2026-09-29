import type * as core from "@opentui/core";
import { TRASH_EMPTY_ICON } from "../lib/consts";
import { isTrashPath } from "../lib/navigation";
import { $currentPath, $trashFull } from "../lib/store";
import { emptyTrash } from "../lib/trash";
import { Confirmation } from "./Confirmation";
import { IconButton } from "./IconButton";

export class EmptyTrashButton {
	private _options: core.BoxOptions;
	private _component: core.BoxRenderable;

	constructor(options: core.BoxOptions) {
		this._options = options;

		this._component = IconButton.make({
			icon: TRASH_EMPTY_ICON,
			opacity: 0.4,
			visible: isTrashPath($currentPath.get()),
			disabled: (): boolean => !$trashFull.get(),
			onClick: (): void => {
				Confirmation.make({
					heading: "Empty trash?",
					description: "Are you sure you want to empty your trash folder?",
					variant: "danger",
					onConfirm: (): void => {
						emptyTrash();
					},
				});
			},
			...this._options,
		});

		this.registerStoreListeners();
	}

	public static make(options: core.BoxOptions = {}): core.BoxRenderable {
		return new this(options)._component;
	}

	private registerStoreListeners(): void {
		$currentPath.listen((path: string): void => {
			this._component.visible = isTrashPath(path);
		});

		$trashFull.listen((full: boolean): void => {
			this._component.opacity = full ? 1 : 0.4;
		});
	}
}
