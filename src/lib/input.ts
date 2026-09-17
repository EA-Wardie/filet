import { $lastClick } from "./store";

export function isDoubleClick() {
  const now: number = Date.now();
  const lastClick: number = $lastClick.get() || 0;
  const difference: number = now - (lastClick || 0);

  return lastClick !== null && difference < 250;
}
