export function logError(error: unknown): void {
	if (!(error instanceof Error)) {
		console.error(error);

		return;
	}

	const { code, errno, syscall, path, message } =
		error as NodeJS.ErrnoException;

	const details: Record<string, string | number | undefined> = {
		code,
		errno,
		syscall,
		path,
		message,
	};

	console.error(
		Object.fromEntries(
			Object.entries(details).filter(([_, value]) => value !== undefined),
		),
	);
}
