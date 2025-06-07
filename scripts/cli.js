#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getBinaryName() {
    const platform = os.platform();
    if (platform === 'win32') {
        return 'astraops-cli-windows.exe';
    }
    if (platform === 'darwin') {
        return 'astraops-cli-macos';
    }
    if (platform === 'linux') {
        return 'astraops-cli-linux';
    }
    throw new Error(`Unsupported platform: ${platform}`);
}

function run() {
    try {
        const binaryName = getBinaryName();
        const binaryPath = path.join(__dirname, '..', 'bin', binaryName);
        
        const child = spawn(binaryPath, process.argv.slice(2), {
            stdio: 'inherit',
        });

        child.on('exit', (code) => {
            process.exit(code === null ? 1 : code);
        });
    } catch (e) {
        const message = e instanceof Error ? e.message : 'An unknown error occurred.';
        console.error(message);
        process.exit(1);
    }
}

run(); 