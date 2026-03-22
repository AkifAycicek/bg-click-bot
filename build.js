const fs = require('fs');
const path = require('path');
const DIST = path.join(__dirname, 'dist');
const TRIPLET = 'win32_x64';

// Clean and create dist
if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });
fs.mkdirSync(DIST, { recursive: true });

// 1. Copy node.exe
const nodePath = process.execPath;
const nodeDest = path.join(DIST, 'node.exe');
console.log(`Copying node.exe from ${nodePath}...`);
fs.copyFileSync(nodePath, nodeDest);

// 2. Copy bot.js
fs.copyFileSync(path.join(__dirname, 'bot.js'), path.join(DIST, 'bot.js'));
console.log('Copied bot.js');

// 3. Copy koffi module (only win32_x64)
const koffiSrc = path.join(__dirname, 'node_modules', 'koffi');
const koffiDest = path.join(DIST, 'node_modules', 'koffi');

// Copy index.js and package.json
fs.mkdirSync(koffiDest, { recursive: true });
fs.copyFileSync(path.join(koffiSrc, 'index.js'), path.join(koffiDest, 'index.js'));
fs.copyFileSync(path.join(koffiSrc, 'package.json'), path.join(koffiDest, 'package.json'));

// Copy only the win32_x64 native module
const nativeSrcDir = path.join(koffiSrc, 'build', 'koffi', TRIPLET);
const nativeDestDir = path.join(koffiDest, 'build', 'koffi', TRIPLET);
fs.mkdirSync(nativeDestDir, { recursive: true });
fs.copyFileSync(
    path.join(nativeSrcDir, 'koffi.node'),
    path.join(nativeDestDir, 'koffi.node')
);
console.log('Copied koffi native module (win32_x64)');

// 4. Create launcher bat
const batContent = `@echo off\r\n"%~dp0node.exe" "%~dp0bot.js"\r\npause\r\n`;
fs.writeFileSync(path.join(DIST, 'sro_bot.bat'), batContent);
console.log('Created sro_bot.bat');

// Summary
console.log('\n=== Build tamamlandi! ===\n');
console.log('dist/ klasoru icerigi:\n');

function listDir(dir, indent = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            console.log(`${indent}${entry.name}/`);
            listDir(fullPath, indent + '  ');
        } else {
            const size = fs.statSync(fullPath).size;
            const sizeMB = (size / 1024 / 1024).toFixed(1);
            console.log(`${indent}${entry.name} (${sizeMB} MB)`);
        }
    }
}
listDir(DIST);

console.log('\nKullanim: dist/sro_bot.bat dosyasini cift tiklayin.');
