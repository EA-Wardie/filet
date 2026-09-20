import type { Dirent } from "node:fs";
import { cp, mkdir, rename as renameEntry, rm } from "node:fs/promises";
import { basename } from "node:path";
import type { Subprocess } from "bun";
import { trashPath } from "./config";
import { ctx } from "./context";
import { cleanPath, getDirentPath } from "./navigation";
import {
	$copyDirent,
	$currentPath,
	$cutDirent,
	$tasks,
	$trashFull,
} from "./store";

export const IMAGE_FILETYPES: Set<string> = new Set([
	".png",
	".jpg",
	".jpeg",
	".gif",
	".webp",
	".avif",
	".ico",
	".svg",
]);

export const CODE_FILETYPES: Record<string, string> = {
	".ts": "typescript",
	".tsx": "typescriptreact",
	".js": "javascript",
	".jsx": "javascriptreact",
	".md": "markdown",
	".zig": "zig",
};

const FILETYPE_ICONS: Map<string, string> = new Map<string, string>([
	// JS / TS
	["ts", ""],
	["tsx", ""],
	["js", ""],
	["jsx", ""],
	["mjs", ""],
	["cjs", ""],

	// Data / config
	["json", "󰘦"],
	["jsonc", "󰘦"],
	["yaml", "\ue8eb"],
	["yml", "\ue8eb"],
	["toml", ""],
	["xml", "\udb81\uddc0"],
	["env", ""],
	["ini", ""],
	["conf", ""],
	["sql", ""],
	["sqlite", ""],
	["graphql", ""],
	["gql", ""],
	["lock", ""],
	["lockb", ""],

	// Archive
	["zip", "󰗄"],
	["rar", "󰗄"],
	["7z", "󰗄"],
	["tar", "󰗄"],
	["gz", "󰗄"],

	// Docs
	["md", ""],
	["mdx", ""],
	["txt", ""],
	["csv", ""],
	["xlsx", "󱎏"],
	["docx", ""],
	["pdf", "󰈦"],

	// Web
	["html", ""],
	["htm", ""],
	["css", ""],
	["scss", ""],
	["sass", ""],
	["less", ""],
	["vue", "\ued4a"],
	["svelte", ""],

	// Systems languages
	["rs", ""],
	["go", ""],
	["c", ""],
	["h", ""],
	["cpp", ""],
	["cc", ""],
	["hpp", ""],
	["cs", "\ue648"],
	["zig", ""],

	// JVM
	["java", ""],
	["kt", ""],
	["kts", ""],
	["klib", ""],
	["kexe", ""],
	["scala", ""],
	["clj", ""],
	["cljs", ""],
	["groovy", ""],

	// Scripting / other languages
	["py", ""],
	["rb", ""],
	["php", ""],
	["swift", ""],
	["lua", ""],
	["pl", ""],
	["hs", ""],
	["ex", ""],
	["exs", ""],
	["erl", ""],
	["r", ""],
	["sh", ""],
	["bash", ""],
	["zsh", ""],
	["fish", ""],
	["nix", "󱄅"],

	// Images
	["png", "\uf03e"],
	["jpg", "\uf03e"],
	["jpeg", "\uf03e"],
	["gif", "\uf03e"],
	["webp", "\uf03e"],
	["avif", "\uf03e"],
	["ico", ""],
	["svg", ""],
]);

const FILE_ICON: string = "";

let currentRipdrag: Subprocess | null = null;

export function getFileIcon(dirent: Dirent): string {
	if (dirent.isDirectory()) {
		return "";
	}

	const dot: number = dirent.name.lastIndexOf(".");

	if (dot <= 0) {
		return FILE_ICON;
	}

	return (
		FILETYPE_ICONS.get(dirent.name.slice(dot + 1).toLowerCase()) ??
		FILE_ICON
	);
}

async function copyDirent(dirent: Dirent, toPath: string): Promise<void> {
	const fromPath: string | null = getDirentPath(dirent);

	if (dirent.isDirectory()) {
		await cp(fromPath, toPath, { recursive: true });

		return;
	}

	await Bun.write(toPath, Bun.file(fromPath));
}

async function removeDirent(dirent: Dirent): Promise<void> {
	const path: string | null = getDirentPath(dirent);

	if (dirent.isDirectory()) {
		await rm(path, { recursive: true, force: true });

		return;
	}

	await Bun.file(path).delete();
}

export function copy(dirent: Dirent): void {
	ctx.copyToClipboardOSC52(getDirentPath(dirent));

	$copyDirent.set(dirent);
}

export function cut(dirent: Dirent): void {
	ctx.copyToClipboardOSC52(getDirentPath(dirent));

	$cutDirent.set(dirent);
}

export async function paste(): Promise<void> {
	const dirent: Dirent | null = $copyDirent.get() ?? $cutDirent.get();

	if (!dirent) {
		return;
	}

	const fromPath: string | null = getDirentPath(dirent);
	const toPath: string = cleanPath(
		`${$currentPath.get()}/${basename(fromPath)}`,
	);
	const isCutting: boolean = !$copyDirent.get();
	const action: string = isCutting ? "Moving" : "Copying";

	$tasks.set([...$tasks.get(), `${action} ${fromPath} to ${toPath}.`]);

	const taskIndex: number = $tasks.get().length - 1;

	try {
		await copyDirent(dirent, toPath);

		if (isCutting) {
			await removeDirent(dirent);
		}
	} catch (error) {
		console.warn(error);

		return;
	}

	const tasks: string[] = $tasks.get();

	tasks.splice(taskIndex, 1);

	if (isCutting) {
		$cutDirent.set(null);
	} else {
		$copyDirent.set(null);
	}

	$currentPath.notify();

	setTimeout((): void => {
		$tasks.set([...tasks]);
	}, 1000);
}

export function createFile(name: string): void {
	const path: string = cleanPath(`${$currentPath.get()}/${name}`);

	Bun.write(path, "")
		.then((): void => {
			$currentPath.notify();
		})
		.catch((error: Error): void => {
			console.warn(error);
		});
}

export function createFolder(name: string): void {
	const path: string = cleanPath(`${$currentPath.get()}/${name}`);

	mkdir(path)
		.then((): void => {
			$currentPath.notify();
		})
		.catch((error: Error): void => {
			console.warn(error);
		});
}

export async function rename(dirent: Dirent, name: string): Promise<void> {
	const fromPath: string = getDirentPath(dirent);
	const toPath: string = cleanPath(`${dirent.parentPath}/${name}`);

	try {
		await renameEntry(fromPath, toPath);

		$currentPath.notify();
	} catch (error) {
		console.warn(error);
	}
}

export async function remove(dirent: Dirent): Promise<void> {
	try {
		await removeDirent(dirent);

		$currentPath.notify();
	} catch (error) {
		console.warn(error);
	}
}

async function writeTrashInfo(path: string): Promise<void> {
	const filename: string = `${path.slice(path.lastIndexOf("/") + 1)}.trashinfo`;

	const content: string = [
		"[Trash Info]",
		`Path=${encodeURI(path)}`,
		`DeletionDate=${new Date().toISOString()}`,
		"",
	].join("\n");

	await Bun.write(`${trashPath}/info/${filename}`, content);
}

export async function moveToTrash(dirent: Dirent): Promise<void> {
	const fromPath: string = getDirentPath(dirent);

	try {
		await copyDirent(dirent, `${trashPath}/files/${dirent.name}`);
		await Promise.all([removeDirent(dirent), writeTrashInfo(fromPath)]);

		$currentPath.notify();
	} catch (error) {
		console.warn(error);
	}
}

export async function emptyTrash(): Promise<void> {
	try {
		await Promise.all([
			rm(`${trashPath}/files`, { recursive: true, force: true }),
			rm(`${trashPath}/info`, { recursive: true, force: true }),
		]);

		await Promise.all([
			mkdir(`${trashPath}/files`, { recursive: true }),
			mkdir(`${trashPath}/info`, { recursive: true }),
		]);

		$trashFull.set(false);
		$currentPath.notify();
	} catch (error) {
		console.warn(error);
	}
}

export function dragOut(path: string): void {
	currentRipdrag?.kill();

	try {
		const process: Subprocess = Bun.spawn(["ripdrag", "--and-exit", path], {
			stdin: "ignore",
			stdout: "ignore",
			stderr: "ignore",
		});

		currentRipdrag = process;

		process.exited.then((): void => {
			if (currentRipdrag === process) {
				currentRipdrag = null;
			}
		});
	} catch (error) {
		console.warn(error);
	}
}
