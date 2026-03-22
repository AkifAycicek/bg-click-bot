import { ref } from 'vue';

const presetList = ref([]);
const autoSave = ref(false);

export function usePresets() {
    async function refreshList() {
        presetList.value = await window.electronAPI.listPresets();
    }

    async function loadPreset(id) {
        const full = await window.electronAPI.loadPreset(id);
        if (full) return { ...full, id };
        return null;
    }

    async function savePresetById(id, name, state) {
        return await window.electronAPI.savePreset({ id, name, ...state });
    }

    async function createPreset(name, state) {
        const result = await window.electronAPI.savePreset({ name, ...state });
        await refreshList();
        return result;
    }

    async function deletePresetById(id) {
        await window.electronAPI.deletePreset(id);
        await refreshList();
    }

    async function renamePresetById(id, newName) {
        const result = await window.electronAPI.renamePreset(id, newName);
        await refreshList();
        return result;
    }

    async function duplicatePresetById(id, newName) {
        const result = await window.electronAPI.duplicatePreset(id, newName);
        await refreshList();
        return result;
    }

    async function importPreset() {
        const result = await window.electronAPI.importPreset();
        if (result && !result.error) {
            await refreshList();
        }
        return result;
    }

    async function exportPresetById(id) {
        await window.electronAPI.exportPreset(id);
    }

    return {
        presetList,
        autoSave,
        refreshList,
        loadPreset,
        savePresetById,
        createPreset,
        deletePresetById,
        renamePresetById,
        duplicatePresetById,
        importPreset,
        exportPresetById
    };
}
