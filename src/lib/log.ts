export function logError(error: NodeJS.ErrnoException): void {
	const details: Record<string, string | number | undefined> = {
		code: error.code,
		errno: error.errno,
		syscall: error.syscall,
		path: error.path,
		message: error.message,
	};

	console.error(
		Object.fromEntries(
			Object.entries(details).filter(([_, value]) => value !== undefined),
		),
	);
}
