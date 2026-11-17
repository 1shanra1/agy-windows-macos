# Halcyon OS ("LunaGlass")

A simulated web-based computer frontend fusing **Modern macOS (Sonoma / Sequoia)** Vibrancy glass & precision squircle craft with **Windows XP (Luna / Royale / Bliss)** optimism.

## Implemented Applications & Shell
- **Firmware Boot & Welcome Login** (`src/boot/`): Nostalgic XP capsule progress loader + Apple-style prism splash, two-column Sonoma × XP Welcome screen with customizable user profile & 6 vector stained-glass avatars, and Sleep / Log Off / Restart Power Modal.
- **LunaGlass Desktop Shell** (`src/shell/`):
  - Top 30px Vibrancy `MenuBar` with active per-window app menus, **Control Center** (Time of Day, Wallpaper, Accent Theme, Volume, CRT Scanlines), and live clock.
  - Bottom floating `TaskDock` anchored by XP's emerald-glass `start` pill, cosine-curve dock icon magnification, Two-Column `StartMenuPopover`, and Sky-Cerulean notification tray.
  - `WindowFrame` with curved Luna × Sonoma headers, jewel controls, drag/8-edge resize, and Left/Right/Top edge snapping.
  - `SpotlightRun` (`Cmd+K` / `Ctrl+K`) universal launcher, VFS file search, calculator, and `wiki:` shortcut.
- **WordLeaf Studio & Luna Stickies** (`src/apps/wordleaf/`): Tactile WordPad × Pages/TextEdit markdown & rich-text studio with interactive page ruler, paper/glass modes, and persistent VFS saving (`My Documents` / `Desktop`).
- **SafariExplorer (SafeNet Curated Browser)** (`src/apps/browser/`): Hybrid IE6 × Safari browser wired to live keyless Wikipedia & Wiktionary REST/Action APIs (`origin=*`), internal `/wiki/` link navigation, `halcyon://home|museum|safenet` intranet pages, VFS "Clip to My Documents", and a strict **SafeNet Gatekeeper** that blocks uncurated external domains.
- **System & Creative Apps** (`src/apps/system/`): **My Computer (Navigator)** VFS explorer, **Control Panel** with miniature monitor preview, **Prism Media Player** procedural Web Audio visualizer, **LunaPaint Studio** with 28-swatch XP palette & "Save to My Pictures", and **About This Halcyon Computer**.
- **Core Engines** (`src/core/` & `src/art/`): Persistent `localStorage` Virtual Filesystem (`halcyon_os_vfs_v1`), polyphonic Web Audio sound synthesizer (`soundEngine.ts`), and 100% code-crafted procedural HTML5 Canvas wallpapers & SVG icons (`src/art/`).

## Scripts
```bash
npm install
npm run dev
npm run build
```
