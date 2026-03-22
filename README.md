# Background Clicker Bot

A Windows desktop application for sending automated background clicks to any window — even when it's not in focus. Built with Electron, Vue 3, PrimeVue, and Tailwind CSS.

## Features

- **Background clicking** — sends clicks via Windows PostMessage API, works while alt-tabbed
- **Multi-tab presets** — run multiple click configurations simultaneously in separate tabs
- **Window thumbnails** — visual window picker with live previews using PrintWindow API
- **Per-point pause/resume** — individually pause any click point while others continue
- **Coordinate capture** — click on the target window to capture coordinates, or enter manually
- **Named click points** — label each point for easy identification
- **Inline editing** — edit X, Y, interval directly in the table
- **Global hotkeys** — assign system-wide keyboard shortcuts to start/stop each tab
- **Preset system** — save, load, import/export, rename, duplicate configurations
- **Auto-save** — optionally save changes automatically
- **Dark mode** — system preference detection with manual toggle
- **Window focus** — reliably brings target window to foreground using AutoHotkey-style technique

## System Requirements

- Windows 10/11 (x64)
- No additional software needed — Node.js and Electron are bundled

## Development

### Setup

```bash
npm install
```

### Run in development mode

```bash
npm run dev
```

### Run tests

```bash
npm test          # Bot unit tests (28 tests)
npm run test:ui   # Vue component tests (39 tests)
npm run test:e2e  # Electron E2E tests (21 tests)
npm run test:all  # All tests
```

### Build for distribution

```bash
npm run build
```

This creates a `dist/` folder with:
- `clicker.bat` — GUI launcher (Electron app)
- `clicker_cli.bat` — CLI launcher (terminal mode)

## Tech Stack

- **Electron 28** — desktop framework
- **Vue 3** — UI framework (Composition API)
- **PrimeVue 4** — UI components (Aura theme)
- **Tailwind CSS 4** — utility-first styling
- **Vite** — build tool
- **koffi** — Windows API FFI (user32.dll, gdi32.dll, dwmapi.dll)
- **Playwright** — E2E testing
- **Vitest** — unit testing

## Project Structure

```
bot.js                  # Core bot logic (Windows API functions)
app/main.js             # Electron main process (IPC handlers)
app/preload.js          # Context bridge (secure API)
app/presets.js           # Preset file manager
src/App.vue             # Root Vue component
src/composables/        # State management (useBotInstance, useTabManager, usePresets)
src/components/         # UI components
tests/                  # Unit, UI, and E2E tests
build.js                # Distribution build script
```

## License

MIT
