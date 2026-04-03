# MPE Toggle — Approaches Tried

## The Core Problem

VS Code has **no public API** to programmatically disable/enable extensions. The command `workbench.extensions.disableExtension` referenced in many docs/blogs does not exist as a registered command in current VS Code versions (tested in VS Code 1.110+).

---

## Approaches Attempted

### 1. `workbench.extensions.disableExtension` command
- **What:** `vscode.commands.executeCommand('workbench.extensions.disableExtension', MPE_ID)`
- **Result:** `Error: command 'workbench.extensions.disableExtension' not found`
- **Tested in:** Extension Development Host AND installed extension
- **Why it failed:** The command simply doesn't exist in VS Code's extension host API. It was proposed in [GitHub Issue #201672](https://github.com/microsoft/vscode/issues/201672) (Jan 2024) but never implemented as a public command.

### 2. VS Code CLI `--disable-extension` flag
- **What:** Shell out to `code.cmd --disable-extension shd101wyy.markdown-preview-enhanced`
- **Result:** Opens a **new VS Code window** with MPE disabled for that session only
- **Why it failed:** `--disable-extension` is a **launch flag**, not a persistent management command. It only applies to the launched session and does not persist.

### 3. VS Code CLI via `process.execPath` + `cli.js`
- **What:** Replicated what `code.cmd` does internally: `Code.exe cli.js --disable-extension <id>` with `ELECTRON_RUN_AS_NODE=1`
- **Result:** Same as #2 — opened a new window
- **Why it failed:** Same underlying issue — `--disable-extension` is a launch flag regardless of how it's invoked.

### 4. Stub MPE's main JS file
- **What:** Back up MPE's `out/native/extension.js`, replace it with a no-op stub (`module.exports = { activate() {}, deactivate() {} }`)
- **Result:** MPE's code stopped running, but:
  - "Extensions have been modified on disk. Please reload the window." popup appeared
  - MPE's preview buttons still showed in the toolbar (because `package.json` contributions were untouched)
- **Why it failed:** VS Code's file watcher detects changes to extension files on disk and shows a warning notification. Also, UI contributions come from `package.json`, not the JS code.

### 5. Stub MPE's main JS + strip `package.json` contributions
- **What:** In addition to stubbing the JS, also replaced MPE's `package.json` with a minimal version (kept name/version/engines/main, removed all `contributes`)
- **Result:** 
  - "Extensions have been modified on disk" popup still appeared
  - MPE buttons did disappear after reload
  - But the popup appeared on every toggle (both disable and enable)
- **Why it failed:** Same file watcher issue — any modification to files in an extension directory triggers the notification.

### 6. Rename MPE's `package.json`
- **What:** Rename `package.json` to `package.json.disabled`
- **Result:** VS Code marked MPE as an **invalid extension** (corrupt extension icon in sidebar)
- **Why it failed:** VS Code expects every extension directory to have a valid `package.json`. Removing it makes the extension show as corrupt/invalid.

### 7. `.obsolete` file in extensions directory
- **What:** Add MPE's folder name to `~/.vscode/extensions/.obsolete` (a JSON file VS Code uses internally to mark old extension versions for cleanup)
- **Result:** After reload, MPE's toolbar buttons were **still visible** — the extension appeared to still be loaded
- **Why it failed:** `.obsolete` may only take effect on a full VS Code restart (not window reload), or may only be used for extension update cleanup rather than arbitrary extension disabling. Needs further investigation.

### 8. Rename MPE's entire extension directory
- **What:** Rename `shd101wyy.markdown-preview-enhanced-0.8.22` to `shd101wyy.markdown-preview-enhanced-0.8.22.mpe-disabled`
- **Result:** 
  - "Extensions have been modified on disk" popup appeared on disable
  - MPE showed as an **invalid extension** on disable
  - Enable (renaming back) worked without issues
- **Why it failed:** VS Code's extension manager tracks loaded extensions. When a loaded extension's directory disappears, VS Code detects the change and marks it invalid before the reload can take effect.

### 9. Tab suppression (close + intercept MPE preview tabs)
- **What:** Close all MPE preview webview tabs, then watch `tabGroups.onDidChangeTabs` to immediately close any new MPE preview tabs that open
- **Result:** MPE previews were effectively blocked, no file modifications needed, instant effect
- **Why it failed:** Too aggressive — blocked ALL previews including ones the user intentionally opened via the toolbar button. User could no longer use MPE preview at all without keyboard shortcuts. MPE's toolbar buttons also remained visible (confusing: button present but non-functional).

### 10. CLI `--uninstall-extension` + local backup
- **What:** Copy MPE's extension directory to `~/.mpe-toggle-backup/`, then run `code.cmd --uninstall-extension shd101wyy.markdown-preview-enhanced` via CLI. For re-enable, copy backup back to extensions directory.
- **Result:** Uninstall worked (no warnings), but:
  - Re-enable by copying backup back didn't work (VS Code didn't recognize the restored extension)
  - The overall process was slow (copying large extension directory + CLI round-trip)
- **Why it failed:** VS Code doesn't automatically pick up extension directories that are manually copied into the extensions folder — they need to be registered through VS Code's extension management system.

---

## Approaches Not Yet Tried

### A. CLI uninstall + marketplace reinstall
- Uninstall via `code.cmd --uninstall-extension` (works cleanly)
- Reinstall via `code.cmd --install-extension shd101wyy.markdown-preview-enhanced` (from marketplace)
- **Trade-off:** Slow (network round-trip for reinstall), requires internet for re-enable

### B. Close preview tab only (no full disable)
- Just close the MPE preview tab when user clicks "disable"
- Since `automaticallyShowPreviewOfMarkdownBeingEdited` defaults to `false`, MPE won't auto-open a new preview
- **Trade-off:** MPE is still fully installed and its toolbar buttons remain visible. User can accidentally reopen preview.

### C. `.obsolete` with full VS Code restart
- Same as approach #7 but test with a full quit + relaunch instead of window reload
- **Trade-off:** Slower UX (full restart vs reload), but might actually work

### D. Smarter tab suppression
- Only suppress previews triggered by `onDidChangeActiveTextEditor` (auto-follow), not user-initiated ones
- **Trade-off:** Complex to distinguish auto-follow from intentional opens; MPE buttons still visible

### E. Setting-based approach
- Toggle MPE settings like `liveUpdate`, `scrollSync`, or `previewMode` to reduce annoyance without fully disabling
- **Trade-off:** Doesn't fully disable MPE, just reduces its intrusiveness
