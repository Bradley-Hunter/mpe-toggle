import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const MPE_ID = 'shd101wyy.markdown-preview-enhanced';
const BACKUP_SUFFIX = '.mpe-toggle-backup';
const STUB_MARKER = '// mpe-toggle-stub';
const STUB_CONTENT = `${STUB_MARKER}\n"use strict";\nmodule.exports = { activate() {}, deactivate() {} };\n`;

function getExtensionsDir(): string {
	const home = process.env.HOME || process.env.USERPROFILE || '';
	return path.join(home, '.vscode', 'extensions');
}

function getExtensionsJsonPath(): string {
	return path.join(getExtensionsDir(), 'extensions.json');
}

async function setContext(enabled: boolean) {
	await vscode.commands.executeCommand('setContext', 'mpe-toggle.mpeEnabled', enabled);
}

function getExtensionPath(context: vscode.ExtensionContext): string | undefined {
	const ext = vscode.extensions.getExtension(MPE_ID);
	if (ext) {
		return ext.extensionPath;
	}
	return context.globalState.get<string>('mpeExtensionPath');
}

function getMainPath(extPath: string): string {
	const pkgPath = path.join(extPath, 'package.json');
	const backupPkgPath = pkgPath + BACKUP_SUFFIX;
	const source = fs.existsSync(backupPkgPath) ? backupPkgPath : pkgPath;
	try {
		const pkg = JSON.parse(fs.readFileSync(source, 'utf-8'));
		return path.join(extPath, pkg.main || 'extension.js');
	} catch {
		return path.join(extPath, 'extension.js');
	}
}

function backupAndReplace(filePath: string, content: string) {
	const backupPath = filePath + BACKUP_SUFFIX;
	if (fs.existsSync(filePath) && !fs.existsSync(backupPath)) {
		fs.copyFileSync(filePath, backupPath);
	}
	fs.writeFileSync(filePath, content, 'utf-8');
}

function restore(filePath: string) {
	const backupPath = filePath + BACKUP_SUFFIX;
	if (fs.existsSync(backupPath)) {
		fs.copyFileSync(backupPath, filePath);
		fs.unlinkSync(backupPath);
	}
}

function createStubPackageJson(originalPkgPath: string): string {
	const source = fs.existsSync(originalPkgPath + BACKUP_SUFFIX)
		? originalPkgPath + BACKUP_SUFFIX
		: originalPkgPath;
	const pkg = JSON.parse(fs.readFileSync(source, 'utf-8'));
	const stub = {
		name: pkg.name,
		displayName: pkg.displayName,
		description: pkg.description,
		version: pkg.version,
		publisher: pkg.publisher,
		engines: pkg.engines,
		main: pkg.main
	};
	return JSON.stringify(stub, null, '\t');
}

/**
 * Remove or restore MPE's entry in extensions.json.
 * VS Code uses this file as a cache on reload — if MPE is listed here,
 * VS Code loads the cached manifest instead of re-reading package.json.
 */
function removeMpeFromExtensionsJson(): object | undefined {
	const ejPath = getExtensionsJsonPath();
	try {
		const entries = JSON.parse(fs.readFileSync(ejPath, 'utf-8'));
		const idx = entries.findIndex((e: any) =>
			e.identifier?.id === MPE_ID
		);
		if (idx === -1) { return undefined; }
		const removed = entries.splice(idx, 1)[0];
		fs.writeFileSync(ejPath, JSON.stringify(entries), 'utf-8');
		return removed;
	} catch {
		return undefined;
	}
}

function addMpeToExtensionsJson(entry: object) {
	const ejPath = getExtensionsJsonPath();
	try {
		const entries = JSON.parse(fs.readFileSync(ejPath, 'utf-8'));
		// Don't add duplicate
		const exists = entries.some((e: any) => e.identifier?.id === MPE_ID);
		if (!exists) {
			entries.push(entry);
			fs.writeFileSync(ejPath, JSON.stringify(entries), 'utf-8');
		}
	} catch { /* ignore */ }
}

async function toggleMpe(context: vscode.ExtensionContext, enable: boolean) {
	const extPath = getExtensionPath(context);
	if (!extPath) {
		vscode.window.showWarningMessage('Markdown Preview Enhanced is not installed.');
		return;
	}

	const mainPath = getMainPath(extPath);
	const pkgPath = path.join(extPath, 'package.json');

	try {
		if (enable) {
			restore(mainPath);
			restore(pkgPath);
			// Restore extensions.json entry so VS Code picks it up on reload
			const savedEntry = context.globalState.get<object>('mpeExtensionsJsonEntry');
			if (savedEntry) {
				addMpeToExtensionsJson(savedEntry);
			}
		} else {
			const stubPkg = createStubPackageJson(pkgPath);
			backupAndReplace(pkgPath, stubPkg);
			backupAndReplace(mainPath, STUB_CONTENT);
			// Remove from extensions.json cache so VS Code re-reads package.json on reload
			const removed = removeMpeFromExtensionsJson();
			if (removed) {
				await context.globalState.update('mpeExtensionsJsonEntry', removed);
			}
		}

		await context.globalState.update('mpeEnabled', enable);
		await setContext(enable);
		await vscode.commands.executeCommand('workbench.action.reloadWindow');
	} catch (err) {
		vscode.window.showErrorMessage(`Failed to toggle MPE: ${err}`);
	}
}

export async function activate(context: vscode.ExtensionContext) {
	const ext = vscode.extensions.getExtension(MPE_ID);

	if (ext) {
		await context.globalState.update('mpeExtensionPath', ext.extensionPath);
	}

	const extPath = getExtensionPath(context);
	let mpeEnabled: boolean;

	if (extPath) {
		const mainPath = getMainPath(extPath);
		mpeEnabled = !fs.existsSync(mainPath + BACKUP_SUFFIX);
	} else {
		mpeEnabled = false;
	}

	await context.globalState.update('mpeEnabled', mpeEnabled);
	await setContext(mpeEnabled);

	context.subscriptions.push(
		vscode.commands.registerCommand('mpe-toggle.disable', () => toggleMpe(context, false)),
		vscode.commands.registerCommand('mpe-toggle.enable', () => toggleMpe(context, true))
	);
}

export function deactivate() {}
