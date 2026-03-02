import * as vscode from 'vscode';
import * as path from 'path';

// @ts-ignore
const soundPlay = require('sound-play');

export function activate(context: vscode.ExtensionContext) {
    console.log('vscode-sounds is active: 7-Way Audio Mode (Tab Hijack enabled)!');

    const playSound = (fileName: string) => {
        const filePath = path.join(context.extensionUri.fsPath, 'sounds', fileName);
        try {
            soundPlay.play(filePath);
        } catch (error) {
            console.error(`Failed to play sound: ${error}`);
        }
    };

    // --- 1. INSTANT INLINE DIAGNOSTICS ---
    let previousErrorCount = 0;
    let previousWarningCount = 0;

    const diagnosticListener = vscode.languages.onDidChangeDiagnostics(() => {
        let currentErrorCount = 0;
        let currentWarningCount = 0;
        
        vscode.languages.getDiagnostics().forEach(([uri, diagnostics]) => {
            diagnostics.forEach(diagnostic => {
                if (diagnostic.severity === vscode.DiagnosticSeverity.Error) {
                    currentErrorCount++;
                } else if (diagnostic.severity === vscode.DiagnosticSeverity.Warning) {
                    currentWarningCount++;
                }
            });
        });

        if (currentErrorCount > previousErrorCount) {
            playSound('error_new.mp3');
        } else if (currentWarningCount > previousWarningCount) {
            playSound('warning.mp3');
        }
        
        previousErrorCount = currentErrorCount;
        previousWarningCount = currentWarningCount;
    });

    // --- 2. TERMINAL SHELL EVENTS ---
    const terminalListener = vscode.window.onDidEndTerminalShellExecution((event) => {
        if (event.exitCode === 0) {
            playSound('success.mp3');
        } else if (event.exitCode !== undefined && event.exitCode > 0) {
            playSound('error.mp3');
        }
    });

    // --- 3. VS CODE TASKS ---
    const taskListener = vscode.tasks.onDidEndTaskProcess((event) => {
        if (event.exitCode === 0) {
            playSound('success.mp3');
        } else if (event.exitCode !== undefined && event.exitCode > 0) {
            playSound('error.mp3');
        }
    });

    // --- 4. LARGE PASTE DETECTION ---
    const pasteListener = vscode.workspace.onDidChangeTextDocument((event) => {
        if (event.contentChanges.length > 0) {
            const change = event.contentChanges[0];
            if (change.text.length > 50) { 
                playSound('paste_large.mp3');
            }
        }
    });

    // --- 5. NEW FILE / START CODING DETECTION ---
    const newFileListener = vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor && editor.document.getText().trim().length === 0) {
            playSound('new_file.mp3');
        }
    });

    // --- 6. INLINE SUGGESTION ACCEPTED (The Tab Hijack) ---
    const suggestionListener = vscode.commands.registerCommand('vscode-sounds.acceptInline', async () => {
        // 1. Play our custom sound
        playSound('suggestion.mp3');
        
        // 2. Tell VS Code to actually insert the suggested text so nothing breaks!
        await vscode.commands.executeCommand('editor.action.inlineSuggest.commit');
    });

    // Register all listeners
    context.subscriptions.push(
        diagnosticListener, 
        terminalListener, 
        taskListener, 
        pasteListener, 
        newFileListener,
        suggestionListener // <-- Added the new command listener here
    );
}

export function deactivate() {}