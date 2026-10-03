import { appendFile, mkdir } from "node:fs";
import { LOGS_PATH } from "./consts";

interface LogEntry {
	timestamp: string;
	code: string | undefined;
	errno: number | undefined;
	syscall: string | undefined;
	path: string | undefined;
	message: string;
}

let logsPath: string = LOGS_PATH;

export function setLogsPath(path: string): void {
	logsPath = path;
}

function toLogEntry(error: unknown, now: Temporal.ZonedDateTime): LogEntry {
	const { code, errno, syscall, path, message }: NodeJS.ErrnoException =
		error instanceof Error ? error : { name: "", message: String(error) };

	return {
		timestamp: now.toString({
			timeZoneName: "never",
			smallestUnit: "millisecond",
		}),
		code: code,
		errno: errno,
		syscall: syscall,
		path: path,
		message: message,
	};
}

function persist(line: string, now: Temporal.ZonedDateTime): void {
	const file: string = `${logsPath}/${now.toPlainDate()}.jsonl`;

	appendFile(file, line, (error: NodeJS.ErrnoException | null): void => {
		if (error?.code !== "ENOENT") {
			return;
		}

		mkdir(logsPath, { recursive: true }, (): void => {
			appendFile(file, line, (): void => {});
		});
	});
}

export function logError(error: unknown): void {
	const now: Temporal.ZonedDateTime = Temporal.Now.zonedDateTimeISO();
	const line: string = JSON.stringify(toLogEntry(error, now));

	console.error(line);

	persist(`${line}\n`, now);
}
