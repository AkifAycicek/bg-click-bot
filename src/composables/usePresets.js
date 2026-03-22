import { ref, computed } from 'vue';

const presetList = ref([]);
const selectedPreset = ref(null);
const autoSave = ref(false);

export function usePresets() {
    async function refreshList() {
        presetList.value = await window.electronAPI.listPresets();
    }

    async function loadPreset(id) {
        const full = await window.electronAPI.loadPreset(id);
        if (full) {
            selectedPreset.value = { ...full, id };
            return { ...full, id };
        }
        return null;
    }

    async function savePreset(state) {
        if (!selectedPreset.value) return null;
        const result = await window.electronAPI.savePreset({
            id: selectedPreset.value.id,
            name: selectedPreset.value.name,
            ...state
        });
        return result;
    }

    async function createPreset(name, state) {
        const result = await window.electronAPI.savePreset({ name, ...state });
        await refreshList();
        const found = presetList.value.find(p => p.id === result.id);
        if (found) selectedPreset.value = { ...found };
        return result;
    }

    async function deletePreset() {
        if (!selectedPreset.value) return;
        await window.electronAPI.deletePreset(selectedPreset.value.id);
        selectedPreset.value = null;
        await refreshList();
    }

    async function renamePreset(newName) {
        if (!selectedPreset.value) return null;
        const { id } = await window.electronAPI.renamePreset(selectedPreset.value.id, newName);
        await refreshList();
        const found = presetList.value.find(p => p.id === id);
        if (found) selectedPreset.value = { ...found };
        return { id };
    }

    async function duplicatePreset(newName) {
        if (!selectedPreset.value) return null;
        const { id } = await window.electronAPI.duplicatePreset(selectedPreset.value.id, newName);
        await refreshList();
        const found = presetList.value.find(p => p.id === id);
        if (found) selectedPreset.value = { ...found };
        return { id };
    }

    async function importPreset() {
        const result = await window.electronAPI.importPreset();
        if (result && !result.error) {
            await refreshList();
            const found = presetList.value.find(p => p.id === result.id);
            if (found) selectedPreset.value = { ...found };
        }
        return result;
    }

    async function exportPreset() {
        if (!selectedPreset.value) return;
        await window.electronAPI.exportPreset(selectedPreset.value.id);
    }

    function selectById(id) {
        const found = presetList.value.find(p => p.id === id);
        if (found) selectedPreset.value = { ...found };
    }

    const selectedPresetId = computed(() => selectedPreset.value?.id || null);
    const selectedPresetName = computed(() => selectedPreset.value?.name || '');

    return {
        presetList,
        selectedPreset,
        selectedPresetId,
        selectedPresetName,
        autoSave,
        refreshList,
        loadPreset,
        savePreset,
        createPreset,
        deletePreset,
        renamePreset,
        duplicatePreset,
        importPreset,
        exportPreset,
        selectById
    };
}
