import { dlopen, type Library } from "bun:ffi";
import { readFile } from "node:fs";
import { userInfo } from "node:os";
import type { $, Subprocess } from "bun";
import {
	COLLATOR,
	DRIVES_POLL_INTERVAL,
	DRIVES_SETTLE_DELAY,
	HOME_DIRECTORY,
} from "./consts";
import { ctx } from "./context";
import { logError } from "./log";
import { go, isInsidePath } from "./navigation";
import { $currentPath, $drives, $notice, type Drive } from "./store";
import { trackTask } from "./tasks";

interface BlockDevice {
	name: string;
	path: string;
	pkname: string | null;
	label: string | null;
	size: string | null;
	type: string;
	parttype: string | null;
	fstype: string | null;
	mountpoints: (string | null)[] | null;
	hotplug: boolean;
}

interface BlockDevices {
	blockdevices: BlockDevice[];
}

interface Interaction {
	error: string;
	exitCode: number;
	cancelled: boolean;
}

const USER: string = userInfo().username;

const MOUNT_ROOTS: string[] = [`/run/media/${USER}/`, `/media/${USER}/`];

const HIDDEN_FILESYSTEMS: Set<string> = new Set<string>([
	"swap",
	"crypto_LUKS",
	"LVM2_member",
	"linux_raid_member",
	"isw_raid_member",
	"ddf_raid_member",
	"zfs_member",
	"bcache",
	"BitLocker",
]);

const HIDDEN_PART_TYPES: Set<string> = new Set<string>([
	"c12a7328-f81f-11d2-ba4b-00a0c93ec93b",
	"0xef",
	"de94bba4-06d1-4d40-a16a-bfd50179d6ac",
	"0x27",
	"e3c9e316-0b5c-4db8-817d-f92df00215ae",
	"21686148-6449-6e6f-744e-656564454649",
	"bc13c2ff-59e6-4262-a352-b275fd6f7172",
]);

const WATCHED_FILES: string[] = ["/proc/self/mounts", "/proc/partitions"];

let snapshot: string | null = null;
let scanCount: number = 0;
let appliedScan: number = 0;
let failureLogged: boolean = false;
let settleTimer: Timer | undefined;
const busy: Set<string> = new Set<string>();
let prompting: Promise<unknown> = Promise.resolve();

function mountPoints(device: BlockDevice): string[] {
	return (device.mountpoints ?? []).filter(
		(mount: string | null): mount is string => mount !== null,
	);
}

function findUserMount(device: BlockDevice): string | null {
	return (
		mountPoints(device).find((mount: string): boolean =>
			MOUNT_ROOTS.some((root: string): boolean => mount.startsWith(root)),
		) ?? null
	);
}

function isMountable(device: BlockDevice, parents: Set<string>): boolean {
	return (
		device.fstype !== null &&
		!HIDDEN_FILESYSTEMS.has(device.fstype) &&
		!HIDDEN_PART_TYPES.has(device.parttype?.toLowerCase() ?? "") &&
		(device.type === "part" ||
			(device.type === "disk" && !parents.has(device.name))) &&
		!mountPoints(device).length
	);
}

function toDrive(device: BlockDevice, mount: string | null): Drive {
	return {
		device: device.path,
		disk: device.pkname ? `/dev/${device.pkname}` : device.path,
		label: device.label ?? `${device.size ?? ""} Volume`.trim(),
		mount: mount,
		removable: device.hotplug,
	};
}

function findDrives(devices: BlockDevice[]): Drive[] {
	const parents: Set<string> = new Set<string>(
		devices.flatMap((device: BlockDevice): string[] =>
			device.pkname ? [device.pkname] : [],
		),
	);
	const drives: Drive[] = [];

	for (const device of devices) {
		const mount: string | null = findUserMount(device);

		if (mount !== null || isMountable(device, parents)) {
			drives.push(toDrive(device, mount));
		}
	}

	return drives.sort((a: Drive, b: Drive): number =>
		COLLATOR.compare(a.label, b.label),
	);
}

function reportFailure(error: unknown): void {
	if (failureLogged) {
		return;
	}

	failureLogged = true;

	logError(error);
}

function applyDrives(drives: Drive[]): void {
	const previous: Drive[] = $drives.get();

	if (JSON.stringify(previous) === JSON.stringify(drives)) {
		return;
	}

	const path: string = $currentPath.get();
	const removed: Drive | undefined = previous.find(
		(drive: Drive): boolean =>
			drive.mount !== null &&
			isInsidePath(path, drive.mount) &&
			!drives.some((next: Drive): boolean => next.mount === drive.mount),
	);

	$drives.set(drives);

	if (removed) {
		go(HOME_DIRECTORY);

		if (!busy.has(removed.device)) {
			$notice.set(`${removed.label} is no longer mounted`);
		}
	}
}

function scanDrives(): Promise<void> {
	const scan: number = ++scanCount;

	return Bun.$`lsblk -J -l -o NAME,PATH,PKNAME,LABEL,SIZE,TYPE,PARTTYPE,FSTYPE,MOUNTPOINTS,HOTPLUG`
		.nothrow()
		.quiet()
		.then((output: $.ShellOutput): void => {
			if (scan <= appliedScan) {
				return;
			}

			appliedScan = scan;

			if (output.exitCode !== 0) {
				reportFailure(new Error(output.stderr.toString().trim()));

				return;
			}

			const { blockdevices }: BlockDevices = output.json() as BlockDevices;

			applyDrives(findDrives(blockdevices));
		})
		.catch(reportFailure);
}

function readWatchedFiles(done: (text: string) => void): void {
	const texts: string[] = [];
	let pending: number = WATCHED_FILES.length;

	WATCHED_FILES.forEach((file: string, index: number): void => {
		readFile(
			file,
			"utf8",
			(error: NodeJS.ErrnoException | null, text: string): void => {
				texts[index] = error ? "" : text;
				pending -= 1;

				if (pending === 0) {
					done(texts.join("\0"));
				}
			},
		);
	});
}

function checkDrives(): void {
	readWatchedFiles((text: string): void => {
		if (text === snapshot) {
			return;
		}

		const settle: boolean = snapshot !== null;

		snapshot = text;

		scanDrives();

		if (settle) {
			clearTimeout(settleTimer);

			settleTimer = setTimeout(scanDrives, DRIVES_SETTLE_DELAY);
			settleTimer.unref();
		}
	});
}

export function watchDrives(): void {
	checkDrives();
	setInterval(checkDrives, DRIVES_POLL_INTERVAL).unref();
}

function flushInput(): void {
	try {
		const libc: Library<{ tcflush: { args: ["i32", "i32"]; returns: "i32" } }> =
			dlopen("libc.so.6", {
				tcflush: { args: ["i32", "i32"], returns: "i32" },
			});

		libc.symbols.tcflush(0, 0);
		libc.close();
	} catch (error) {
		logError(error);
	}
}

function isDismissed(error: string): boolean {
	return error.includes("NotAuthorizedDismissed");
}

async function runUdisksInteractive(
	action: string,
	device: string,
): Promise<Interaction> {
	const ignore: () => void = (): void => {};

	ctx.suspend();
	process.on("SIGINT", ignore);

	try {
		const subprocess: Subprocess<"inherit", "inherit", "pipe"> = Bun.spawn(
			["udisksctl", action, "-b", device],
			{ stdin: "inherit", stdout: "inherit", stderr: "pipe" },
		);
		const [error, exitCode]: [string, number] = await Promise.all([
			new Response(subprocess.stderr).text(),
			subprocess.exited,
		]);

		return {
			error: error.trim() || `udisksctl ${action} exited with ${exitCode}`,
			exitCode: exitCode,
			cancelled: subprocess.signalCode === "SIGINT" || isDismissed(error),
		};
	} finally {
		process.off("SIGINT", ignore);
		flushInput();
		ctx.resume();
	}
}

function queueInteractive(
	action: string,
	device: string,
): Promise<Interaction> {
	const interaction: Promise<Interaction> = prompting.then(
		(): Promise<Interaction> => runUdisksInteractive(action, device),
	);

	prompting = interaction.catch((): void => {});

	return interaction;
}

async function runUdisksDetached(
	action: string,
	device: string,
): Promise<string | null> {
	const subprocess: Subprocess<"ignore", "ignore", "pipe"> = Bun.spawn(
		["udisksctl", action, "-b", device],
		{
			stdin: "ignore",
			stdout: "ignore",
			stderr: "pipe",
			detached: true,
		},
	);
	const [error, exitCode]: [string, number] = await Promise.all([
		new Response(subprocess.stderr).text(),
		subprocess.exited,
	]);

	return exitCode === 0 ? null : error.trim();
}

async function runUdisks(
	action: string,
	device: string,
	failure: string,
): Promise<boolean> {
	const error: string | null = await runUdisksDetached(action, device);

	if (error === null) {
		return true;
	}

	if (!error.includes("NotAuthorizedCanObtain")) {
		$notice.set(failure);

		if (isDismissed(error)) {
			return false;
		}

		throw new Error(error);
	}

	const interaction: Interaction = await queueInteractive(action, device);

	if (interaction.exitCode === 0) {
		return true;
	}

	$notice.set(failure);

	if (interaction.cancelled) {
		return false;
	}

	throw new Error(interaction.error);
}

function hasMountedSibling(drive: Drive): boolean {
	return $drives
		.get()
		.some(
			(other: Drive): boolean =>
				other.disk === drive.disk &&
				other.device !== drive.device &&
				other.mount !== null,
		);
}

function runDriveTask(drive: Drive, task: () => Promise<void>): void {
	if (busy.has(drive.device)) {
		return;
	}

	busy.add(drive.device);

	trackTask(task).finally((): void => {
		busy.delete(drive.device);
	});
}

export function mountDrive(drive: Drive): void {
	runDriveTask(drive, async (): Promise<void> => {
		if (
			!(await runUdisks("mount", drive.device, `Can't mount ${drive.label}`))
		) {
			return;
		}

		await scanDrives();

		const mount: string | null =
			$drives.get().find((next: Drive): boolean => next.device === drive.device)
				?.mount ?? null;

		if (mount !== null) {
			go(mount);
		}
	});
}

export function ejectDrive(drive: Drive): void {
	runDriveTask(drive, async (): Promise<void> => {
		if (
			!(await runUdisks(
				"unmount",
				drive.device,
				`Can't unmount ${drive.label}`,
			))
		) {
			return;
		}

		await scanDrives();

		if (!drive.removable) {
			return;
		}

		if (hasMountedSibling(drive)) {
			$notice.set(
				`${drive.label} unmounted, but its drive has other mounted partitions`,
			);

			return;
		}

		await runUdisks(
			"power-off",
			drive.disk,
			`${drive.label} unmounted, but can't be powered off`,
		);
	});
}
