import type { Dirent } from "node:fs";
import * as core from "@opentui/core";
import { borderStyle, previewWidth, resolveWidth, theme } from "../lib/config";
import {
	PREVIEW_DELAY,
	PREVIEW_MIN_LIST,
	PREVIEW_MIN_PANEL,
	PREVIEW_MIN_WIDTH,
} from "../lib/consts";
import { ctx } from "../lib/context";
import { canPreview, getDirentPath } from "../lib/navigation";
import { $previewInset, $previewOpen, $selectedDirent } from "../lib/store";
import { IconButton } from "./IconButton";
import { Message } from "./Message";
import { Preview } from "./Preview";

export class PreviewSidebar {
	private _options: core.BoxOptions;
	private _component: core.BoxRenderable;
	private _title: core.TextRenderable | null = null;
	private _content: core.ScrollBoxRenderable | null = null;
	private _path: string | null | undefined;
	private _timeout: Timer | undefined;
	private _parent: core.Renderable | null = null;

	constructor(options: core.BoxOptions) {
		this._options = options;

		this._component = new core.BoxRenderable(ctx, {
			position: "absolute",
			top: 0,
			right: 0,
			width: resolveWidth(previewWidth, ctx.width),
			height: "100%",
			zIndex: 10,
			renderBefore: function (
				this: core.BoxRenderable,
				buffer: core.OptimizedBuffer,
			): void {
				for (let y: number = 0; y < this.height; y++) {
					for (let x: number = 0; x < this.width; x++) {
						buffer.setCell(
							this.screenX + x,
							this.screenY + y,
							" ",
							theme.fg,
							theme.bg,
						);
					}
				}
			},
			border: ["left"],
			borderColor: theme.border,
			borderStyle: borderStyle,
			...this._options,
		});

		this.addHeader();
		this.addContent();
		this.registerStoreEvents();
		this.registerContextEvents();

		queueMicrotask((): void => {
			this.update();
		});
	}

	public static make(options: core.BoxOptions = {}): core.BoxRenderable {
		return new this(options)._component;
	}

	private addHeader(): void {
		const header: core.BoxRenderable = new core.BoxRenderable(ctx, {
			height: 2,
			border: ["bottom"],
			borderColor: theme.border,
			borderStyle: borderStyle,
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
			scrollbarOptions: {
				trackOptions: {
					foregroundColor: theme.scrollbar_thumb,
					backgroundColor: theme.scrollbar_track,
				},
			},
		});

		this._content.focusable = false;

		this._component.add(this._content);
	}

	private clear(): void {
		for (const child of this._content?.getChildren() ?? []) {
			child.destroyRecursively();
		}
	}

	private watchParent(): void {
		const parent: core.Renderable | null = this._component.parent;

		if (!parent || parent === this._parent) {
			return;
		}

		this._parent = parent;

		parent.on(core.LayoutEvents.RESIZED, (): void => {
			this.update();
		});
	}

	private update(): void {
		this.watchParent();

		const room: number = (this._parent?.width ?? ctx.width) - PREVIEW_MIN_LIST;
		const width: number = Math.min(resolveWidth(previewWidth, ctx.width), room);

		this._component.width = Math.max(1, width);
		this._component.visible =
			$previewOpen.get() &&
			ctx.width > PREVIEW_MIN_WIDTH &&
			width >= PREVIEW_MIN_PANEL;

		$previewInset.set(this._component.visible ? width : 0);

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
