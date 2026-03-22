<template>
    <div class="flex flex-col gap-4 pt-3">
        <Card>
            <template #title><span class="text-sm">Hedef ve Noktalar</span></template>
            <template #content>
                <div class="flex flex-col gap-4">
                    <WindowSelector
                        :disabled="instance.isRunning.value"
                        :targetTitle="instance.targetTitle.value"
                        @update:selectedWindow="instance.onWindowSelected($event)"
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
                            @start="instance.startBot()"
                            @stop="instance.stopBot()"
                        />
                    </div>
                    <div class="flex flex-col justify-center gap-2">
                        <label class="text-xs text-surface-500">Kisayol:</label>
                        <InputText
                            :modelValue="hotkeyDisplay"
                            placeholder="Tus kombinasyonu"
                            class="flex-1 min-w-32"
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
                            text
                            size="small"
                            @click="clearHotkey"
                            v-tooltip.top="'Kisayolu kaldir'"
                        />
                    </div>
                </div>
            </template>
        </Card>
    </div>
</template>

<script setup>
import Button from 'primevue/button';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
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
</script>
