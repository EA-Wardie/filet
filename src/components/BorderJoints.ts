import * as core from "@opentui/core";
import { borderStyle, theme } from "../lib/config";
import { ctx } from "../lib/context";

const UP: number = 1;
const RIGHT: number = 2;
const DOWN: number = 4;
const LEFT: number = 8;

const ARMS: [keyof core.BorderCharacters, number][] = [
	["horizontal", LEFT | RIGHT],
	["vertical", UP | DOWN],
	["topLeft", RIGHT | DOWN],
	["topRight", LEFT | DOWN],
	["bottomLeft", UP | RIGHT],
	["bottomRight", UP | LEFT],
	["topT", LEFT | RIGHT | DOWN],
	["bottomT", LEFT | RIGHT | UP],
	["leftT", UP | DOWN | RIGHT],
	["rightT", UP | DOWN | LEFT],
	["cross", UP | RIGHT | DOWN | LEFT],
];

const NEIGHBOURS: [number, number, number, number][] = [
	[0, -1, UP, DOWN],
	[1, 0, RIGHT, LEFT],
	[0, 1, DOWN, UP],
	[-1, 0, LEFT, RIGHT],
];

const chars: core.BorderCharacters = core.BorderChars[borderStyle];

const armsByChar: Map<number, number> = new Map(
	ARMS.map(
		([key, arms]: [keyof core.BorderCharacters, number]): [number, number] => [
			chars[key].codePointAt(0) ?? 0,
			arms,
		],
	),
);

const charByArms: Map<number, number> = new Map(
	ARMS.map(
		([key, arms]: [keyof core.BorderCharacters, number]): [number, number] => [
			arms,
			chars[key].codePointAt(0) ?? 0,
		],
	),
);

export class BorderJoints extends core.Renderable {
	private _arms: Uint8Array = new Uint8Array(0);

	constructor() {
		super(ctx, {
			position: "absolute",
			width: 0,
			height: 0,
		});
	}

	public static make(): BorderJoints {
		return new this();
	}

	protected override renderSelf(buffer: core.OptimizedBuffer): void {
		const parent: core.Renderable | null = this.parent;

		if (!parent) {
			return;
		}

		const left: number = Math.max(0, parent.screenX);
		const top: number = Math.max(0, parent.screenY);
		const right: number = Math.min(buffer.width, parent.screenX + parent.width);
		const bottom: number = Math.min(
			buffer.height,
			parent.screenY + parent.height,
		);
		const width: number = right - left;
		const height: number = bottom - top;

		if (width <= 0 || height <= 0) {
			return;
		}

		const { char, fg }: { char: Uint32Array; fg: Uint16Array } = buffer.buffers;
		const border: Uint16Array = theme.border.buffer;

		if (this._arms.length < width * height) {
			this._arms = new Uint8Array(width * height);
		}

		const arms: Uint8Array = this._arms;

		arms.fill(0, 0, width * height);

		for (let y: number = 0; y < height; y++) {
			for (let x: number = 0; x < width; x++) {
				const index: number = (top + y) * buffer.width + left + x;
				const cell: number | undefined = armsByChar.get(char[index] ?? 0);

				if (
					cell !== undefined &&
					fg[index * 4] === border[0] &&
					fg[index * 4 + 1] === border[1] &&
					fg[index * 4 + 2] === border[2] &&
					fg[index * 4 + 3] === border[3]
				) {
					arms[y * width + x] = cell;
				}
			}
		}

		for (let y: number = 0; y < height; y++) {
			for (let x: number = 0; x < width; x++) {
				const own: number = arms[y * width + x] ?? 0;

				if (!own) {
					continue;
				}

				let joined: number = own;

				for (const [dx, dy, arm, opposite] of NEIGHBOURS) {
					const nx: number = x + dx;
					const ny: number = y + dy;

					if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
						continue;
					}

					if ((arms[ny * width + nx] ?? 0) & opposite) {
						joined |= arm;
					}
				}

				const next: number | undefined = charByArms.get(joined);

				if (joined !== own && next !== undefined) {
					char[(top + y) * buffer.width + left + x] = next;
				}
			}
		}
	}
}
