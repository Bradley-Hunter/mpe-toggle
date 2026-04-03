# MPE Toggle

Toggle Markdown Preview Enhanced on/off from the editor title bar.

## Usage

Click the eye icon in the editor title bar to disable/enable MPE. The window will automatically reload to apply the change.

## How It Works

VS Code does not provide a public API to disable/enable extensions. MPE Toggle works by swapping MPE's extension files with inert stubs (empty `package.json` and no-op JS) and clearing VS Code's extension cache. The window automatically reloads to apply the change.

## Known Issue

VS Code may briefly show an **"Extensions have been modified on disk"** notification when toggling. This is cosmetic — the reload handles it.

## Why

MPE's preview panel follows the active editor. When automated tools (like Claude Code) edit multiple markdown files, the preview constantly switches away from the document you're reading. There's no way to pin the preview. This extension provides a fast one-click toggle to disable MPE when it's not needed.
