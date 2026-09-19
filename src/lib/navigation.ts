import type { Dirent } from "node:fs";
import { $backHistory, $currentPath, $forwardHistory } from "./store";

export function go(path: string): void {
  if ($currentPath.get() === path) {
    return;
  }

  $backHistory.set([...$backHistory.get(), $currentPath.get()]);
  $forwardHistory.set([]);
  $currentPath.set(path);
}

export function back(): void {
  const backStack: string[] = $backHistory.get();
  const previousPath: string | null = backStack.at(-1) || null;

  if (previousPath === null) {
    return;
  }

  $backHistory.set(backStack.slice(0, -1));
  $forwardHistory.set([...$forwardHistory.get(), $currentPath.get()]);
  $currentPath.set(previousPath);
}

export function forward(): void {
  const forwardStack: string[] = $forwardHistory.get();
  const nextPath: string | null = forwardStack.at(-1) || null;

  if (nextPath === null) {
    return;
  }

  $forwardHistory.set(forwardStack.slice(0, -1));
  $backHistory.set([...$backHistory.get(), $currentPath.get()]);
  $currentPath.set(nextPath);
}

export function canGoBack(): boolean {
  return $backHistory.get().length > 0;
}

export function canGoForward(): boolean {
  return $forwardHistory.get().length > 0;
}

export function cleanPath(path: string): string {
  return path.replaceAll("//", "/");
}

export function getDirentPath(dirent: Dirent): string {
  return cleanPath(`${dirent.parentPath}/${dirent.name}`);
}

export function openInDefault(dirent: Dirent): void {
  if (dirent.isDirectory()) {
    go(getDirentPath(dirent));

    return;
  }

  try {
    Bun.spawn(["xdg-open", getDirentPath(dirent)], {
      stdio: ["ignore", "ignore", "ignore"],
      detached: true,
    }).unref();
  } catch (error) {
    console.warn(error);
  }
}
