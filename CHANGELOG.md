# Changelog

## 0.2.3 (2026-09-29)

### Added

- Errors are saved to a JSON Lines file per day in `~/.local/state/filet/logs`, with a local timestamp. The folder can be changed with the new `logs_path` config value.
- Logs section in the README, covering the log location, format and reading logs with `jq`.

### Changed

- Default config values live in `lib/config.ts`, and the bundled `config.toml` is removed. A user config at `~/.config/filet/config.toml` still overrides any of them.
- Errors in the console are shown as the same JSON line that is saved to the log file.

### Internal

- Log timestamps and file names use `Temporal` instead of hand-written date formatting.
- Default trash and logs paths are `TRASH_PATH` and `LOGS_PATH` in `lib/consts.ts`.

## 0.2.2 (2026-09-28)

### Added

- Extract `.tar`, `.tar.gz`, `.tgz`, `.tar.xz`, `.txz`, `.tar.bz2`, `.tbz2`, `.tar.zst`, `.tzst` and `.zip` archives from the context menu or with `Ctrl+E`, using `tar` and `unzip`. Archives unpack into a folder named after them, existing folders are never overwritten, and a failed extract removes its partial folder.
- Requirements section in the README.

### Changed

- Context menus are wider.
- Creating a file or folder shows in the tasks counter.
- Paste and extract collisions are logged as errors, like restore.

### Fixed

- Shortcuts follow the context menus in the trash. Trash, Delete and Extract are blocked there, and Restore is blocked everywhere else.
- Rename, delete and trash actions refresh the view even when they fail.
- File icons no longer use Windows path rules to find the extension.

### Internal

- `lib/filesystem.ts` split into `trash.ts`, `archive.ts`, `ripdrag.ts` and `icons.ts`.
- New `runTask()` in `lib/tasks.ts` handles the task counter, error logging and refresh for every file operation, including creating files and folders.
- Shortcuts can declare a `when` check, which guards the key binding and sets the context menu item visibility.
- Trash folder paths are defined once in `lib/config.ts`.

## 0.2.1 (2026-09-27)

### Removed

- Display type button and the `display_type` config value. The explorer is always a list.

### Changed

- Long names are truncated in the list.
- Markdown files preview as highlighted source with line numbers.
- Search is faster in large folders, as it hides non-matching entries instead of rebuilding the list.
- Folders with over 1000 entries are now sorted too.
- The selection stays on the same entry after a paste, trash or other refresh.
- Changing the selection only restyles the old and new rows.
- Opening a folder reads it with one call instead of two.

### Fixed

- File operations no longer reset the path bar or re-highlight the sidebar.
- A preview that finishes loading after you navigate away no longer draws into the new view.
- Preview file type detection ignores extension case.
- The Open menu item shows its real shortcut, `Ctrl+Space`.
- New File, New Folder and Paste are disabled while previewing a file, from both the menu and the keyboard.

### Internal

- Each action is defined once in `lib/shortcuts.ts`. The menus and double click use it, and the menu labels come from the key bindings.
- Navigation clears the search itself, so the explorer no longer tracks which folder it loaded.
- `Preview` takes its path as an option.
- `ListExplorer` no longer keeps the entry list as a field, and its context menu has moved into `showMenu()`.
- File operations use a dedicated refresh signal instead of re-notifying the current path.
- New `IconButton` component shared by the back, forward, empty trash and search buttons.
- `isTrashPath()` helper and trash icon constants replace repeated checks and glyphs.
- Path bar handles Escape only while focused.
- `sortLinks` renamed to `sortDirents`, plus small cleanups in `DirectorySearch`, `Divider` and `log.ts`.

## 0.2.0 (2026-09-27)

### Added

- Directory search: filter the current folder by name from the header. The filter stays through file operations, clears when closed or on navigation, and shows "No matches" when nothing matches.
- Errors are logged with their code, syscall and path.

### Changed

- Empty Trash button is icon-only.
- Header has a divider before the search and display buttons.
- Path bar is narrower and highlights when focused.

### Fixed

- Enter only navigates to the path bar's value when the path bar is focused.
- Navigating quickly no longer shows an older folder's contents.

### Internal

- `DisplayTypeToggle` renamed to `DisplayTypeButton`.
- `Divider` supports a vertical option.
- `ListExplorer` directory loading moved into one reusable method.
- Search filters loaded entries in memory instead of re-reading the directory.

## 0.1.9 (2026-09-26)

### Added

- Restore from trash (context menu and `Ctrl+Z`).
- Sidebar hides on narrow windows.
- File and folder icons in the explorer, including certificate files.

### Changed

- Cut, paste and move to trash use rename, so moves on the same drive are instant.
- Sidebar tasks counter shows running operations and hides when idle.
- Bookmarks section hides when no bookmarks are set.
- Shortcut labels are capitalised, and the README lists `Ctrl+Z`.
- Updated `@opentui/core`, `nanostores` and `typescript`.

### Fixed

- Pasting into the source folder no longer empties or deletes the file.
- Pasting no longer overwrites an existing file or folder.
- Copy and cut now cancel each other.
- View refreshes after a failed paste.
- Tasks count decrements when an operation fails.
- Trash icon resets after restoring the last item.
- Renderer start-up errors are logged.

### Internal

- Keyboard shortcuts moved to `lib/shortcuts.ts` as a key map, removing circular imports.
- Constants moved to `lib/consts.ts`, and `lib/home.ts` removed.
- `Sidebar` rewritten and the unused `Component` class removed.
- `Button` cleaned up.
- `.fallow` added to `.gitignore`.
