import type { Dirent } from "node:fs";
import { cp, mkdir, rm } from "node:fs/promises";
import { basename } from "node:path";
import { trashPath } from "./config";
import { ctx, homeDirectory } from "./context";
import { cleanPath, getDirentPath } from "./navigation";
import { $copyDirent, $currentPath, $cutDirent, $tasks } from "./store";

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

export const USER_CONFIG_PATH: string = `${homeDirectory}/.config/filet/config.toml`;

const FILETYPE_ICONS: Map<string, string> = new Map<string, string>([
  // JS / TS
  ["ts", "\ue8ca"],
  ["tsx", "\ue8ca"],
  ["js", "\ue781"],
  ["jsx", "\ue781"],
  ["mjs", "\ue781"],
  ["cjs", "\ue781"],

  // Data / config
  ["json", "\udb81\ude26"],
  ["jsonc", "\udb81\ude26"],
  ["yaml", "\uf481"],
  ["yml", "\uf481"],
  ["toml", "\ue615"],
  ["xml", "\ue619"],
  ["env", "\uf013"],
  ["ini", "\uf013"],
  ["conf", "\uf013"],
  ["sql", "\ue706"],
  ["sqlite", "\ue706"],
  ["graphql", "\ue662"],
  ["gql", "\ue662"],
  ["lock", "\uf023"],
  ["lockb", "\uf023"],

  // Archive
  ["zip", "\udb81\uddc4"],
  ["rar", "\udb81\uddc4"],
  ["7z", "\udb81\uddc4"],
  ["tar", "\udb81\uddc4"],
  ["gz", "\udb81\uddc4"],

  // Docs
  ["md", "\ue609"],
  ["mdx", "\ue609"],
  ["txt", "\uf15c"],
  ["csv", "\ue64a"],
  ["xlsx", "\udb84\udf8f"],
  ["docx", "\ue6a5"],
  ["pdf", "\udb80\ude26"],

  // Web
  ["html", "\ue736"],
  ["htm", "\ue736"],
  ["css", "\ue749"],
  ["scss", "\ue603"],
  ["sass", "\ue603"],
  ["less", "\ue758"],
  ["vue", "\ufd42"],
  ["svelte", "\ue697"],

  // Systems languages
  ["rs", "\ue7a8"],
  ["go", "\ue627"],
  ["c", "\ue61e"],
  ["h", "\ue61e"],
  ["cpp", "\ue61d"],
  ["cc", "\ue61d"],
  ["hpp", "\ue61d"],
  ["cs", "\uf81a"],
  ["zig", "\ue6a9"],

  // JVM
  ["java", "\ue738"],
  ["kt", "\ue634"],
  ["kts", "\ue634"],
  ["klib", "\ue634"],
  ["kexe", "\ue634"],
  ["scala", "\ue737"],
  ["clj", "\ue768"],
  ["cljs", "\ue768"],
  ["groovy", "\ue775"],

  // Scripting / other languages
  ["py", "\ue73c"],
  ["rb", "\ue739"],
  ["php", "\ue73d"],
  ["swift", "\ue755"],
  ["lua", "\ue620"],
  ["pl", "\ue769"],
  ["hs", "\ue777"],
  ["ex", "\ue62d"],
  ["exs", "\ue62d"],
  ["erl", "\ue7b1"],
  ["r", "\uf25d"],
  ["sh", "\ue795"],
  ["bash", "\ue795"],
  ["zsh", "\ue795"],
  ["fish", "\ue795"],
  ["nix", "\udb84\udd05"],

  // Images
  ["png", "\uf1c5"],
  ["jpg", "\uf1c5"],
  ["jpeg", "\uf1c5"],
  ["gif", "\uf1c5"],
  ["webp", "\uf1c5"],
  ["avif", "\uf1c5"],
  ["ico", "\ue623"],
  ["svg", "\ue698"],
]);

const FILE_ICON: string = "\uf15b";

export function getFileIcon(dirent: Dirent): string {
  if (dirent.isDirectory()) {
    return "\uf07b";
  }

  const dot: number = dirent.name.lastIndexOf(".");

  if (dot <= 0) {
    return FILE_ICON;
  }

  return (
    FILETYPE_ICONS.get(dirent.name.slice(dot + 1).toLowerCase()) ?? FILE_ICON
  );
}

export function copy(dirent: Dirent): void {
  ctx.copyToClipboardOSC52(getDirentPath(dirent));

  $copyDirent.set(dirent);
}

export function cut(dirent: Dirent): void {
  ctx.copyToClipboardOSC52(getDirentPath(dirent));

  $cutDirent.set(dirent);
}

async function copyEntry(dirent: Dirent, toPath: string): Promise<void> {
  const fromPath: string | null = getDirentPath(dirent);

  if (dirent.isDirectory()) {
    await cp(fromPath, toPath, { recursive: true });

    return;
  }

  await Bun.write(toPath, Bun.file(fromPath));
}

async function removeEntry(dirent: Dirent): Promise<void> {
  const path: string | null = getDirentPath(dirent);

  if (dirent.isDirectory()) {
    await rm(path, { recursive: true, force: true });

    return;
  }

  await Bun.file(path).delete();
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
    await copyEntry(dirent, toPath);

    if (isCutting) {
      await removeEntry(dirent);
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

export async function remove(dirent: Dirent): Promise<void> {
  try {
    await removeEntry(dirent);

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
    await copyEntry(dirent, `${trashPath}/files/${dirent.name}`);
    await removeEntry(dirent);
    await writeTrashInfo(fromPath);

    $currentPath.notify();
  } catch (error) {
    console.warn(error);
  }
}
