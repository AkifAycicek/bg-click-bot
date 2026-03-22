const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIST = path.join(__dirname, 'dist');
const TRIPLET = 'win32_x64';

// Clean and create dist
if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });
fs.mkdirSync(DIST, { recursive: true });

// 1. Build Vue renderer
console.log('Building Vue renderer...');
execSync('npx vite build', { cwd: __dirname, stdio: 'inherit' });
console.log('Vue renderer built.\n');

// 2. Copy Electron binary
const electronPath = path.join(__dirname, 'node_modules', 'electron', 'dist');
const electronExe = path.join(electronPath, 'electron.exe');
if (fs.existsSync(electronExe)) {
    console.log('Copying Electron...');
    copyDirSync(electronPath, path.join(DIST, 'electron'));
    console.log('Copied Electron runtime.');
} else {
    console.log('WARNING: electron.exe not found, skipping Electron copy.');
}

// 3. Copy app files
const filesToCopy = ['bot.js', 'package.json'];
filesToCopy.forEach(f => {
    fs.copyFileSync(path.join(__dirname, f), path.join(DIST, f));
    console.log(`Copied ${f}`);
});

// Copy app/ directory (main.js, preload.js)
copyDirSync(path.join(__dirname, 'app'), path.join(DIST, 'app'));
console.log('Copied app/ (Electron main + preload)');

// Copy dist-renderer/ into dist
copyDirSync(path.join(__dirname, 'dist-renderer'), path.join(DIST, 'dist-renderer'));
console.log('Copied dist-renderer/ (Vue build)');

// 4. Copy koffi module (only win32_x64)
const koffiSrc = path.join(__dirname, 'node_modules', 'koffi');
const koffiDest = path.join(DIST, 'node_modules', 'koffi');
fs.mkdirSync(koffiDest, { recursive: true });
fs.copyFileSync(path.join(koffiSrc, 'index.js'), path.join(koffiDest, 'index.js'));
fs.copyFileSync(path.join(koffiSrc, 'package.json'), path.join(koffiDest, 'package.json'));

const nativeSrcDir = path.join(koffiSrc, 'build', 'koffi', TRIPLET);
const nativeDestDir = path.join(koffiDest, 'build', 'koffi', TRIPLET);
fs.mkdirSync(nativeDestDir, { recursive: true });
fs.copyFileSync(
    path.join(nativeSrcDir, 'koffi.node'),
    path.join(nativeDestDir, 'koffi.node')
);
console.log('Copied koffi native module (win32_x64)');

// 5. Copy node.exe for CLI mode
const nodePath = process.execPath;
fs.copyFileSync(nodePath, path.join(DIST, 'node.exe'));
console.log('Copied node.exe for CLI');

// 6. Create launchers
// CLI launcher (node.exe + bot.js, no Electron)
const cliBat = `@echo off\r\nset "APP_DIR=%~dp0."\r\n"%APP_DIR%\\node.exe" "%APP_DIR%\\bot.js"\r\npause\r\n`;
// GUI launcher (Electron app)
const guiBat = `@echo off\r\nset "APP_DIR=%~dp0."\r\nstart "" "%APP_DIR%\\electron\\electron.exe" --no-sandbox "%APP_DIR%"\r\n`;

fs.writeFileSync(path.join(DIST, 'clicker_cli.bat'), cliBat);
fs.writeFileSync(path.join(DIST, 'clicker.bat'), guiBat);
console.log('Created clicker.bat (GUI) and clicker_cli.bat (CLI)');

// Summary
console.log('\n=== Build complete! ===\n');
console.log('dist/ contents:\n');
listDir(DIST);
console.log('\nUsage:');
console.log('  GUI:  dist/clicker.bat');
console.log('  CLI:  dist/clicker_cli.bat');

// --- Utility functions ---

function copyDirSync(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function listDir(dir, indent = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'electron') {
                // Don't list Electron internals
                const size = getDirSize(fullPath);
                console.log(`${indent}${entry.name}/ (${(size / 1024 / 1024).toFixed(1)} MB)`);
            } else {
                console.log(`${indent}${entry.name}/`);
                listDir(fullPath, indent + '  ');
            }
        } else {
            const size = fs.statSync(fullPath).size;
            const sizeMB = (size / 1024 / 1024).toFixed(1);
            console.log(`${indent}${entry.name} (${sizeMB} MB)`);
        }
    }
}

function getDirSize(dir) {
    let total = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            total += getDirSize(fullPath);
        } else {
            total += fs.statSync(fullPath).size;
        }
    }
    return total;
}
