<template>
    <div class="flex flex-col gap-4 pt-3">
        <Card>
            <template #title><span class="text-sm">Hedef ve Noktalar</span></template>
            <template #content>
                <div class="flex flex-col gap-4">
                    <WindowSelector
                        :disabled="instance.isRunning.value"
                        :targetTitle="instance.targetTitle.value"
                        @update:selectedWindow="onWindowSelected"
                    />
                    <AddPointForm
                        :selectedHwnd="instance.selectedWindow.value?.hwnd"
                        :disabled="instance.isRunning.value"
                        @add-point="onAddPoint"
                    />
                </div>
            </template>
        </Card>

        <Card>
            <template #title><span class="text-sm">Tiklama Noktalari</span></template>
            <template #content>
                <ClickPointsTable
                    :points="instance.points.value"
                    :clickCounts="instance.clickCounts.value"
                    :pausedPoints="instance.pausedPoints.value"
                    :isRunning="instance.isRunning.value"
                    :capturing="instance.recapturing.value"
                    @remove-point="onRemovePoint"
                    @update-point="onUpdatePoint"
                    @recapture-point="onRecapturePoint"
                    @toggle-pause="instance.togglePointPause($event)"
                />
            </template>
        </Card>

        <Card>
            <template #title><span class="text-sm">Kontrol</span></template>
            <template #content>
                <div class="flex flex-wrap gap-3">
                    <div class="flex flex-col justify-center gap-2">
                        <label class="text-xs text-surface-500">Baslat/Durdur:</label>
                        <StatusPanel
                            :isRunning="instance.isRunning.value"
                            :canStart="instance.canStart.value"
                            :totalClicks="instance.totalClicks.value"
                            @start="onStart"
                            @stop="onStop"
                        />
                    </div>
                    <div class="flex flex-col justify-center gap-2">
                        <label class="text-xs text-surface-500">Kisayol:</label>
                        <InputGroup>
                            <InputText
                                :modelValue="hotkeyDisplay"
                                placeholder="Tus kombinasyonu"
                                size="small"
                                readonly
                                @keydown.prevent="onHotkeyCapture"
                                @focus="hotkeyCapturing = true"
                                @blur="hotkeyCapturing = false"
                                :class="{ 'ring-2 ring-primary-300': hotkeyCapturing }"
                            />
                            <Button
                                v-if="hotkeyDisplay"
                                icon="pi pi-times"
                                severity="secondary"
                                size="small"
                                @click="clearHotkey"
                                v-tooltip.top="'Kisayolu kaldir'"
                            />
                        </InputGroup>
                    </div>
                </div>
            </template>
        </Card>

        <div v-if="!instance.isRunning.value && !instance.canStart.value" class="flex flex-col gap-1 px-1">
            <div v-if="!instance.selectedWindow.value" class="flex items-center gap-2 text-xs text-orange-500">
                <i class="pi pi-exclamation-circle" style="font-size: 0.75rem" />
                <span>Hedef pencere secilmedi</span>
            </div>
            <div v-if="instance.points.value.length === 0" class="flex items-center gap-2 text-xs text-orange-500">
                <i class="pi pi-exclamation-circle" style="font-size: 0.75rem" />
                <span>En az bir tiklama noktasi ekleyin</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import Button from 'primevue/button';
import Card from 'primevue/card';
import InputGroup from 'primevue/inputgroup';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';
import { useTabManager } from '../composables/useTabManager';
import AddPointForm from './AddPointForm.vue';
import ClickPointsTable from './ClickPointsTable.vue';
import StatusPanel from './StatusPanel.vue';
import WindowSelector from './WindowSelector.vue';

const props = defineProps({
    instance: Object,
    tabId: String
});

const { autoSaveTab } = useTabManager();
const toast = useToast();

// Hotkey
const hotkeyDisplay = ref('');
const hotkeyCapturing = ref(false);

function keyToAccelerator(e) {
    const parts = [];
    if (e.ctrlKey) parts.push('CommandOrControl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');

    const key = e.key;
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) return null;

    if (key.length === 1) {
        parts.push(key.toUpperCase());
    } else if (key.startsWith('F') && !isNaN(key.slice(1))) {
        parts.push(key);
    } else {
        const map = {
            ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right',
            ' ': 'Space', Enter: 'Return', Backspace: 'Backspace', Delete: 'Delete',
            Escape: 'Escape', Tab: 'Tab', Home: 'Home', End: 'End',
            PageUp: 'PageUp', PageDown: 'PageDown', Insert: 'Insert'
        };
        parts.push(map[key] || key);
    }

    return parts.join('+');
}

async function onHotkeyCapture(e) {
    const accelerator = keyToAccelerator(e);
    if (!accelerator) return;

    const result = await window.electronAPI.registerHotkey(props.tabId, accelerator);
    if (result.success) {
        hotkeyDisplay.value = accelerator;
    }
}

async function clearHotkey() {
    await window.electronAPI.unregisterHotkey(props.tabId);
    hotkeyDisplay.value = '';
}

function triggerAutoSave() {
    autoSaveTab(props.tabId);
}

function onWindowSelected(win) {
    props.instance.onWindowSelected(win);
    triggerAutoSave();
}

function onAddPoint(point) {
    props.instance.addPoint(point);
    triggerAutoSave();
}

function onRemovePoint(index) {
    props.instance.removePoint(index);
    triggerAutoSave();
}

function onUpdatePoint(data) {
    props.instance.updatePoint(data);
    triggerAutoSave();
}

function onRecapturePoint(index) {
    props.instance.recapturePoint(index).then(triggerAutoSave);
}

async function onStart() {
    await props.instance.startBot();
    toast.add({ severity: 'success', summary: 'Bot baslatildi', life: 2000 });
}

async function onStop() {
    await props.instance.stopBot();
    toast.add({ severity: 'warn', summary: 'Bot durduruldu', life: 2000 });
}
</script>
