const fs = require('fs');
const path = require('path');

let presetsDir = null;
let settingsPath = null;

function init(userDataPath) {
    presetsDir = path.join(userDataPath, 'presets');
    settingsPath = path.join(userDataPath, 'settings.json');
    ensurePresetsDir();
}

function ensurePresetsDir() {
    if (!fs.existsSync(presetsDir)) {
        fs.mkdirSync(presetsDir, { recursive: true });
    }
}

function slugify(name) {
    let slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    if (!slug) slug = 'preset';

    // Handle duplicates
    let finalSlug = slug;
    let counter = 2;
    while (fs.existsSync(path.join(presetsDir, `${finalSlug}.json`))) {
        finalSlug = `${slug}-${counter}`;
        counter++;
    }
    return finalSlug;
}

function listPresets() {
    ensurePresetsDir();
    const files = fs.readdirSync(presetsDir).filter(f => f.endsWith('.json'));
    return files.map(f => {
        try {
            const data = JSON.parse(fs.readFileSync(path.join(presetsDir, f), 'utf8'));
            return {
                id: path.basename(f, '.json'),
                name: data.name || path.basename(f, '.json'),
                windowTitle: data.windowTitle || '',
                pointCount: (data.points || []).length,
                updatedAt: data.updatedAt || null
            };
        } catch {
            return null;
        }
    }).filter(Boolean);
}

function loadPreset(id) {
    const filePath = path.join(presetsDir, `${id}.json`);
    if (!fs.existsSync(filePath)) return null;
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
        return null;
    }
}

function savePreset(preset) {
    ensurePresetsDir();
    let id = preset.id;

    if (!id) {
        id = slugify(preset.name || 'preset');
    }

    const filePath = path.join(presetsDir, `${id}.json`);
    const existing = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : {};

    const data = {
        version: 1,
        name: preset.name || existing.name || id,
        windowTitle: preset.windowTitle || '',
        points: preset.points || [],
        createdAt: existing.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return { id };
}

function deletePreset(id) {
    const filePath = path.join(presetsDir, `${id}.json`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
    return { success: true };
}

function renamePreset(id, newName) {
    const oldPath = path.join(presetsDir, `${id}.json`);
    if (!fs.existsSync(oldPath)) return { id };

    const data = JSON.parse(fs.readFileSync(oldPath, 'utf8'));
    data.name = newName;
    data.updatedAt = new Date().toISOString();

    const newId = slugify(newName);
    const newPath = path.join(presetsDir, `${newId}.json`);

    fs.writeFileSync(newPath, JSON.stringify(data, null, 2), 'utf8');
    if (oldPath !== newPath) {
        fs.unlinkSync(oldPath);
    }
    return { id: newId };
}

function duplicatePreset(id, newName) {
    const data = loadPreset(id);
    if (!data) return null;

    data.name = newName;
    data.createdAt = new Date().toISOString();
    data.updatedAt = new Date().toISOString();

    const newId = slugify(newName);
    fs.writeFileSync(
        path.join(presetsDir, `${newId}.json`),
        JSON.stringify(data, null, 2),
        'utf8'
    );
    return { id: newId };
}

function importPreset(filePath) {
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(raw);

        // Validate minimum structure
        if (!data.name || !Array.isArray(data.points)) {
            return { error: 'Gecersiz preset dosyasi' };
        }

        const id = slugify(data.name);
        data.updatedAt = new Date().toISOString();

        fs.writeFileSync(
            path.join(presetsDir, `${id}.json`),
            JSON.stringify(data, null, 2),
            'utf8'
        );
        return { id, name: data.name };
    } catch {
        return { error: 'Dosya okunamadi veya gecersiz JSON' };
    }
}

function getExportPath(id) {
    return path.join(presetsDir, `${id}.json`);
}

function loadSettings() {
    if (!settingsPath || !fs.existsSync(settingsPath)) {
        return { darkMode: false, autoSave: false, lastPresetId: null };
    }
    try {
        return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch {
        return { darkMode: false, autoSave: false, lastPresetId: null };
    }
}

function saveSettings(settings) {
    if (!settingsPath) return;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
}

module.exports = {
    init,
    ensurePresetsDir,
    slugify,
    listPresets,
    loadPreset,
    savePreset,
    deletePreset,
    renamePreset,
    duplicatePreset,
    importPreset,
    getExportPath,
    loadSettings,
    saveSettings
};
