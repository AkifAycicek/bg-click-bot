<template>
    <Toast position="bottom-right" />
    <ConfirmDialog />
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
                        @open-in-tab="onOpenInTab"
                        @auto-save-changed="onAutoSaveChanged"
                    />
                </div>
            </div>
        </Drawer>

        <BotTabView ref="botTabViewRef" />
    </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import Button from 'primevue/button';
import Drawer from 'primevue/drawer';
import ConfirmDialog from 'primevue/confirmdialog';
import Divider from 'primevue/divider';
import Toast from 'primevue/toast';
import ToggleSwitch from 'primevue/toggleswitch';
import PresetManager from './components/PresetManager.vue';
import BotTabView from './components/BotTabView.vue';
import { useTabManager } from './composables/useTabManager';
import { usePresets } from './composables/usePresets';

const { tabs, activeTabId, openTab, getOpenTabsState, restoreOpenTabs } = useTabManager();
const { autoSave, refreshList } = usePresets();

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

// Preset tab opening
async function onOpenInTab({ presetId, presetName }) {
    await openTab(presetId, presetName);
    showSettings.value = false;
}

async function onAutoSaveChanged() {
    await persistSettings();
}

// Persist tab state on any tab change
let initialized = false;
watch([tabs, activeTabId], () => {
    if (initialized) persistSettings();
}, { deep: true });

// Settings persistence
async function persistSettings() {
    const tabState = getOpenTabsState();
    await window.electronAPI.saveSettings({
        darkMode: isDark.value,
        autoSave: autoSave.value,
        ...tabState
    });
}

// Startup
onMounted(async () => {
    const settings = await window.electronAPI.loadSettings();
    await initDarkMode(settings);
    autoSave.value = settings.autoSave || false;
    await refreshList();

    // Restore open tabs or migrate from lastPresetId
    if (settings.openTabs && settings.openTabs.length > 0) {
        await restoreOpenTabs(settings.openTabs, settings.activeTabId);
    } else if (settings.lastPresetId) {
        await openTab(settings.lastPresetId, 'Preset');
    }

    initialized = true;
});

onUnmounted(() => {
    window.electronAPI.removeClickCountListener();
});
</script>
