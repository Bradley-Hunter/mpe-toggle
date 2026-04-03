# MPE Toggle Extension — Overview

> **Working title:** MPE Toggle
> **Status:** Ready for implementation — small utility project.

---

## Elevator Pitch

A minimal VS Code extension that adds a single button to the editor title bar for globally enabling/disabling the Markdown Preview Enhanced extension. Solves the specific annoyance where MPE's preview follows the active editor — when AI edits files across a project, the preview keeps switching away from the document you're actually reading.

---

## Problem

Markdown Preview Enhanced ties its preview to the active markdown editor. When Claude Code (or any automated tool) edits multiple files, the preview constantly switches to whatever file was just touched, pulling you away from the document you opened it on. There's no "pin preview to this file" option.

The workaround is manually disabling/re-enabling MPE through the Extensions sidebar, which is slow and disruptive. A one-click toggle in the editor title bar makes this fast enough to be practical.

---

## Scope

This is a **tiny utility extension** — not a portfolio piece, not a learning vehicle. Build it, use it, move on.

- Single button in the editor title bar
- Globally disables/enables `shd101wyy.markdown-preview-enhanced`
- Shows a notification prompting the user to reload the window (required for extension state changes to take effect)
- Icon/tooltip reflects current state (enabled vs disabled)
- No settings, no configuration, no sidebar views

---

## Tech Stack

- **TypeScript** — VS Code extensions are TypeScript/JavaScript
- **VS Code Extension API** — `vscode.commands.executeCommand` for extension management
- **vsce** — Packaging tool for VS Code extensions

---

## Decisions Made

| Decision | Choice | Why |
|----------|--------|-----|
| Button placement | Editor title bar (top-right of editor) | Natural location for per-editor actions, always visible, minimal UI footprint |
| Disable scope | Global (not workspace) | The annoyance isn't workspace-specific — MPE should be fully off or fully on |
| Reload behavior | Notification with reload button (not auto-reload) | Auto-reload could interrupt in-progress AI edits or lose terminal state |
| Extension detection | Check if MPE is installed at activation | Graceful handling if MPE isn't installed — show a warning, don't crash |
