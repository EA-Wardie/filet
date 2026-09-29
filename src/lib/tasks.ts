import { logError } from "./log";
import { refresh } from "./navigation";
import { $tasksCount } from "./store";

export async function runTask(task: () => Promise<unknown>): Promise<void> {
	$tasksCount.set($tasksCount.get() + 1);

	try {
		await task();
	} catch (error) {
		logError(error);
	} finally {
		refresh();

		setTimeout((): void => {
			$tasksCount.set($tasksCount.get() - 1);
		}, 1000);
	}
}
