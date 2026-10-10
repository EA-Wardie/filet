
# filet

Terminal file manager with first party mouse support, built with `@opentui/core` and `nanostores` on Bun. Linux only. The README documents every feature, key and config option.

## Commands

- `bun run dev` runs the app with watch mode.
- `bun run build` compiles a single binary to `dist/filet` and copies `install.sh` and the icon beside it.
- `bun run format` runs Biome. Run `bunx tsc --noEmit` and `bunx biome check src/` before finishing a change. There are no tests.

## Architecture

- `src/main.ts` creates the renderer via `makeApp` and lays out `Sidebar | ExplorerHeader, VirtualExplorer, ExplorerFooter | PreviewSidebar`.
- `lib/context.ts` exports the renderer as `ctx`, which every component imports.
- `lib/store.ts` holds all shared state as nanostores atoms: `$currentPath`, `$dirents`, `$selectedDirent`, `$markedNames`, `$copyDirents`, `$cutDirents`, history, `$menuOpen`, `$dialogOpen`, `$refresh` and `$notice` for footer messages. Components subscribe to atoms directly.
- Components are classes with a static `make()` returning an OpenTUI renderable, built imperatively. `DirentList` instead extends `core.Renderable` and draws only the visible rows in `renderSelf`, so large directories stay fast. `VirtualExplorer` reads, sorts and filters entries and feeds `$dirents`.
- `lib/shortcuts.ts` has one `SHORTCUTS` table of keys, aliases and actions. Context menus call `SHORTCUTS.x.run()` and `shortcutLabel()`, so new actions belong in this table. Shortcuts are ignored while a dialog, menu or input is focused.
- `lib/navigation.ts` handles history, `readFolder` (resolves symlinked folders), opening files and terminals. After a navigation or `refresh(name)`, a module-level `selectName` tells the explorer which entry to select.
- File operations in `lib/filesystem.ts`, `lib/trash.ts` and `lib/archive.ts` run inside `runTask` from `lib/tasks.ts`, which logs errors and refreshes the folder afterwards. The trash uses the freedesktop layout of `files/` and `info/*.trashinfo`.
- `lib/config.ts` loads `~/.config/filet/config.toml` with top level await and derives the whole theme from a few base colours.
- `lib/log.ts` writes errors as JSONL, one file per day. Use `logError` and set `$notice` for user facing failures.

## Conventions

- Explicit type annotations on variables, parameters and return types, including callbacks.
- Tabs and double quotes, as enforced by Biome. `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` are on.
- When behaviour changes, update the README and `CHANGELOG.md`. Version lives in `package.json`.
- Work happens on `dev` and is merged into `main` by PR.

## Bun

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.mdx`.

## Skills

- When reviewing, simplifying or writing TypeScript in `src/`, load the `typescript-expert` skill, and `typescript-advanced-types` for type-level work.
- When working with `@opentui/core`, such as components in `src/components/`, rendering, layout, input, colours or the renderer in `src/lib/context.ts`, load the `opentui` skill.
- This includes `/code-review` and `/simplify`. Tell any subagents they start to load these skills too.
