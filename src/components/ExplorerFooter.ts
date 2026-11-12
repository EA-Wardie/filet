import * as core from "@opentui/core";
import { version } from "../../package.json";
import { chooser, chooserHeading } from "../lib/chooser";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import { SHORTCUTS, shortcutLabel } from "../lib/shortcuts";
import { $footerText, $selectedDirent } from "../lib/store";
import { Button } from "./Button";

export class ExplorerFooter {
	private _options: core.BoxOptions;
	private _component: core.BoxRenderable;
	private _text: core.TextRenderable | null = null;

	constructor(options: core.BoxOptions) {
		this._options = options;

		this._component = new core.BoxRenderable(ctx, {
			border: ["top", "bottom"],
			borderColor: theme.border,
			flexShrink: 0,
			bottomTitle: ` v${version} `,
			bottomTitleAlignment: "right",
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

	private addChooserButtons(): void {
		if (!chooser) {
			return;
		}

		this._component.add(
			Button.make({
				label: " Cancel",
				flexShrink: 0,
				onClick: (): void => {
					SHORTCUTS.quit.run();
				},
			}),
		);

		this._component.add(
			Button.make({
				label: chooser.save ? "󰆓 Save" : "󰄬 Choose",
				variant: "success",
				flexShrink: 0,
				onClick: (): void => {
					SHORTCUTS.choose.run($selectedDirent.get());
				},
			}),
		);
	}

	private registerStoreEvents(): void {
		$footerText.subscribe((text: string): void => {
			if (this._text) {
				this._text.content = text;
			}
		});
	}
}
