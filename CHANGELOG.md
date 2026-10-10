# Changelog

## 0.3.1 (2026-10-10)

### Added

- `I` opens a Properties dialog for the selected entry, also available as Properties at the bottom of the entry context menu. It shows the type (the MIME type for files), path, size, permissions, owner, group, and modified, accessed and created dates. Permissions include the setuid, setgid and sticky bits, such as `rwxrwxrwt (1777)` for `/tmp`. Owner and group names come from `getent`, so network accounts such as LDAP users are named too. Symbolic links also show their target. Folders, including symbolic links to folders, show their item count and total size, which fill in once `du` finishes. A total that skipped folders `du` couldn't read is marked "some folders unreadable". Closing the dialog stops `du`. The dialog closes with Close, `Return` or `Escape`.

### Internal

- New `readProperties()` in `lib/properties.ts` collects an entry's details with callback `node:fs` calls and reports them as label and value rows. It reports again as late folder values arrive, and returns a cancel function that kills `du` and stops any reads that haven't started yet. `getent` looks up the owner and group in parallel.
- New `Properties` component, built like `Confirmation`, that matches rows by label, updating values it already shows and adding rows it doesn't.

## 0.3.0 (2026-10-04)

### Added

- `O` opens a terminal in the current folder, also available as Open in Terminal in the explorer context menu. The new `terminal` config option sets the command, as a string split on spaces or a list of arguments, falling back to `$TERMINAL`, then `xdg-terminal-exec`. An invalid `terminal` is written to the error log. A folder that can't be opened, or a terminal that can't be started or quits with an error within 2 seconds, is reported in the footer and logged.
- Open in Terminal in a folder's context menu opens the terminal in that folder.
- `Y` copies the paths of the marked items, or the selected entry, to the system clipboard, one per line, also available as Copy Path in the entry context menu. It uses the host clipboard where available, and OSC 52 otherwise, so it works over SSH.
- `Ctrl+R` refreshes the current folder, also available as Refresh in the explorer context menu.
- Drag Out in the entry context menu, the same as `A`.

## 0.2.9 (2026-10-04)

### Changed

- The file list only draws the entries on screen, so folders with more than about 16,000 entries, such as `/nix/store`, load fully and scroll smoothly.
- Refreshing after a file operation keeps the current list on screen until the new scan arrives, instead of clearing it first.
- Long names end with `…` where they're cut off.

### Internal

- `ListExplorer` and `DirentLink` are replaced by `VirtualExplorer` and `DirentList`. `DirentList` is a custom `Renderable` that draws the visible rows from `$dirents` in `renderSelf()`, handles clicks, hover and wheel scrolling itself, and owns its `ScrollBarRenderable` as a child. `VirtualExplorer` keeps the folder scanning, sorting, search filtering and explorer menu, and only builds lowercase names for search when a search starts.
- The entry context menu moved from `DirentLink` into its own `DirentMenu` component.
- Right clicking an entry stops the event there, instead of relying on `Menu` to ignore the explorer's menu.
- `DirentList` writes `slider.viewPortSize` after updating the scrollbar, because `ScrollBarRenderable.viewportSize` clamps it against the slider's old range and skips unchanged heights, which left the thumb the wrong size.
- `@opentui/core` is updated to 0.5.14.

## 0.2.8 (2026-10-03)

### Added

- `bg = "transparent"` uses the terminal's own background. Menus and modals stay opaque, using the new `surface` colour, which defaults to black or white depending on `fg`. The code preview palette then follows `fg`.
- Optional `accent` theme colour for marked entries, defaulting to `#0369a1`. Marked entries used `success` before. The README presets and `bun run demo` themes set `accent`, and Sky uses `#ec4899` so marked entries stand out from its blue background.
- Optional `surface` theme colour for menus, prompts and confirmations, defaulting to `bg` made fully opaque, so a partly transparent `bg` doesn't make them see-through.
- A `[theme.syntax]` table overrides the code preview colours for `keyword`, `string`, `comment`, `number`, `function` and `type`.

### Changed

- Unknown keys in `[theme]` and `[theme.syntax]`, and either one not being a table, are written to the error log. A typo like `acent` was silently ignored before.
- Confirmations and prompts no longer tint the screen behind them with a 10% white overlay, which looked wrong on semi-transparent terminals and didn't show on light themes.
- Scrollbars in the file list and preview follow the theme. The track is transparent instead of a fixed dark grey, so `bg = "transparent"` shows through it, and the thumb is `fg` at 50%.

### Fixed

- Theme colours written as short (`#fff`) or 8-digit hex no longer turn the hover, selected, marked and pressed shades magenta.
- An invalid theme colour falls back to its default and is written to the error log, instead of printing a warning over the UI.

### Internal

- `ThemeType` uses semantic tokens (`hover`, `selected`, `active`, `pressed`, `fg_inverse`, `muted`, `input_bg`, `transparent`, `scrollbar_thumb`, `scrollbar_track`, `surface`, `marked`, `marked_selected`, `success_pressed`, `danger_pressed`) instead of `*_light` and `*_dark`. `bg_light` and `bg_dark`, which were built from `fg`, are gone. Components use `theme.transparent` instead of `undefined` or `"transparent"` for no background.
- Shades are built from parsed `RGBA` values with `withAlpha()` instead of appending alpha to the hex string.
- `[theme]` and `[theme.syntax]` are checked by one `parseColorTable()` in `lib/config.ts`. The syntax palettes moved there from `lib/syntax.ts`, and `theme.syntax` holds every syntax colour, so `syntaxStyles()` only maps them to styles.
- `tsconfig.json` enables `exactOptionalPropertyTypes`, `noImplicitReturns` and `forceConsistentCasingInFileNames`. `LogEntry` fields and `PreviewSidebar`'s `_path` and `_timeout` are typed `| undefined` to match.

## 0.2.7 (2026-10-03)

### Added

- Mark several files and folders with `Space`, which also selects the entry below, or with `Ctrl+click`. Marked entries are highlighted in the theme's success colour, and the footer shows how many are marked.
- Cut, copy, trash, delete and drag and drop (`A`) act on all marked entries, or on the selected entry when nothing is marked. Open, preview, rename, extract and restore still act on the selected entry only. Confirmations name the entry, or say "N items" when there are several.
- `ripdrag` receives every marked entry at once.

### Changed

- `Escape` clears the marks first, and the selection on the next press.
- A plain left click clears the marks. Right clicking an unmarked entry clears them before opening its menu, so the menu acts on that entry.
- Marks are cleared when you change folder, and when you cut or copy. After a refresh, marks stay on entries that still exist.
- Entries hidden by the search keep their marks but are not acted on or counted until they are visible again.
- Paste, trash and delete try every item and show "Couldn't <action> <name>" or "Couldn't <action> N items" in the footer when some fail, instead of stopping at the first error. Failed items stay marked, and failed pastes stay on the clipboard so `Ctrl+V` retries only those.
- A multi-item paste checks every destination first, and pastes nothing if any name already exists.
- The clipboard footer shows "Copied N items" or "Cut N items" for several entries.

### Fixed

- Moving an item to trash no longer leaves an orphaned `.trashinfo` file when the move fails.

### Internal

- `$copyDirent` and `$cutDirent` are replaced by the `$copyDirents` and `$cutDirents` lists. New `$markedNames` store of marked names, a `$markedDirents` computed store of the visible marked entries, and `clearMarks()` and `describeDirents()` in `lib/store.ts`.
- `eachDirent()` in `lib/filesystem.ts` runs a batch, logs each failure, sets the footer notice and returns the failed items. `copy`, `cut`, `remove`, `moveToTrash` and `dragOut` take lists.
- Shortcuts that use marks are wrapped with `withTargets()`, and trash and delete share `confirmOutsideTrash()`.

## 0.2.6 (2026-10-01)

### Added

- `Left` or `H` goes up to the parent folder and selects the folder you came from. It stops at the top of the trash. `Right` or `L` opens the selected folder, and does nothing on files or in the trash.

### Changed

- Restore from trash is `Ctrl+Z` again instead of `Z`, matching the common undo shortcut.

### Fixed

- Restore (`Ctrl+Z` and the context menu item) only works on items directly in the trash. Inside a trashed folder or the trash's own `files` and `info` folders, it could restore the wrong item or the whole trash.
- Keyboard shortcuts are ignored while a context menu is open, so they no longer act on a file behind the menu or change folder under it.

## 0.2.5 (2026-10-01)

### Added

- The path bar expands `~` and `~/` to the home folder.
- The footer shows "<path> does not exist", or "Can't open <path>" for other errors, when the path bar can't open a path. It takes priority over the clipboard message, and clears on the next path bar entry, folder change, copy or cut.
- `.jsonl` files show the JSON icon.
- `bun run screenshots` regenerates the README screenshots with VHS, and `bun run demo [dark|ivory|sky|fuchsia]` runs filet in a bubblewrap sandbox with a fake `/home/demo` home folder, so neither shows your username, files or config. See Screenshots in the README.

### Changed

- Rename, New File and New Folder prompts focus their input when they open, so you can type straight away.
- Code previews use a light syntax highlighting palette on light themes, and the theme's `fg` for plain text, variables and punctuation.
- README screenshots are generated by `scripts/screenshots.tape` instead of edited by hand.
- Path bar entries that do not exist are no longer written to the error log, since the footer reports them. Other path bar errors are still logged.

### Fixed

- On light themes, the path bar text, search text and placeholder, input cursors, confirmation and prompt text, and plain text previews were drawn in a light default color and were unreadable.
- Folders whose path only starts with the trash path, such as `Trash-old`, are no longer treated as trash.
- `trash_path`, `logs_path` and bookmark `mount` values in the config can start with `~` and end with `/`. Bookmarks ending in `/` now highlight in the sidebar when open.

### Internal

- `syntaxStyles()` moved from `lib/consts.ts` to `lib/syntax.ts`, and picks its palette from the brightness of `theme.bg`. The style is still built once, on the first code preview.
- New `$notice` store, and a `$footerText` computed store over `$notice`, `$copyDirent` and `$cutDirent` that `ExplorerFooter` subscribes to instead of each store separately.
- Config paths are normalised once when the config loads, by `normalizePath()` in `lib/config.ts`. `expandHome()` moved there from `lib/navigation.ts` and is shared with the path bar.
- Keys that run a shortcut call `preventDefault()`, so they don't also reach an input the shortcut focuses.
- New `scripts/demo.sh` and `scripts/screenshots.tape`, with `demo` and `screenshots` scripts in `package.json`.

## 0.2.4 (2026-09-30)

### Added

- Preview sidebar on the right, opened from the new Preview context menu item and toggled with `P`. It starts closed and stays open until closed with `P` or its close button, previewing each file you select. It hides on narrow windows. The menu item only shows on files while the sidebar is closed.
- JSON files preview with syntax highlighting.
- `Up` and `Down`, or `K` and `J`, move the selection through the explorer and scroll it into view. They stop at the first and last entry, and only move through search matches.
- Files over 1 MB, binary files, and special files such as sockets and pipes are not previewed. Broken symlinks and unreadable files show "No Preview".

### Changed

- Shortcuts are single letters, except `Ctrl+X`, `Ctrl+C` and `Ctrl+V` for cut, copy and paste. Rename is `R`, New File `N`, New Folder `F`, Trash `T`, Restore `Z`, Delete `D`, Extract `E` and Drag `A`. Letters held with Alt are ignored, and letters typed with Shift or Caps Lock still work.
- Double click and `Return` open files in their default application, or run them if they are executable. Folders still open in the explorer.
- Typing a file path into the path bar opens its folder with the file selected, without adding the file to the back history. Relative paths such as `./notes.txt` or `..` resolve against the current folder. A path that does not exist is logged, and the explorer stays on the current folder. The path bar shows the current folder again whenever it loses focus, including after `Escape`.
- Bookmarks that point at a file open its folder with the file selected.
- The preview loads a selection straight away, but while the selection keeps changing, such as when holding `J`, it only loads the last one.
- Renaming, creating or pasting a file or folder selects it afterwards.
- Refreshing after a file operation keeps the selection until the folder is read again, so the preview no longer reloads.
- New File, New Folder and Paste are always available, since the explorer no longer switches to a preview.

### Fixed

- Symlinks to folders open, sort and show icons as folders. A folder waits at most 100 ms for its symlinks, so a link into an unresponsive mount does not keep it from showing.
- Up and down keys no longer also scroll the explorer or preview after clicking in them.
- Images over 25 megapixels or 16384 pixels a side, the limit of the image decoder, show "Image Too Large To Preview" instead of an empty preview. Image formats the decoder does not support show "No Preview".
- `.svg` files preview as highlighted XML source, since the image decoder cannot draw them. `.avif` and `.ico` are no longer treated as images.

### Removed

- `Ctrl+Space`, which is now the same as `Return`.

### Internal

- New `PreviewSidebar` component and `$previewOpen` store, and `Preview` checks the file with `stat` before reading it. Binary files are detected from their first 8000 bytes before decoding.
- New `Message` component for the dim placeholder text in the explorer and previews.
- Path bar input is resolved by `goToPath()` in `lib/navigation.ts`. The entry to select after a navigation or refresh is passed with `refresh(select)` or `runTask(task, select)` and read once with `takeSelectName()`.
- `syntaxStyles()` builds its style once, instead of leaking native memory on each code preview.
- `$previewing` store and the `inDirectory()` shortcut wrapper removed.
- `readFolder()` and `isFolder()` in `lib/navigation.ts` treat symlinks to folders as folders, and `canPreview()` is shared by the preview shortcut and sidebar. File operations still act on the link itself.
- `PREVIEW_MAX_SIZE`, `PREVIEW_DELAY`, `SYMLINK_TIMEOUT`, `BINARY_CHECK_SIZE`, `SIDEBAR_MIN_WIDTH` and `PREVIEW_MIN_WIDTH` in `lib/consts.ts`.

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
