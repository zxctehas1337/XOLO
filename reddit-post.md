Заголовок:
**Check Out My "Axion" Browser**

Description:

Hi friends! I'd like to show you my pet project — **Axion**, a lightweight web browser built with **Rust + Tauri 2.0 + React 18**. I was heavily inspired by Zen Browser and created this primarily for myself, so it's not perfect, but I thought you might be interested in taking a look!

## What's Inside (Current Features)

**Core Browsing:**
- Built on native **WebView2** engine (Chromium-based, Windows only for now)
- **Workspace management** — organize your tabs into separate workspaces for different projects or contexts
- **Tab freezing** — suspend inactive tabs to save memory
- **Session restore** — automatically saves and restores your tabs on restart

**UI & Customization:**
- **Zen-style vertical sidebar** with customizable width and position (left/right)
- **Multiple themes** — light, dark, and custom color schemes
- **Customizable start page** with quick access sites and background images
- **Compact/expanded sidebar modes** — show only icons or full tab titles

**Privacy & Data:**
- **Built-in ad blocker** (basic implementation)
- **Browser data import** — migrate bookmarks, history from Chrome, Firefox, Edge, Brave, Opera
- **Local-first storage** — all your data stays on your machine (SQLite + JSON)

**Productivity:**
- **Download manager** with pause/resume support
- **Browsing history** with search
- **Bookmarks** with folder organization
- **Keyboard shortcuts** for power users
- **Per-tab zoom control**
- **Multi-language support** (i18n ready)

## Coming Soon (Roadmap)

- **Extensions support** — working on basic extension API
- **Sync across devices** — optional cloud sync for bookmarks and settings
- **macOS and Linux builds** — currently Windows-only, but cross-platform is planned
- **Split view** — view two tabs side by side
- **Picture-in-Picture** for videos
- **Better ad blocking** — integrating proper filter lists
- **Tab groups** with colors and labels
- **Reader mode** for distraction-free reading
- **Performance improvements** — memory optimization and faster startup

## Tech Stack

- **Frontend:** React 18 + TypeScript 5 + Vite 5
- **Backend:** Rust (Edition 2021) + Tauri 2.0
- **Rendering:** Native WebView2 (Chromium)
- **Storage:** SQLite + JSON files

## Why Another Browser?

I wanted a browser that:
1. Feels native and lightweight (no Electron bloat)
2. Has a clean, Zen-like vertical tab interface
3. Respects privacy without cloud dependencies
4. Is hackable and open source

**WARNING: THIS IS A BETA VERSION**

Expect bugs! This is a passion project and I'm actively developing it. Your feedback and bug reports are incredibly valuable.

**GitHub:** https://github.com/zxctehas1337/XOLO

I'd love to hear your thoughts, suggestions, and criticism. What features would you like to see? What's missing? Let me know!