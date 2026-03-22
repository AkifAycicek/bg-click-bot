<template>
    <div class="flex flex-col gap-3">
        <div class="flex items-end gap-2">
            <div class="flex-1">
                <Select
                    v-model="selectedPreset"
                    :options="presetList"
                    optionLabel="name"
                    dataKey="id"
                    placeholder="Profil secin..."
                    class="w-full"
                    filter
                    autoFilterFocus
                    filterPlaceholder="Profil ara..."
                    @change="onSelectChange"
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
                <ToggleSwitch v-model="autoSave" size="small" @change="$emit('auto-save-changed', autoSave)" />
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
import { ref } from 'vue';
import Select from 'primevue/select';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import ToggleSwitch from 'primevue/toggleswitch';
import { usePresets } from '../composables/usePresets';

const props = defineProps({
    currentState: Object,
    hasState: Boolean
});

const emit = defineEmits(['load-preset', 'auto-save-changed', 'preset-saved']);

const {
    presetList, selectedPreset, autoSave,
    refreshList, loadPreset, savePreset, createPreset,
    deletePreset, renamePreset, duplicatePreset,
    importPreset, exportPreset
} = usePresets();

const showNewDialog = ref(false);
const showRenameDialog = ref(false);
const showDuplicateDialog = ref(false);
const newName = ref('');
const renameName = ref('');
const duplicateName = ref('');

async function onSelectChange(event) {
    const preset = event.value;
    if (!preset) return;
    const full = await loadPreset(preset.id);
    if (full) emit('load-preset', full);
}

async function onSave() {
    if (!props.currentState) return;
    if (selectedPreset.value) {
        await savePreset(props.currentState);
        emit('preset-saved', selectedPreset.value.id);
    } else {
        showNewDialog.value = true;
    }
    await refreshList();
}

async function onCreate() {
    if (!newName.value.trim()) return;
    const result = await createPreset(newName.value.trim(), props.currentState);
    showNewDialog.value = false;
    newName.value = '';
    emit('preset-saved', result.id);
}

async function onDelete() {
    await deletePreset();
}

async function onRename() {
    if (!renameName.value.trim()) return;
    await renamePreset(renameName.value.trim());
    showRenameDialog.value = false;
    renameName.value = '';
}

async function onDuplicate() {
    if (!duplicateName.value.trim()) return;
    await duplicatePreset(duplicateName.value.trim());
    showDuplicateDialog.value = false;
    duplicateName.value = '';
}

async function onImport() {
    await importPreset();
}

async function onExport() {
    await exportPreset();
}

// Ensure list is fresh when component mounts
refreshList();
</script>
