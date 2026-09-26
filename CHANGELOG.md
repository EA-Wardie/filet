# Changelog

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
