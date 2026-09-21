import type { Dirent } from "node:fs";
import * as core from "@opentui/core";
import { version } from "../../package.json";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";
import { getDirentPath } from "../lib/navigation";
import { $copyDirent, $cutDirent } from "../lib/store";
import { Component } from "./Component";
import { Spacer } from "./Spacer";
import { Text } from "./Text";

export class Footer extends Component<core.BoxRenderable> {
	private _footerText: Text;

	constructor() {
		super(
			new core.BoxRenderable(ctx, {
				border: ["top", "bottom"],
				borderColor: theme.border,
				bottomTitle: ` v${version} `,
				bottomTitleAlignment: "right",
				flexDirection: "row",
				justifyContent: "center",
				paddingX: 1,
			}),
		);

		this._footerText = Text.make("");

		this.components([Spacer.make(), this._footerText]);

		$copyDirent.subscribe((dirent: Dirent | null): void => {
			if (dirent) {
				this._footerText.content(`Clipboard: ${getDirentPath(dirent)}`);
			} else {
				this._footerText.content("");
			}
		});

		$cutDirent.subscribe((dirent: Dirent | null): void => {
			if (dirent) {
				this._footerText.content(`Clipboard ${getDirentPath(dirent)}`);
			} else {
				this._footerText.content("");
			}
		});
	}

	public static make(): Footer {
		return new this();
	}
}
