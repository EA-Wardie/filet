import { BoxRenderable, TextRenderable } from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import { Component } from "./Component";

export class Text extends Component<BoxRenderable> {
	private _text: TextRenderable;

	constructor(text: string) {
		super(
			new BoxRenderable(ctx, {
				flexDirection: "row",
			}),
		);

		this._text = new TextRenderable(ctx, {
			content: text,
			fg: theme.fg,
			selectable: false,
		});

		this.component.add(this._text);
	}

	public static make(text: string): Text {
		return new this(text);
	}

	public content(content: string) {
		this._text.content = content;

		return this;
	}

	public center() {
		this.component.width = "100%";
		this.component.justifyContent = "center";

		return this;
	}

	public dim() {
		this._text.fg = theme.fg_dark;

		return this;
	}
}
