import * as core from "@opentui/core";
import { theme } from "../lib/config";
import { ctx } from "../lib/context";

export type ActionColorType = "default" | "success" | "danger";

interface Options extends core.BoxOptions {
  onClick: () => void;
}

export class Action {
		private _component: core.BoxRenderable;
		private _label: core.TextRenderable | null = null;
		private _callback: (() => void) | null = null;
		private _disabled: boolean = false;

		constructor(options: Options) {
			this._component = new core.BoxRenderable(ctx, {
				backgroundColor: theme.fg,
				flexDirection: "row",
				justifyContent: "center",
				paddingX: 1,
				...this.getEvents("default"),
				...options,
			});

			this._callback = options.onClick || null;

			// this._label = new core.TextRenderable(ctx, {
			//   content: "Button",
			//   fg: theme.bg,
			//   attributes: core.TextAttributes.BOLD,
			//   selectable: false,
			// });

			// this.registerEvents();
		}

		// private guard(handler: () => void): () => void {
		//   return (): void => {
		//     if (this._disabled) {
		//       return;
		//     }

		//     handler();
		//   };
		// }

		// private registerEvents(): void {
		//   this._component.onMouseOver = this.guard((): void => {
		//     this._component.backgroundColor = theme.fg_dark;
		//   });

		//   this._component.onMouseOut = this.guard((): void => {
		//     this._component.backgroundColor = theme.fg;
		//   });

		//   this._component.onMouseDown = this.guard((): void => {
		//     this._component.backgroundColor = theme.fg;

		//     this._callback?.();
		//   });

		//   this._component.onMouseUp = (): void => {
		//     this._component.backgroundColor = theme.fg_dark;
		//   };
		// }

		public static make(options: Options): core.BoxRenderable {
			return new this(options)._component;
		}

		private getEvents(color: ActionColorType) {
			let bg = theme.fg;
			let bgFocused = theme.fg_dark;
			let fg = theme.bg;
			let fgFocused = theme.fg;

			if (color === "success") {
				bg = theme.success;
				bgFocused = theme.success_dark;
				fg = theme.fg;
				fgFocused = theme.fg;
			}

			if (color === "danger") {
				bg = theme.danger;
				bgFocused = theme.danger_dark;
				fg = theme.fg;
				fgFocused = theme.fg;
			}

			return {
				onMouseOver: (): void => {
					if (this._disabled) {
						return;
					}

					this._component.backgroundColor = bgFocused;

					if (this._label) {
						this._label.fg = fg;
					}
				},
				onMouseOut: (): void => {
					if (this._disabled) {
						return;
					}

					this._component.backgroundColor = bg;

					if (this._label) {
						this._label.fg = fgFocused;
					}
				},
				onMouseDown: (): void => {
					if (this._disabled) {
						return;
					}

					this._callback?.();
				},
				// onMouseUp: (): void => {
				//   if (this._disabled) {
				//     return;
				//   }

				//   this._component.backgroundColor = theme.fg_dark;
				// },
			};
		}

  private setFocused() {

  };

		public label(content: string): this {
			this._label = new core.TextRenderable(ctx, {
				content: content,
				fg: theme.bg,
				attributes: core.TextAttributes.BOLD,
				selectable: false,
			});

			this._component.add(this._label);

			return this;
		}

		public disabled(disabled: boolean): this {
			this._disabled = disabled;
			this._component.opacity = disabled ? 0.4 : 1;

			return this;
		}

		public color(color: ActionColorType): this {
			// if (color === "success") {
			//   this._component.backgroundColor = theme.success;
			//   this._label.fg = theme.fg;

			//   this._component.onMouseOver = this.guard((): void => {
			//     this._component.backgroundColor = theme.success_dark;
			//   });

			//   this._component.onMouseOut = this.guard((): void => {
			//     this._component.backgroundColor = theme.success;
			//   });

			//   this._component.onMouseDown = this.guard((): void => {
			//     this._component.backgroundColor = theme.success;

			//     this._callback?.();
			//   });

			//   this._component.onMouseUp = (): void => {
			//     this._component.backgroundColor = theme.success_dark;
			//   };
			// } else if (color === "danger") {
			//   this._component.backgroundColor = theme.danger;
			//   this._label.fg = theme.fg;

			//   this._component.onMouseOver = this.guard((): void => {
			//     this._component.backgroundColor = theme.danger_dark;
			//   });

			//   this._component.onMouseOut = this.guard((): void => {
			//     this._component.backgroundColor = theme.danger;
			//   });

			//   this._component.onMouseDown = this.guard((): void => {
			//     this._component.backgroundColor = theme.danger;

			//     this._callback?.();
			//   });

			//   this._component.onMouseUp = (): void => {
			//     this._component.backgroundColor = theme.danger_dark;
			//   };
			// }

			return this;
		}

		public visible(visible: boolean) {
			this._component.visible = visible;

			return this;
		}

		public onClick(callback: () => void): this {
			this._callback = callback;

			return this;
		}
	}
