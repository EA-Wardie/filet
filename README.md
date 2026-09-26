<p align="center">
  <img src="assets/icon.png" alt="filet icon" width="128">
</p>

# filet

Simple terminal file manager with first party mouse support. Built with OpenTUI on Bun.

## Disclaimers

- LLMs were used during development for research, prototyping, refactoring, and some code generation.
- This is beta software and bugs should be expected. Use at your own risk.
- A Nerd Font is required for icon support.

## Features

- Explore directories.
- Preview text based files and images.
- Copy, cut, rename, trash and delete files and directories.
- Bookmarks and a themeable UI, configurable through a user config file.
- First party mouse support.

## Screenshots

<table>
  <tr>
    <td>
        <img src="assets/screenshot_1.png" alt="filet screenshot 1" width="100%">
    </td>
    <td>
        <img src="assets/screenshot_2.png" alt="filet screenshot 2" width="100%">
    </td>
  </tr>
  <tr>
    <td>
        <img src="assets/screenshot_3.png" alt="filet screenshot 3" width="100%">
    </td>
    <td>
        <img src="assets/screenshot_4.png" alt="filet screenshot 4" width="100%">
    </td>
  </tr>
</table>

## Configuration

filet ships with a default config at `config.toml`. To override it, create your own config file at:

```
~/.config/filet/config.toml
```

Values in your user config take priority over the defaults, and any values you leave out fall back to the defaults, for example:

```toml
bookmarks = [
    {label = "Projects", mount = "/home/<user>/Projects"},
]

display_type = "list"

trash_path = "/home/<user>/.local/share/Trash"

double_click_timeout = 250

[theme]
bg = "#0C0C0C"
fg = "#fafafa"
border = "#d4d4d4"
success = "#16a34a"
danger = "#dc2626"
```

## Controls

### Mouse

| Action         | Target         | Result                                                         |
| -------------- | -------------- | -------------------------------------------------------------- |
| `Left click`   | File or folder | Select it.                                                     |
| `Double click` | File or folder | Open it. Folders in explorer and files a preview if suportted. |
| `Right click`  | File or folder | Open its context menu.                                         |
| `Right click`  | Explorer       | Open the explorer context menu.                                |
| `Left click`   | Sidebar link   | Select and navigate to it.                                     |

### Keyboard

| Key          | Action                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------ |
| `Return`     | Open the selected file or folder. Folders open in the explorer and files a preview if supported. |
| `Escape`     | Clear the selection.                                                                             |
| `Ctrl+Space` | Open the selected file in its default application, or run it if it is executable.                |
| `Ctrl+X`     | Cut the selected file or folder.                                                                 |
| `Ctrl+C`     | Copy the selected file or folder.                                                                |
| `Ctrl+V`     | Paste the cut or copied file or folder into the current folder.                                  |
| `Ctrl+R`     | Rename the selected file or folder.                                                              |
| `Ctrl+N`     | Create a new file in the current folder.                                                         |
| `Ctrl+F`     | Create a new folder in the current folder.                                                       |
| `Ctrl+A`     | Drag and drop the selected file or folder using `ripdrag`.                                       |
| `Ctrl+T`     | Move the selected file or folder to trash, after confirmation.                                   |
| `Ctrl+D`     | Permanently delete the selected file or folder, after confirmation.                              |
| `Q`          | Quit the application, after confirmation.                                                        |

In a confirmation or prompt dialog, `Return` confirms and `Escape` cancels.

`Ctrl+A` requires [ripdrag](https://github.com/nik012003/ripdrag) to be installed and available on your `PATH`.

## Theming

Besides the default dark theme, here are a few others to try. Copy one into your `~/.config/filet/config.toml`, replacing the existing `[theme]` section. Or create your own theme.

Tip: See the [tailwind](https://tailwindcss.com/docs/colors) color pallet.

### Ivory

```toml
[theme]
bg = "#e5e5e5"
fg = "#0a0a0a"
border = "#262626"
success = "#16a34a"
danger = "#dc2626"
```

### Sky

```toml
[theme]
bg = "#075985"
fg = "#f0f9ff"
border = "#d4d4d4"
success = "#16a34a"
danger = "#dc2626"
```

### Fuchsia

```toml
[theme]
bg = "#701a75"
fg = "#fdf4ff"
border = "#d4d4d4"
success = "#16a34a"
danger = "#dc2626"
```

## Building

filet uses Bun as its runtime, package manager, and bundler.

Install dependencies:

```
bun install
```

Build a standalone binary:

```
bun run build
```

This produces a binary at `dist/filet`.

## Installing

After building, install the binary and desktop entry with:

```
bun run install:app
```

This copies the binary to `~/.local/bin/filet` and adds a desktop entry at `~/.local/share/application/filet` for application launcher. Add `~/.local/bin` to your your `PATH` to run `filet` directly from a terminal.

### From a release

You can also skip building and download the latest release from the [Releases](../../releases) page on GitHub. Extract the archive and run the included install script:

```
./install.sh
```

This installs filet the same way as `bun run install:app`.

## Roadmap

- [x] Allow manually editing the current path.
- [ ] Add a name resolver to allow filesystem functions for files/folders with the same names.
- [ ] Simple search function for the current directory.
- [x] Ability to open files marked as executables instead of previewing them.
- [x] Hide the sidebar when the viewport reaches a small enough size.
- [x] Improve the grid view option for visual clarity.
- [x] Add default display type as a configurable value.
- [ ] Option to restore a file from trash.
