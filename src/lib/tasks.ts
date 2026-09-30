import { logError } from "./log";
import { refresh } from "./navigation";
import { $tasksCount } from "./store";

// select names the entry to select after the refresh, if the task succeeds.
export async function runTask(
	task: () => Promise<unknown>,
	select?: string,
): Promise<void> {
	let selectName: string | undefined;

	$tasksCount.set($tasksCount.get() + 1);

	try {
		await task();

		selectName = select;
	} catch (error) {
		logError(error);
	} finally {
		refresh(selectName);

		setTimeout((): void => {
			$tasksCount.set($tasksCount.get() - 1);
		}, 1000);
	}
}
