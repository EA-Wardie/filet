import * as core from "@opentui/core";
import { theme, trashPath } from "../lib/config";
import { ctx } from "../lib/context";
import { emptyTrash } from "../lib/filesystem";
import { back, canGoBack, canGoForward, forward, go } from "../lib/navigation";
import {
	$backHistory,
	$currentPath,
	$displayType,
	$forwardHistory,
} from "../lib/store";
import { Button } from "./Button";
import { Confirmation } from "./Confirmation";
import { Divider } from "./Divider";
import { Input } from "./Input";
import { Spacer } from "./Spacer";
import { Text } from "./Text";

export class Header {
	private _component: core.BoxRenderable;
	private _backButton: Button;
	private _forwardButton: Button;
	private _currentPathInput: Input;
	private _emptyTrashDivider: Divider;
	private _emptyTrashButton: Button;
	private _displayToggle: Button;

	constructor(options: core.BoxOptions) {
		this._component = new core.BoxRenderable(ctx, {
			border: ["top", "bottom"],
			borderColor: theme.border,
			flexDirection: "row",
			...options,
		});

		this._backButton = Button.make()
			.label("\uf060")
			.variant("link")
			.disabled(!canGoBack())
			.onClick((): void => {
				back();
			});

		this._forwardButton = Button.make()
			.label("\uf061")
			.variant("link")
			.disabled(!canGoForward())
			.onClick((): void => {
				forward();
			});

		this._forwardButton.component.marginRight = 1;

		this._currentPathInput = Input.make()
			.value($currentPath.get())
			.onSubmit((value: string): void => {
				if (!value) {
					return;
				}

				go(value);
			});

		this._currentPathInput.component.marginLeft = 1;

		this._emptyTrashDivider = Divider.make()
			.visible($currentPath.get().includes(trashPath))
			.vertical();

		this._emptyTrashButton = Button.make()
			.label("\udb81\udecc Empty Trash")
			.variant("link")
			.align("center")
			.visible($currentPath.get().includes(trashPath))
			.onClick((): void => {
				Confirmation.make()
					.heading("Empty trash?")
					.description("Are you sure you want to empty your trash folder?")
					.variant("danger")
					.onConfirm((): void => {
						emptyTrash();
					});
			});

		this._displayToggle = Button.make()
			.label($displayType.get() === "list" ? "\udb81\udf58" : "\uf03a")
			.variant("link")
			.onClick((): void => {
				$displayType.set($displayType.get() === "grid" ? "list" : "grid");
			});

		this.addComponents();
		this.registerStoreListeners();
	}

	public static make(options: core.BoxOptions = {}): core.BoxRenderable {
		return new this(options)._component;
	}

	public addComponents(): void {
		this._component.add(this._backButton.component);
		this._component.add(this._forwardButton.component);
		this._component.add(Text.make("\uf015").component);
		this._component.add(this._currentPathInput.component);
		this._component.add(Spacer.make().component);
		this._component.add(this._emptyTrashButton.component);
		this._component.add(this._emptyTrashDivider.component);
		this._component.add(this._displayToggle.component);
	}

	public registerStoreListeners(): void {
		$currentPath.listen((path: string): void => {
			this._currentPathInput.value(path);
			this._emptyTrashButton.visible(path.includes(trashPath));
			this._emptyTrashDivider.visible(path.includes(trashPath));
		});

		$backHistory.listen((): void => {
			this._backButton.disabled(!canGoBack());
		});

		$forwardHistory.listen((): void => {
			this._forwardButton.disabled(!canGoForward());
		});

		$displayType.listen((type: "list" | "grid"): void => {
			this._displayToggle.label(type === "list" ? "\udb81\udf58" : "\uf03a");
		});
	}
}
