import type { Dirent } from "node:fs";
import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { PREVIEW_DELAY, PREVIEW_MIN_WIDTH } from "../lib/consts";
import { ctx } from "../lib/context";
import { canPreview, getDirentPath } from "../lib/navigation";
import { $previewOpen, $selectedDirent } from "../lib/store";
import { IconButton } from "./IconButton";
import { Message } from "./Message";
import { Preview } from "./Preview";

export class PreviewSidebar {
	private _options: core.BoxOptions;
	private _component: core.BoxRenderable;
	private _title: core.TextRenderable | null = null;
	private _content: core.ScrollBoxRenderable | null = null;
	private _path?: string | null;
	private _timeout?: Timer;

	constructor(options: core.BoxOptions) {
		this._options = options;

		this._component = new core.BoxRenderable(ctx, {
			width: "40%",
			height: "100%",
			flexShrink: 0,
			border: ["right"],
			borderColor: theme.border,
			...this._options,
		});

		this.addHeader();
		this.addContent();
		this.update();
		this.registerStoreEvents();
		this.registerContextEvents();
	}

	public static make(options: core.BoxOptions = {}): core.BoxRenderable {
		return new this(options)._component;
	}

	private addHeader(): void {
		const header: core.BoxRenderable = new core.BoxRenderable(ctx, {
			height: 3,
			border: ["top", "bottom"],
			borderColor: theme.border,
			flexDirection: "row",
			justifyContent: "space-between",
			paddingX: 1,
		});

		this._title = new core.TextRenderable(ctx, {
			content: "Preview",
			fg: theme.fg,
			truncate: true,
			flexShrink: 1,
			selectable: false,
		});

		header.add(this._title);

		header.add(
			IconButton.make({
				icon: "",
				flexShrink: 0,
				onClick: (): void => {
					$previewOpen.set(false);
				},
			}),
		);

		this._component.add(header);
	}

	private addContent(): void {
		this._content = new core.ScrollBoxRenderable(ctx, {
			width: "100%",
			flexGrow: 1,
		});

		this._content.focusable = false;

		this._component.add(this._content);
	}

	private clear(): void {
		for (const child of this._content?.getChildren() ?? []) {
			child.destroyRecursively();
		}
	}

	private update(): void {
		this._component.visible =
			$previewOpen.get() && ctx.width > PREVIEW_MIN_WIDTH;

		if (this._component.visible) {
			this.show($selectedDirent.get());

			return;
		}

		this._path = undefined;
		this.clear();
	}

	private show(dirent: Dirent | null): void {
		const file: Dirent | null = dirent && canPreview(dirent) ? dirent : null;
		const path: string | null = file ? getDirentPath(file) : null;

		if (!this._component.visible || path === this._path) {
			return;
		}

		this._path = path;

		if (this._title) {
			this._title.content = file?.name ?? "Preview";
		}

		this.clear();

		this._content?.add(
			path
				? Preview.make({ path: path })
				: Message.make({
						content: "  --No File Selected--",
						marginX: 1,
					}),
		);
	}

	private registerStoreEvents(): void {
		$selectedDirent.listen((dirent: Dirent | null): void => {
			const idle: boolean = this._timeout === undefined;

			clearTimeout(this._timeout);

			if (idle) {
				this.show(dirent);
			}

			this._timeout = setTimeout((): void => {
				this._timeout = undefined;

				this.show($selectedDirent.get());
			}, PREVIEW_DELAY);
		});

		$previewOpen.listen((): void => {
			this.update();
		});
	}

	private registerContextEvents(): void {
		ctx.on("resize", (): void => {
			this.update();
		});
	}
}
