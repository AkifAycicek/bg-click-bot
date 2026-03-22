<template>
    <div class="max-w-2xl mx-auto p-6 flex flex-col gap-5">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-bold">Background Clicker Bot</h1>
            <Button
                icon="pi pi-cog"
                severity="secondary"
                text
                rounded
                @click="showSettings = true"
                v-tooltip.left="'Ayarlar'"
            />
        </div>

        <Drawer v-model:visible="showSettings" header="Ayarlar" position="right" :style="{ width: '400px' }">
            <div class="flex flex-col gap-5">
                <div class="flex items-center justify-between">
                    <span class="text-sm font-medium">Karanlik Mod</span>
                    <ToggleSwitch v-model="isDark" @change="toggleDark" />
                </div>

                <Divider />

                <div>
                    <h3 class="text-sm font-semibold mb-3">Profiller</h3>
                    <PresetManager
                        :currentState="currentPresetState"
                        :hasState="points.length > 0"
                        @load-preset="onLoadPreset"
                        @auto-save-changed="onAutoSaveChanged"
                        @preset-saved="onPresetSaved"
                    />
                </div>
            </div>
        </Drawer>

        <Card>
            <template #title><span class="text-sm">Hedef ve Noktalar</span></template>
            <template #content>
                <div class="flex flex-col gap-4">
                    <WindowSelector
                        :disabled="isRunning"
                        :targetTitle="targetTitle"
                        @update:selectedWindow="onWindowSelected"
                    />
                    <AddPointForm
                        :selectedHwnd="selectedWindow?.hwnd"
                        :disabled="isRunning"
                        @add-point="addPoint"
                    />
                </div>
            </template>
        </Card>

        <Card>
            <template #title><span class="text-sm">Tiklama Noktalari</span></template>
            <template #content>
                <ClickPointsTable
                    :points="points"
                    :clickCounts="clickCounts"
                    :isRunning="isRunning"
                    :capturing="recapturing"
                    @remove-point="removePoint"
                    @update-point="updatePoint"
                    @recapture-point="recapturePoint"
                />
            </template>
        </Card>

        <Card>
            <template #title><span class="text-sm">Kontrol</span></template>
            <template #content>
                <StatusPanel
                    :isRunning="isRunning"
                    :canStart="canStart"
                    :totalClicks="totalClicks"
                    @start="startBot"
                    @stop="stopBot"
                />
            </template>
        </Card>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Drawer from 'primevue/drawer';
import Divider from 'primevue/divider';
import ToggleSwitch from 'primevue/toggleswitch';
import PresetManager from './components/PresetManager.vue';
import WindowSelector from './components/WindowSelector.vue';
import AddPointForm from './components/AddPointForm.vue';
import ClickPointsTable from './components/ClickPointsTable.vue';
import StatusPanel from './components/StatusPanel.vue';
import { usePresets } from './composables/usePresets';

const { selectedPresetId, autoSave, savePreset, refreshList, loadPreset } = usePresets();

const showSettings = ref(false);

// Dark mode
const isDark = ref(false);

async function toggleDark() {
    document.documentElement.classList.toggle('dark-mode', isDark.value);
    await persistSettings();
}

async function initDarkMode(settings) {
    if (settings.darkMode !== undefined) {
        isDark.value = settings.darkMode;
    } else {
        isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    document.documentElement.classList.toggle('dark-mode', isDark.value);
}

// App state
const selectedWindow = ref(null);
const targetTitle = ref('');
const points = ref([]);
const isRunning = ref(false);
const clickCounts = ref([]);
const totalClicks = ref(0);
const recapturing = ref(false);

const canStart = computed(() =>
    selectedWindow.value && points.value.length > 0 && !isRunning.value
);

const currentPresetState = computed(() => ({
    windowTitle: selectedWindow.value?.title || '',
    points: points.value.map(p => ({ x: p.x, y: p.y, interval: p.interval }))
}));

// Preset handlers
function onLoadPreset(preset) {
    points.value = preset.points || [];
    targetTitle.value = preset.windowTitle || '';
}

async function onPresetSaved() {
    await persistSettings();
}

async function onAutoSaveChanged() {
    await persistSettings();
}

// Auto-save: debounced
let autoSaveTimer = null;
function triggerAutoSave() {
    if (!autoSave.value || !selectedPresetId.value) return;
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
        savePreset(currentPresetState.value);
    }, 500);
}

watch([points, selectedWindow], triggerAutoSave, { deep: true });

// Window selection
function onWindowSelected(win) {
    selectedWindow.value = win;
    targetTitle.value = '';
}

// Point management
function addPoint(point) {
    points.value.push(point);
    triggerAutoSave();
}

function removePoint(index) {
    points.value.splice(index, 1);
    triggerAutoSave();
}

async function updatePoint({ index, field, value }) {
    points.value[index] = { ...points.value[index], [field]: value };
    triggerAutoSave();
    if (isRunning.value) {
        await window.electronAPI.updatePoints(
            selectedWindow.value.hwnd,
            points.value.map(p => ({ x: p.x, y: p.y, interval: p.interval }))
        );
    }
}

async function recapturePoint(index) {
    if (!selectedWindow.value) return;
    recapturing.value = true;
    try {
        const pos = await window.electronAPI.capturePosition(selectedWindow.value.hwnd);
        points.value[index] = { ...points.value[index], x: pos.x, y: pos.y };
        triggerAutoSave();
    } finally {
        recapturing.value = false;
    }
}

// Bot control
function onClickCountUpdate(data) {
    clickCounts.value = data.counts;
    totalClicks.value = data.total;
}

async function startBot() {
    if (!canStart.value) return;
    clickCounts.value = new Array(points.value.length).fill(0);
    totalClicks.value = 0;

    await window.electronAPI.startClicking(
        selectedWindow.value.hwnd,
        points.value.map(p => ({ x: p.x, y: p.y, interval: p.interval }))
    );

    isRunning.value = true;
}

async function stopBot() {
    await window.electronAPI.stopClicking();
    isRunning.value = false;
}

// Settings persistence
async function persistSettings() {
    await window.electronAPI.saveSettings({
        darkMode: isDark.value,
        autoSave: autoSave.value,
        lastPresetId: selectedPresetId.value
    });
}

// Startup
onMounted(async () => {
    const settings = await window.electronAPI.loadSettings();
    await initDarkMode(settings);
    autoSave.value = settings.autoSave || false;

    window.electronAPI.onClickCountUpdate(onClickCountUpdate);

    // Load last used preset
    if (settings.lastPresetId) {
        await refreshList();
        const preset = await loadPreset(settings.lastPresetId);
        if (preset) onLoadPreset(preset);
    }
});

onUnmounted(() => {
    window.electronAPI.removeClickCountListener();
});
</script>
