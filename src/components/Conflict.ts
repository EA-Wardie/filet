import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import { $dialogOpen } from "../lib/store";
import { Button } from "./Button";

export type ConflictChoice = "replace" | "skip" | "keepBoth" | "cancel";

export interface ConflictAnswer {
	choice: ConflictChoice;
	all: boolean;
}

interface Options {
	name: string;
	folder: string;
	more: boolean;
	onAnswer: (answer: ConflictAnswer) => void;
}

function checkbox(checked: boolean): string {
	return `${checked ? "[x]" : "[ ]"} Apply to all (A)`;
}

export class Conflict {
	private _options: Options;
	private _component: core.BoxRenderable;
	private _dialog: core.BoxRenderable;
	private _toggle: core.TextRenderable | null = null;
	private _all: boolean = false;

	constructor(options: Options) {
		this._options = options;

		this._component = new core.BoxRenderable(ctx, {
			width: "100%",
			height: "100%",
			alignItems: "center",
			justifyContent: "center",
			position: "absolute",
			top: 0,
			left: 0,
			zIndex: 100,
		});

		this._dialog = new core.BoxRenderable(ctx, {
			width: 56,
			backgroundColor: theme.surface,
			border: true,
			borderColor: theme.border,
			paddingX: 1,
			zIndex: 101,
		});

		this._component.add(this._dialog);

		this.addText("Already exists");
		this.addText(`'${options.name}' already exists in ${options.folder}`);
		this.addToggle();
		this.addFooter();

		ctx.keyInput.on("keypress", this.onKeypress);
		ctx.root.add(this._component);

		$dialogOpen.set(true);
	}

	public static make(options: Options): void {
		if (!$dialogOpen.get()) {
			new this(options);

			return;
		}

		const unbind: () => void = $dialogOpen.listen((open: boolean): void => {
			if (!open) {
				unbind();
				queueMicrotask((): void => {
					Conflict.make(options);
				});
			}
		});
	}

	private addText(content: string): void {
		this._dialog.add(
			new core.TextRenderable(ctx, {
				content: content,
				fg: theme.fg,
				wrapMode: "word",
				marginBottom: 1,
			}),
		);
	}

	private addToggle(): void {
		if (!this._options.more) {
			return;
		}

		const box: core.BoxRenderable = new core.BoxRenderable(ctx, {
			marginBottom: 1,
			onMouseUp: (): void => {
				this.toggleAll();
			},
		});

		this._toggle = new core.TextRenderable(ctx, {
			content: checkbox(this._all),
			fg: theme.fg,
			selectable: false,
		});

		box.add(this._toggle);
		this._dialog.add(box);
	}

	private addFooter(): void {
		const footer: core.BoxRenderable = new core.BoxRenderable(ctx, {
			width: "100%",
			flexDirection: "row",
			justifyContent: "flex-end",
			columnGap: 1,
		});

		footer.add(
			Button.make({
				label: " Cancel",
				onClick: (): void => {
					this.answer("cancel");
				},
			}),
		);

		footer.add(
			Button.make({
				label: "Skip (S)",
				onClick: (): void => {
					this.answer("skip");
				},
			}),
		);

		footer.add(
			Button.make({
				label: "Replace (R)",
				variant: "danger",
				onClick: (): void => {
					this.answer("replace");
				},
			}),
		);

		footer.add(
			Button.make({
				label: "Keep both",
				variant: "success",
				onClick: (): void => {
					this.answer("keepBoth");
				},
			}),
		);

		this._dialog.add(footer);
	}

	private toggleAll(): void {
		this._all = !this._all;

		if (this._toggle) {
			this._toggle.content = checkbox(this._all);
		}
	}

	private onKeypress = (key: core.KeyEvent): void => {
		if (key.ctrl || key.meta || key.option) {
			return;
		}

		if (key.name === "return") {
			this.answer("keepBoth");
		} else if (key.name === "escape") {
			this.answer("cancel");
		} else if (key.name === "s") {
			this.answer("skip");
		} else if (key.name === "r") {
			this.answer("replace");
		} else if (key.name === "a" && this._options.more) {
			this.toggleAll();
		}
	};

	private answer(choice: ConflictChoice): void {
		ctx.keyInput.off("keypress", this.onKeypress);
		this._component.destroyRecursively();

		$dialogOpen.set(false);

		this._options.onAnswer({ choice: choice, all: this._all });
	}
}

export function askConflict(
	name: string,
	folder: string,
	more: boolean = false,
): Promise<ConflictAnswer> {
	return new Promise<ConflictAnswer>(
		(resolve: (answer: ConflictAnswer) => void): void => {
			Conflict.make({
				name: name,
				folder: folder,
				more: more,
				onAnswer: resolve,
			});
		},
	);
}
