import type { Dirent } from "node:fs";
import * as core from "@opentui/core";
import { chooser, chooserHeading } from "../lib/chooser";
import { borderStyle, theme } from "../lib/config";
import { ctx } from "../lib/context";
import { isFolder } from "../lib/navigation";
import { SHORTCUTS, shortcutLabel } from "../lib/shortcuts";
import { $dirents, $footerText, $selectedDirent } from "../lib/store";
import { Button } from "./Button";

export class ExplorerFooter {
	private _options: core.BoxOptions;
	private _component: core.BoxRenderable;
	private _text: core.TextRenderable | null = null;
	private _count: core.TextRenderable | null = null;
	private _buttons: core.BoxRenderable[] = [];

	constructor(options: core.BoxOptions) {
		this._options = options;

		this._component = new core.BoxRenderable(ctx, {
			border: ["top"],
			borderColor: theme.border,
			borderStyle: borderStyle,
			flexShrink: 0,
			...(chooser
				? {
						title: ` ${chooserHeading()} · ${shortcutLabel(SHORTCUTS.choose)} ${chooser.save ? "save here" : "choose"} · ${shortcutLabel(SHORTCUTS.quit)} cancel `,
						titleAlignment: "left" as const,
					}
				: {}),
			flexDirection: "row",
			columnGap: 1,
			paddingX: 1,
			...this._options,
		});

		this.addText();
		this.addCount();
		this.addChooserButtons();
		this.registerStoreEvents();
	}

	public static make(options: core.BoxOptions = {}): core.BoxRenderable {
		return new this(options)._component;
	}

	private addText(): void {
		const center: core.BoxRenderable = new core.BoxRenderable(ctx, {
			flexGrow: 1,
			flexDirection: "row",
			justifyContent: "center",
		});

		this._text = new core.TextRenderable(ctx, {
			content: "",
			fg: theme.fg,
		});

		center.add(this._text);
		this._component.add(center);
	}

	private addCount(): void {
		this._count = new core.TextRenderable(ctx, {
			content: "",
			fg: theme.muted,
			flexShrink: 0,
			...(chooser ? {} : { position: "absolute" as const, right: 1 }),
		});

		this._component.add(this._count);
	}

	private countText(dirents: Dirent[]): string {
		const folders: number = dirents.filter(isFolder).length;
		const files: number = dirents.length - folders;
		const parts: string[] = [];

		if (folders) {
			parts.push(`${folders} ${folders === 1 ? "folder" : "folders"}`);
		}

		if (files) {
			parts.push(`${files} ${files === 1 ? "file" : "files"}`);
		}

		return parts.join(" · ");
	}

	private updateCount(): void {
		if (!this._count) {
			return;
		}

		const count: string = this.countText($dirents.get());
		const text: string = $footerText.get();
		const countWidth: number = Bun.stringWidth(count);
		const buttonsWidth: number = this._buttons.reduce(
			(total: number, button: core.BoxRenderable): number =>
				total + button.width + 1,
			0,
		);
		const room: number = chooser
			? this._component.width - buttonsWidth - countWidth - 3
			: this._component.width - 2 * countWidth - 4;

		this._count.content = count;
		this._count.visible = !text || Bun.stringWidth(text) <= room;
	}

	private addChooserButtons(): void {
		if (!chooser) {
			return;
		}

		this._buttons = [
			Button.make({
				label: " Cancel",
				flexShrink: 0,
				onClick: (): void => {
					SHORTCUTS.quit.run();
				},
			}),
			Button.make({
				label: chooser.save ? "󰆓 Save" : "󰄬 Choose",
				variant: "success",
				flexShrink: 0,
				onClick: (): void => {
					SHORTCUTS.choose.run($selectedDirent.get());
				},
			}),
		];

		for (const button of this._buttons) {
			this._component.add(button);
		}
	}

	private registerStoreEvents(): void {
		$footerText.subscribe((text: string): void => {
			if (this._text) {
				this._text.content = text;
			}

			this.updateCount();
		});

		$dirents.subscribe((): void => {
			this.updateCount();
		});

		this._component.on(core.LayoutEvents.RESIZED, (): void => {
			this.updateCount();
		});
	}
}
