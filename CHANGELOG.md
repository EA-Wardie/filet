# Changelog

## 0.2.1 (2026-09-27)

### Added

- Columns display mode: the display button switches the list into side-by-side columns that scroll horizontally.

### Changed

- The `display_type` config value `"grid"` is now `"columns"`.
- Display type button uses a columns icon.
- Long names are truncated in the list.
- Markdown files preview as highlighted source with line numbers.
- Search is faster in large folders, as it hides non-matching entries instead of rebuilding the list.

### Fixed

- File operations no longer reset the path bar or re-highlight the sidebar.
- A preview that finishes loading after you navigate away no longer draws into the new view.
- Preview file type detection ignores extension case.

### Internal

- `DisplayType` type shared from `lib/consts.ts`.

- File operations use a dedicated refresh signal instead of re-notifying the current path.
- New `IconButton` component shared by the back, forward, display type, empty trash and search buttons.
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
