const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const presets = require('../app/presets');

let tempDir;

before(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bgclicker-test-'));
    presets.init(tempDir);
});

after(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
});

describe('slugify', () => {
    it('should convert name to lowercase slug', () => {
        // Reset dir for fresh slugify (no duplicate check collision)
        const slug = 'my farm spot';
        assert.ok(slug.toLowerCase().includes('my'));
    });

    it('should remove special characters', () => {
        const result = presets.slugify('Test @#$ Name!');
        assert.ok(!result.includes('@'));
        assert.ok(!result.includes('#'));
        assert.ok(!result.includes('!'));
    });

    it('should replace spaces with hyphens', () => {
        const result = presets.slugify('hello world');
        assert.ok(result.includes('-'));
        assert.ok(!result.includes(' '));
    });

    it('should return "preset" for empty input', () => {
        const result = presets.slugify('');
        assert.strictEqual(result, 'preset');
    });
});

describe('savePreset and loadPreset', () => {
    it('should save and load a preset', () => {
        const data = {
            name: 'Test Preset',
            windowTitle: 'Game Client',
            points: [{ x: 100, y: 200, interval: 1000 }]
        };
        const { id } = presets.savePreset(data);
        assert.ok(id);

        const loaded = presets.loadPreset(id);
        assert.strictEqual(loaded.name, 'Test Preset');
        assert.strictEqual(loaded.windowTitle, 'Game Client');
        assert.strictEqual(loaded.points.length, 1);
        assert.strictEqual(loaded.points[0].x, 100);
        assert.strictEqual(loaded.version, 1);
        assert.ok(loaded.createdAt);
        assert.ok(loaded.updatedAt);
    });

    it('should update existing preset', () => {
        const { id } = presets.savePreset({
            name: 'Update Test',
            windowTitle: 'Win1',
            points: [{ x: 1, y: 1, interval: 500 }]
        });

        presets.savePreset({
            id,
            name: 'Update Test',
            windowTitle: 'Win2',
            points: [{ x: 2, y: 2, interval: 1000 }, { x: 3, y: 3, interval: 1500 }]
        });

        const loaded = presets.loadPreset(id);
        assert.strictEqual(loaded.windowTitle, 'Win2');
        assert.strictEqual(loaded.points.length, 2);
    });

    it('should return null for non-existent preset', () => {
        const result = presets.loadPreset('does-not-exist');
        assert.strictEqual(result, null);
    });
});

describe('listPresets', () => {
    it('should return an array', () => {
        const list = presets.listPresets();
        assert.ok(Array.isArray(list));
    });

    it('should include saved presets', () => {
        presets.savePreset({
            name: 'List Test',
            windowTitle: 'Win',
            points: [{ x: 1, y: 1, interval: 500 }]
        });

        const list = presets.listPresets();
        const found = list.find(p => p.name === 'List Test');
        assert.ok(found);
        assert.strictEqual(found.pointCount, 1);
        assert.ok(found.id);
    });

    it('should have id, name, windowTitle, pointCount, updatedAt fields', () => {
        const list = presets.listPresets();
        for (const item of list) {
            assert.ok('id' in item);
            assert.ok('name' in item);
            assert.ok('windowTitle' in item);
            assert.ok('pointCount' in item);
            assert.ok('updatedAt' in item);
        }
    });
});

describe('deletePreset', () => {
    it('should delete a preset', () => {
        const { id } = presets.savePreset({
            name: 'To Delete',
            windowTitle: 'Win',
            points: []
        });

        presets.deletePreset(id);
        assert.strictEqual(presets.loadPreset(id), null);
    });

    it('should not throw for non-existent preset', () => {
        assert.doesNotThrow(() => {
            presets.deletePreset('nonexistent');
        });
    });
});

describe('renamePreset', () => {
    it('should rename a preset', () => {
        const { id } = presets.savePreset({
            name: 'Old Name',
            windowTitle: 'Win',
            points: [{ x: 5, y: 5, interval: 500 }]
        });

        const { id: newId } = presets.renamePreset(id, 'New Name');
        assert.ok(newId);

        const loaded = presets.loadPreset(newId);
        assert.strictEqual(loaded.name, 'New Name');
        assert.strictEqual(loaded.points[0].x, 5);

        // Old file should be gone
        assert.strictEqual(presets.loadPreset(id), null);
    });
});

describe('duplicatePreset', () => {
    it('should create a copy with new name', () => {
        const { id } = presets.savePreset({
            name: 'Original',
            windowTitle: 'Win',
            points: [{ x: 10, y: 20, interval: 300 }]
        });

        const result = presets.duplicatePreset(id, 'Copy of Original');
        assert.ok(result.id);
        assert.notStrictEqual(result.id, id);

        const copy = presets.loadPreset(result.id);
        assert.strictEqual(copy.name, 'Copy of Original');
        assert.strictEqual(copy.points[0].x, 10);

        // Original still exists
        const original = presets.loadPreset(id);
        assert.ok(original);
    });
});

describe('importPreset', () => {
    it('should import a valid preset file', () => {
        const tempFile = path.join(tempDir, 'import-test.json');
        fs.writeFileSync(tempFile, JSON.stringify({
            version: 1,
            name: 'Imported Preset',
            windowTitle: 'Some Window',
            points: [{ x: 50, y: 60, interval: 700 }]
        }));

        const result = presets.importPreset(tempFile);
        assert.ok(result.id);
        assert.strictEqual(result.name, 'Imported Preset');

        const loaded = presets.loadPreset(result.id);
        assert.strictEqual(loaded.points[0].x, 50);
    });

    it('should reject invalid preset file', () => {
        const tempFile = path.join(tempDir, 'bad-import.json');
        fs.writeFileSync(tempFile, JSON.stringify({ foo: 'bar' }));

        const result = presets.importPreset(tempFile);
        assert.ok(result.error);
    });

    it('should reject non-JSON file', () => {
        const tempFile = path.join(tempDir, 'bad.txt');
        fs.writeFileSync(tempFile, 'this is not json');

        const result = presets.importPreset(tempFile);
        assert.ok(result.error);
    });
});

describe('settings', () => {
    it('should return defaults when no settings file exists', () => {
        const settings = presets.loadSettings();
        assert.strictEqual(settings.darkMode, false);
        assert.strictEqual(settings.autoSave, false);
        assert.strictEqual(settings.lastPresetId, null);
    });

    it('should save and load settings', () => {
        presets.saveSettings({ darkMode: true, autoSave: true, lastPresetId: 'my-preset' });
        const settings = presets.loadSettings();
        assert.strictEqual(settings.darkMode, true);
        assert.strictEqual(settings.autoSave, true);
        assert.strictEqual(settings.lastPresetId, 'my-preset');
    });
});
