import type { Dirent } from "node:fs";
import * as core from "@opentui/core";
import { MouseButtons } from "@opentui/core/testing";
import { doubleClickTimeout, theme } from "../lib/config";
import { ctx } from "../lib/context";
import { getFileIcon } from "../lib/icons";
import { SHORTCUTS, toggleMark } from "../lib/shortcuts";
import {
	$dirents,
	$markedNames,
	$selectedDirent,
	clearMarks,
} from "../lib/store";
import { DirentMenu } from "./DirentMenu";

interface Click {
	dirent: Dirent;
	time: number;
}

const ELLIPSIS: string = "…";

const SEGMENTER: Intl.Segmenter = new Intl.Segmenter(undefined, {
	granularity: "grapheme",
});

function fitText(text: string, width: number): string {
	if (Bun.stringWidth(text) <= width) {
		return text;
	}

	const limit: number = width - 1;
	let fitted: string = "";
	let fittedWidth: number = 0;

	for (const { segment } of SEGMENTER.segment(text)) {
		const segmentWidth: number = Bun.stringWidth(segment);

		if (fittedWidth + segmentWidth > limit) {
			break;
		}

		fitted += segment;
		fittedWidth += segmentWidth;
	}

	return `${fitted}${ELLIPSIS}`;
}

export class DirentList extends core.Renderable {
	private _scrollBar: core.ScrollBarRenderable;
	private _dirents: readonly Dirent[] = [];
	private _offset: number = 0;
	private _hovered: number | null = null;
	private _mouseY: number | null = null;
	private _lastClick: Click | null = null;

	constructor(options: core.RenderableOptions<DirentList>) {
		super(ctx, options);

		this._scrollBar = new core.ScrollBarRenderable(ctx, {
			orientation: "vertical",
			position: "absolute",
			top: 0,
			right: 0,
			height: "100%",
			trackOptions: {
				foregroundColor: theme.scrollbar_thumb,
				backgroundColor: theme.scrollbar_track,
			},
			onChange: (position: number): void => {
				this.scrollTo(position);
			},
		});

		this._scrollBar.focusable = false;

		this.add(this._scrollBar);
		this.registerStoreEvents();
	}

	public static make(options: core.RenderableOptions<DirentList>): DirentList {
		return new this(options);
	}

	protected override renderSelf(buffer: core.OptimizedBuffer): void {
		const rowWidth: number =
			this.width - (this._scrollBar.visible ? this._scrollBar.width : 0);
		const textWidth: number = rowWidth - 2;
		const end: number = Math.min(
			this._dirents.length,
			this._offset + this.height,
		);
		const selected: Dirent | null = $selectedDirent.get();
		const markedNames: ReadonlySet<string> = $markedNames.get();

		for (let index: number = this._offset; index < end; index++) {
			const dirent: Dirent | undefined = this._dirents[index];

			if (!dirent) {
				continue;
			}

			const y: number = this.screenY + index - this._offset;
			const isSelected: boolean = dirent === selected;
			const isMarked: boolean = markedNames.has(dirent.name);
			const background: core.RGBA | null = this.background(
				index,
				isSelected,
				isMarked,
			);

			if (background) {
				buffer.fillRect(this.screenX, y, rowWidth, 1, background);
			}

			if (textWidth <= 0) {
				continue;
			}

			buffer.pushScissorRect(this.screenX + 1, y, textWidth, 1);
			buffer.drawText(
				fitText(`${getFileIcon(dirent)} ${dirent.name}`, textWidth),
				this.screenX + 1,
				y,
				isSelected && !isMarked ? theme.fg_inverse : theme.fg,
				undefined,
				core.TextAttributes.BOLD,
			);
			buffer.popScissorRect();
		}
	}

	protected override onResize(width: number, height: number): void {
		super.onResize(width, height);

		const heightChanged: boolean = height !== this._scrollBar.viewportSize;

		this.sync();

		if (heightChanged) {
			this.reveal($selectedDirent.get());
		}
	}

	protected override onMouseEvent(event: core.MouseEvent): void {
		switch (event.type) {
			case "down":
				this.handleMouseDown(event);
				break;
			case "scroll":
				this.handleScroll(event);
				break;
			case "over":
			case "move":
			case "drag":
			case "out":
				this._mouseY =
					event.type === "out" || event.target !== this ? null : event.y;

				this.updateHovered();
				break;
		}
	}

	private rowAt(y: number): number | null {
		const index: number = this._offset + y - this.screenY;

		return index >= 0 && index < this._dirents.length ? index : null;
	}

	private handleMouseDown(event: core.MouseEvent): void {
		const index: number | null =
			event.target === this ? this.rowAt(event.y) : null;
		const dirent: Dirent | undefined =
			index === null ? undefined : this._dirents[index];

		if (!dirent) {
			return;
		}

		if (event.button === MouseButtons.LEFT) {
			const lastClick: Click | null = this._lastClick;
			const isDouble: boolean =
				!event.modifiers.ctrl &&
				lastClick?.dirent === dirent &&
				Date.now() - lastClick.time < doubleClickTimeout;

			this._lastClick =
				event.modifiers.ctrl || isDouble
					? null
					: { dirent: dirent, time: Date.now() };

			$selectedDirent.set(dirent);

			if (event.modifiers.ctrl) {
				toggleMark(dirent);
			} else {
				clearMarks();

				if (isDouble) {
					SHORTCUTS.open.run(dirent);
				}
			}
		} else if (event.button === MouseButtons.RIGHT) {
			event.stopPropagation();

			this._lastClick = null;

			if (!$markedNames.get().has(dirent.name)) {
				clearMarks();
			}

			$selectedDirent.set(dirent);

			DirentMenu.make({ x: event.x, y: event.y, dirent: dirent });
		} else {
			this._lastClick = null;
		}
	}

	private handleScroll(event: core.MouseEvent): void {
		const direction: string | undefined = event.scroll?.direction;
		const step: number = Math.max(1, Math.round(event.scroll?.delta ?? 1));

		if (direction === "up") {
			this.scrollTo(this._offset - step);
		} else if (direction === "down") {
			this.scrollTo(this._offset + step);
		}
	}

	private sync(): void {
		this._scrollBar.scrollSize = this._dirents.length;
		this._scrollBar.viewportSize = this.height;
		this._scrollBar.slider.viewPortSize = Math.max(1, this.height);

		this.scrollTo(this._offset);
	}

	private scrollTo(offset: number): void {
		const max: number = Math.max(0, this._dirents.length - this.height);

		this._offset = Math.min(Math.max(0, offset), max);
		this._scrollBar.scrollPosition = this._offset;

		this.updateHovered();
		this.requestRender();
	}

	private reveal(dirent: Dirent | null): void {
		const index: number = dirent ? this._dirents.indexOf(dirent) : -1;

		if (index < 0 || this.height <= 0) {
			return;
		}

		if (index < this._offset) {
			this.scrollTo(index);
		} else if (index >= this._offset + this.height) {
			this.scrollTo(index - this.height + 1);
		}
	}

	private updateHovered(): void {
		const hovered: number | null =
			this._mouseY === null ? null : this.rowAt(this._mouseY);

		if (hovered === this._hovered) {
			return;
		}

		this._hovered = hovered;

		this.requestRender();
	}

	private background(
		index: number,
		selected: boolean,
		marked: boolean,
	): core.RGBA | null {
		if (marked) {
			return selected ? theme.marked_selected : theme.marked;
		}

		if (selected) {
			return theme.selected;
		}

		return index === this._hovered ? theme.hover : null;
	}

	private registerStoreEvents(): void {
		const unbindDirents = $dirents.subscribe(
			(dirents: readonly Dirent[]): void => {
				this._dirents = dirents;

				this.sync();
			},
		);

		const unbindSelectedDirent = $selectedDirent.listen(
			(dirent: Dirent | null): void => {
				this.reveal(dirent);
				this.requestRender();
			},
		);

		const unbindMarkedNames = $markedNames.listen((): void => {
			this.requestRender();
		});

		this.once(core.RenderableEvents.DESTROYED, (): void => {
			unbindDirents();
			unbindSelectedDirent();
			unbindMarkedNames();
		});
	}
}
