<template>
    <div class="flex flex-col gap-3">
        <div class="flex items-end gap-2">
            <div class="flex-1">
                <Select
                    v-model="selectedPreset"
                    :options="presetList"
                    optionLabel="name"
                    placeholder="Profil secin..."
                    class="w-full"
                    filter
                    autoFilterFocus
                    filterPlaceholder="Profil ara..."
                />
            </div>
            <Button
                icon="pi pi-save"
                severity="success"
                size="small"
                @click="onSave"
                v-tooltip.top="'Kaydet'"
                :disabled="!selectedPreset && !hasState"
            />
            <Button
                icon="pi pi-plus"
                severity="primary"
                size="small"
                @click="showNewDialog = true"
                v-tooltip.top="'Yeni profil'"
            />
        </div>

        <div class="flex items-center gap-2 flex-wrap">
            <Button
                icon="pi pi-upload"
                label="Import"
                severity="secondary"
                size="small"
                outlined
                @click="onImport"
            />
            <Button
                icon="pi pi-download"
                label="Export"
                severity="secondary"
                size="small"
                outlined
                @click="onExport"
                :disabled="!selectedPreset"
            />
            <Button
                icon="pi pi-copy"
                severity="secondary"
                size="small"
                text
                @click="showDuplicateDialog = true"
                :disabled="!selectedPreset"
                v-tooltip.top="'Kopyala'"
            />
            <Button
                icon="pi pi-file-edit"
                severity="secondary"
                size="small"
                text
                @click="showRenameDialog = true"
                :disabled="!selectedPreset"
                v-tooltip.top="'Yeniden adlandir'"
            />
            <Button
                icon="pi pi-trash"
                severity="danger"
                size="small"
                text
                @click="onDelete"
                :disabled="!selectedPreset"
                v-tooltip.top="'Sil'"
            />

            <div class="ml-auto flex items-center gap-2">
                <label class="text-xs">Oto-kaydet</label>
                <ToggleSwitch v-model="autoSaveLocal" size="small" @change="$emit('auto-save-changed', autoSaveLocal)" />
            </div>
        </div>

        <!-- New preset dialog -->
        <Dialog v-model:visible="showNewDialog" header="Yeni Profil" modal :style="{ width: '350px' }">
            <div class="flex flex-col gap-3 pt-2">
                <InputText v-model="newName" placeholder="Profil adi..." class="w-full" @keyup.enter="onCreate" />
                <div class="flex justify-end gap-2">
                    <Button label="Iptal" severity="secondary" size="small" @click="showNewDialog = false" />
                    <Button label="Olustur" size="small" @click="onCreate" :disabled="!newName.trim()" />
                </div>
            </div>
        </Dialog>

        <!-- Rename dialog -->
        <Dialog v-model:visible="showRenameDialog" header="Yeniden Adlandir" modal :style="{ width: '350px' }">
            <div class="flex flex-col gap-3 pt-2">
                <InputText v-model="renameName" placeholder="Yeni ad..." class="w-full" @keyup.enter="onRename" />
                <div class="flex justify-end gap-2">
                    <Button label="Iptal" severity="secondary" size="small" @click="showRenameDialog = false" />
                    <Button label="Kaydet" size="small" @click="onRename" :disabled="!renameName.trim()" />
                </div>
            </div>
        </Dialog>

        <!-- Duplicate dialog -->
        <Dialog v-model:visible="showDuplicateDialog" header="Profili Kopyala" modal :style="{ width: '350px' }">
            <div class="flex flex-col gap-3 pt-2">
                <InputText v-model="duplicateName" placeholder="Kopya adi..." class="w-full" @keyup.enter="onDuplicate" />
                <div class="flex justify-end gap-2">
                    <Button label="Iptal" severity="secondary" size="small" @click="showDuplicateDialog = false" />
                    <Button label="Kopyala" size="small" @click="onDuplicate" :disabled="!duplicateName.trim()" />
                </div>
            </div>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import Select from 'primevue/select';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import ToggleSwitch from 'primevue/toggleswitch';

const props = defineProps({
    currentState: Object,
    hasState: Boolean,
    autoSave: Boolean
});

const emit = defineEmits(['load-preset', 'auto-save-changed', 'preset-saved']);

const presetList = ref([]);
const selectedPreset = ref(null);
const autoSaveLocal = ref(false);

const showNewDialog = ref(false);
const showRenameDialog = ref(false);
const showDuplicateDialog = ref(false);
const newName = ref('');
const renameName = ref('');
const duplicateName = ref('');

async function refreshList() {
    presetList.value = await window.electronAPI.listPresets();
}

watch(() => props.autoSave, (val) => {
    autoSaveLocal.value = val;
}, { immediate: true });

watch(selectedPreset, async (preset) => {
    if (!preset) return;
    const full = await window.electronAPI.loadPreset(preset.id);
    if (full) {
        emit('load-preset', { ...full, id: preset.id });
    }
});

async function onSave() {
    if (!props.currentState) return;

    if (selectedPreset.value) {
        const result = await window.electronAPI.savePreset({
            id: selectedPreset.value.id,
            name: selectedPreset.value.name,
            ...props.currentState
        });
        emit('preset-saved', result.id);
    } else {
        showNewDialog.value = true;
    }
    await refreshList();
}

async function onCreate() {
    if (!newName.value.trim()) return;
    const result = await window.electronAPI.savePreset({
        name: newName.value.trim(),
        ...props.currentState
    });
    showNewDialog.value = false;
    newName.value = '';
    await refreshList();
    selectedPreset.value = presetList.value.find(p => p.id === result.id) || null;
    emit('preset-saved', result.id);
}

async function onDelete() {
    if (!selectedPreset.value) return;
    await window.electronAPI.deletePreset(selectedPreset.value.id);
    selectedPreset.value = null;
    await refreshList();
}

async function onRename() {
    if (!selectedPreset.value || !renameName.value.trim()) return;
    const { id } = await window.electronAPI.renamePreset(selectedPreset.value.id, renameName.value.trim());
    showRenameDialog.value = false;
    renameName.value = '';
    await refreshList();
    selectedPreset.value = presetList.value.find(p => p.id === id) || null;
}

async function onDuplicate() {
    if (!selectedPreset.value || !duplicateName.value.trim()) return;
    const { id } = await window.electronAPI.duplicatePreset(selectedPreset.value.id, duplicateName.value.trim());
    showDuplicateDialog.value = false;
    duplicateName.value = '';
    await refreshList();
    selectedPreset.value = presetList.value.find(p => p.id === id) || null;
}

async function onImport() {
    const result = await window.electronAPI.importPreset();
    if (result && !result.error) {
        await refreshList();
        selectedPreset.value = presetList.value.find(p => p.id === result.id) || null;
    }
}

async function onExport() {
    if (!selectedPreset.value) return;
    await window.electronAPI.exportPreset(selectedPreset.value.id);
}

// Public method for auto-save from parent
async function autoSavePreset(state) {
    if (!selectedPreset.value) return;
    await window.electronAPI.savePreset({
        id: selectedPreset.value.id,
        name: selectedPreset.value.name,
        ...state
    });
}

function getSelectedPresetId() {
    return selectedPreset.value?.id || null;
}

function selectPresetById(id) {
    const found = presetList.value.find(p => p.id === id);
    if (found) selectedPreset.value = found;
}

defineExpose({ refreshList, autoSavePreset, getSelectedPresetId, selectPresetById });

onMounted(refreshList);
</script>
