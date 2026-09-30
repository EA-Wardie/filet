import type { Dirent } from "node:fs";
import { extname } from "node:path";
import { FILE_ICON, FILETYPE_ICONS, FOLDER_ICON } from "./consts";
import { isFolder } from "./navigation";

export function getFileIcon(dirent: Dirent): string {
	if (isFolder(dirent)) {
		return FOLDER_ICON;
	}

	return FILETYPE_ICONS.get(extname(dirent.name).toLowerCase()) ?? FILE_ICON;
}
