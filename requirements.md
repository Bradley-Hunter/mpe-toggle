# MPE Toggle — Requirements for Implementation

> **Purpose:** This document is a complete brief for a Claude Code session to implement this VS Code extension from scratch.

---

## What This Extension Does

A VS Code extension that adds a **single toggle button** to the **editor title bar** (top-right area of the editor, next to split/preview icons). The button globally enables or disables the **Markdown Preview Enhanced** extension (`shd101wyy.markdown-preview-enhanced`).

### Why It Exists

MPE's preview panel follows the active editor. When automated tools (like Claude Code) edit multiple markdown files, the preview constantly switches away from the document the user is reading. There's no way to pin the preview. The practical solution is a fast toggle to disable MPE when it's not needed.

---

## Functional Requirements

### FR-1: Toggle Button in Editor Title Bar

- Add a button to the editor title bar (`editor/title` contribution point)
- The button must be visible when **any file** is open (not just markdown files — the user may want to toggle MPE while viewing other file types during an editing session)
- Clicking the button toggles MPE between enabled and disabled states globally

### FR-2: Global Enable/Disable

- Use the VS Code extensions API to disable/enable MPE globally (not per-workspace)
- The relevant commands:
  - `workbench.extensions.disableExtension` with extension ID `shd101wyy.markdown-preview-enhanced`
  - `workbench.extensions.enableExtension` with extension ID `shd101wyy.markdown-preview-enhanced`
- These are internal VS Code commands — verify they work in the current VS Code API version and find alternatives if they don't

### FR-3: State-Aware Icon and Tooltip

- The button icon and tooltip must reflect the current state of MPE:
  - **MPE enabled:** Icon suggests "on" / active state. Tooltip: "Disable Markdown Preview Enhanced"
  - **MPE disabled:** Icon suggests "off" / inactive state. Tooltip: "Enable Markdown Preview Enhanced"
- Use built-in VS Code codicon icons (e.g., `eye` / `eye-closed`, or `preview` / `preview-off` — pick the clearest option from available codicons)
- State must be correct on startup (check MPE's current state when the extension activates)

### FR-4: Reload Notification

- After toggling, show an information notification: "Markdown Preview Enhanced has been [enabled/disabled]. Reload the window to apply."
- The notification must include a **"Reload Now"** button that triggers `workbench.action.reloadWindow`
- Do **not** auto-reload — the user may have unsaved work or in-progress terminal sessions

### FR-5: MPE Not Installed Handling

- On activation, check if MPE is installed
- If MPE is not installed, the toggle button should still appear but show a warning notification when clicked: "Markdown Preview Enhanced is not installed."
- Do not crash or throw unhandled errors

---

## Non-Functional Requirements

### NFR-1: Minimal Footprint

- No settings, no configuration UI, no sidebar views, no webviews
- No dependencies beyond the VS Code API
- The extension should activate on startup (`*` activation event) so the button is always available

### NFR-2: Extension Metadata

- **Display name:** MPE Toggle
- **Description:** "Toggle Markdown Preview Enhanced on/off from the editor title bar"
- **Publisher:** Set up under Bradley's VS Code publisher account (will need to create one if it doesn't exist — see setup guide)
- **License:** MIT
- **Repository:** Link to the GitHub repo once created
- **Icon:** Not required for initial version — can add later

---

## File Structure

Expected output structure for the extension project:

```
mpe-toggle/
├── .vscode/
│   └── launch.json          ← Debug/run configuration for extension development
├── src/
│   └── extension.ts         ← All extension logic (single file is fine for this scope)
├── package.json             ← Extension manifest (commands, menus, activation, icons)
├── tsconfig.json            ← TypeScript config
├── .vscodeignore            ← Files to exclude from packaged extension
├── README.md                ← Basic usage instructions
├── LICENSE                  ← MIT license
└── CLAUDE.md                ← Instructions for future Claude Code sessions working on this extension
```

---

## Implementation Notes

- The `package.json` `contributes.menus` section is where the editor title bar button is registered using the `editor/title` menu group
- Use `when` clauses if needed to control button visibility, but for this extension it should always be visible
- The extension should register a single command (e.g., `mpe-toggle.toggle`) that the button invokes
- Use `vscode.extensions.getExtension('shd101wyy.markdown-preview-enhanced')` to check if MPE is installed and its current state
- For icon toggling based on state, use the `command` approach with conditional icons in `package.json` or update the icon programmatically via context keys

---

## Testing

- Manual testing is fine for this scope
- Test matrix:
  - [ ] Toggle from enabled → disabled → reload → verify MPE is off
  - [ ] Toggle from disabled → enabled → reload → verify MPE is on
  - [ ] Button icon/tooltip updates after toggle (before reload)
  - [ ] Extension activates correctly when MPE is not installed
  - [ ] Notification appears with working "Reload Now" button
