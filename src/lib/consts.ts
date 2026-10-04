import { homedir } from "node:os";

export const HOME_DIRECTORY: string = homedir();

export const TRASH_FULL_ICON: string = "";

export const TRASH_EMPTY_ICON: string = "";

export const COLLATOR: Intl.Collator = new Intl.Collator();

export const ARCHIVE_EXTENSIONS: string[] = [
	".tar.gz",
	".tar.xz",
	".tar.bz2",
	".tar.zst",
	".tgz",
	".txz",
	".tbz2",
	".tzst",
	".tar",
	".zip",
];

export const USER_CONFIG_PATH: string = `${HOME_DIRECTORY}/.config/filet/config.toml`;

export const TRASH_PATH: string = `${HOME_DIRECTORY}/.local/share/Trash`;

export const LOGS_PATH: string = `${HOME_DIRECTORY}/.local/state/filet/logs`;

export const PREVIEW_MAX_SIZE: number = 1024 * 1024;

export const PREVIEW_DELAY: number = 100;

export const SYMLINK_TIMEOUT: number = 100;

export const TERMINAL_STARTUP_TIMEOUT: number = 2000;

export const BINARY_CHECK_SIZE: number = 8000;

export const SIDEBAR_MIN_WIDTH: number = 100;

export const PREVIEW_MIN_WIDTH: number = 140;

export const IMAGE_FILETYPES: Set<string> = new Set([
	".png",
	".jpg",
	".jpeg",
	".gif",
	".webp",
]);

export const CODE_FILETYPES: Record<string, string> = {
	".ts": "typescript",
	".tsx": "typescriptreact",
	".vue": "typescriptreact",
	".svelte": "typescriptreact",
	".html": "typescriptreact",
	".htm": "typescriptreact",
	".svg": "typescriptreact",
	".js": "javascript",
	".jsx": "javascriptreact",
	".json": "javascript",
	".md": "markdown",
	".zig": "zig",
};

export const FILETYPE_ICONS: Map<string, string> = new Map<string, string>([
	// JS / TS
	[".ts", ""],
	[".tsx", ""],
	[".js", ""],
	[".jsx", ""],
	[".mjs", ""],
	[".cjs", ""],

	// Data / config
	[".json", "󰘦"],
	[".jsonc", "󰘦"],
	[".jsonl", "󰘦"],
	[".yaml", ""],
	[".yml", ""],
	[".toml", ""],
	[".xml", "󰗀"],
	[".env", ""],
	[".ini", ""],
	[".conf", ""],
	[".sql", ""],
	[".sqlite", ""],
	[".graphql", ""],
	[".gql", ""],
	[".lock", ""],
	[".lockb", ""],

	// Archive
	[".zip", "󰗄"],
	[".rar", "󰗄"],
	[".7z", "󰗄"],
	[".tar", "󰗄"],
	[".gz", "󰗄"],

	// Docs
	[".md", ""],
	[".mdx", ""],
	[".txt", ""],
	[".csv", ""],
	[".xlsx", "󱎏"],
	[".docx", ""],
	[".pdf", "󰈦"],

	// Web
	[".html", ""],
	[".htm", ""],
	[".css", ""],
	[".scss", ""],
	[".sass", ""],
	[".less", ""],
	[".vue", ""],
	[".svelte", ""],

	// Systems languages
	[".rs", ""],
	[".go", ""],
	[".c", ""],
	[".h", ""],
	[".cpp", ""],
	[".cc", ""],
	[".hpp", ""],
	[".cs", ""],
	[".zig", ""],

	// JVM
	[".java", ""],
	[".kt", ""],
	[".kts", ""],
	[".klib", ""],
	[".kexe", ""],
	[".scala", ""],
	[".clj", ""],
	[".cljs", ""],
	[".groovy", ""],

	// Scripting / other languages
	[".py", ""],
	[".rb", ""],
	[".php", ""],
	[".swift", ""],
	[".lua", ""],
	[".pl", ""],
	[".hs", ""],
	[".ex", ""],
	[".exs", ""],
	[".erl", ""],
	[".rs", ""],
	[".rlib", ""],
	[".sh", ""],
	[".bash", ""],
	[".zsh", ""],
	[".fish", ""],
	[".nix", "󱄅"],

	// Images
	[".png", ""],
	[".jpg", ""],
	[".jpeg", ""],
	[".gif", ""],
	[".webp", ""],
	[".avif", ""],
	[".ico", ""],
	[".svg", ""],

	// Certificates
	[".cer", ""],
	[".p8", ""],
	[".p12", ""],
	[".mobileprovision", ""],
	[".pepk", ""],
	[".jks", ""],
	[".pem", ""],
]);

export const FILE_ICON: string = "";

export const FOLDER_ICON: string = "";
