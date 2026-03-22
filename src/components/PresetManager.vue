<template>
    <div class="flex flex-col gap-3">
        <div class="flex items-end gap-2">
            <div class="flex-1">
                <Select
                    v-model="selectedForAction"
                    :options="presetList"
                    optionLabel="name"
                    dataKey="id"
                    placeholder="Profil secin..."
                    class="w-full"
                    filter
                    autoFilterFocus
                    filterPlaceholder="Profil ara..."
                />
            </div>
            <Button
                icon="pi pi-external-link"
                severity="primary"
                size="small"
                @click="openInTab"
                :disabled="!selectedForAction"
                v-tooltip.top="'Sekmede ac'"
            />
        </div>

        <div class="flex items-center gap-2 flex-wrap">
            <Button
                icon="pi pi-plus"
                label="Yeni"
                severity="secondary"
                size="small"
                outlined
                @click="showNewDialog = true"
            />
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
                :disabled="!selectedForAction"
            />
            <Button
                icon="pi pi-copy"
                severity="secondary"
                size="small"
                text
                @click="showDuplicateDialog = true"
                :disabled="!selectedForAction"
                v-tooltip.top="'Kopyala'"
            />
            <Button
                icon="pi pi-file-edit"
                severity="secondary"
                size="small"
                text
                @click="showRenameDialog = true"
                :disabled="!selectedForAction"
                v-tooltip.top="'Yeniden adlandir'"
            />
            <Button
                icon="pi pi-trash"
                severity="danger"
                size="small"
                text
                @click="onDelete"
                :disabled="!selectedForAction"
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
                    <Button label="Olustur ve Ac" size="small" @click="onCreate" :disabled="!newName.trim()" />
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
import { useConfirm } from 'primevue/useconfirm';
import { usePresets } from '../composables/usePresets';

const confirm = useConfirm();
const emit = defineEmits(['open-in-tab', 'auto-save-changed']);

const {
    presetList, autoSave,
    refreshList, createPreset,
    deletePresetById, renamePresetById, duplicatePresetById,
    importPreset, exportPresetById
} = usePresets();

const selectedForAction = ref(null);
const showNewDialog = ref(false);
const showRenameDialog = ref(false);
const showDuplicateDialog = ref(false);
const newName = ref('');
const renameName = ref('');
const duplicateName = ref('');

function openInTab() {
    if (!selectedForAction.value) return;
    emit('open-in-tab', { presetId: selectedForAction.value.id, presetName: selectedForAction.value.name });
}

async function onCreate() {
    if (!newName.value.trim()) return;
    const result = await createPreset(newName.value.trim(), { windowTitle: '', points: [] });
    showNewDialog.value = false;
    const name = newName.value.trim();
    newName.value = '';
    emit('open-in-tab', { presetId: result.id, presetName: name });
}

function onDelete() {
    if (!selectedForAction.value) return;
    confirm.require({
        message: `"${selectedForAction.value.name}" profili silinecek. Emin misiniz?`,
        header: 'Profil Sil',
        icon: 'pi pi-trash',
        acceptLabel: 'Sil',
        rejectLabel: 'Iptal',
        accept: async () => {
            await deletePresetById(selectedForAction.value.id);
            selectedForAction.value = null;
        }
    });
}

async function onRename() {
    if (!selectedForAction.value || !renameName.value.trim()) return;
    const { id } = await renamePresetById(selectedForAction.value.id, renameName.value.trim());
    showRenameDialog.value = false;
    renameName.value = '';
    selectedForAction.value = presetList.value.find(p => p.id === id) || null;
}

async function onDuplicate() {
    if (!selectedForAction.value || !duplicateName.value.trim()) return;
    const { id } = await duplicatePresetById(selectedForAction.value.id, duplicateName.value.trim());
    showDuplicateDialog.value = false;
    duplicateName.value = '';
    selectedForAction.value = presetList.value.find(p => p.id === id) || null;
}

async function onImport() {
    await importPreset();
}

async function onExport() {
    if (!selectedForAction.value) return;
    await exportPresetById(selectedForAction.value.id);
}

refreshList();
</script>
