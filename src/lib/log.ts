export function logError(error: unknown): void {
	if (!(error instanceof Error)) {
		console.error(error);

		return;
	}

	const { code, errno, syscall, path, message } =
		error as NodeJS.ErrnoException;

	console.error(
		Object.fromEntries(
			Object.entries({ code, errno, syscall, path, message }).filter(
				([_, value]) => value !== undefined,
			),
		),
	);
}
