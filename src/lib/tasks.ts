import { logError } from "./log";
import { refresh } from "./navigation";
import { $tasksCount } from "./store";

export async function trackTask(
	task: () => Promise<unknown>,
): Promise<boolean> {
	$tasksCount.set($tasksCount.get() + 1);

	try {
		await task();

		return true;
	} catch (error) {
		logError(error);

		return false;
	} finally {
		setTimeout((): void => {
			$tasksCount.set($tasksCount.get() - 1);
		}, 1000);
	}
}

export async function runTask(
	task: () => Promise<unknown>,
	select?: string | (() => string | undefined),
): Promise<void> {
	const succeeded: boolean = await trackTask(task);

	refresh(
		succeeded ? (typeof select === "function" ? select() : select) : undefined,
	);
}
