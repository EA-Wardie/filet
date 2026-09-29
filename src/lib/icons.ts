import type { Dirent } from "node:fs";
import { extname } from "node:path";
import { FILE_ICON, FILETYPE_ICONS, FOLDER_ICON } from "./consts";

export function getFileIcon(dirent: Dirent): string {
	if (dirent.isDirectory()) {
		return FOLDER_ICON;
	}

	return FILETYPE_ICONS.get(extname(dirent.name).toLowerCase()) ?? FILE_ICON;
}
