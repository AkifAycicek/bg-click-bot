import { ref } from 'vue';
import { useBotInstance } from './useBotInstance';
import { usePresets } from './usePresets';

const tabs = ref([]);
const activeTabId = ref(null);
const botInstances = new Map();

let tabCounter = 0;
let countListenerRegistered = false;

export function useTabManager() {
    const { loadPreset, savePresetById, autoSave } = usePresets();

    function registerCountListener() {
        if (countListenerRegistered) return;
        countListenerRegistered = true;
        window.electronAPI.onClickCountUpdate((data) => {
            const instance = botInstances.get(data.tabId);
            if (instance) instance.handleCountUpdate(data);
        });
    }

    async function openTab(presetId, presetName) {
        // If preset already open, switch to that tab
        if (presetId) {
            const existing = tabs.value.find(t => t.presetId === presetId);
            if (existing) {
                activeTabId.value = existing.id;
                return existing.id;
            }
        }

        const id = `tab-${++tabCounter}`;
        const instance = useBotInstance(id);

        if (presetId) {
            const preset = await loadPreset(presetId);
            if (preset) instance.loadFromPreset(preset);
        }

        botInstances.set(id, instance);
        tabs.value.push({ id, presetId: presetId || null, presetName: presetName || 'Yeni Sekme' });
        activeTabId.value = id;

        registerCountListener();
        return id;
    }

    async function closeTab(tabId) {
        const instance = botInstances.get(tabId);
        if (instance) {
            await instance.dispose();
            botInstances.delete(tabId);
        }

        const idx = tabs.value.findIndex(t => t.id === tabId);
        if (idx !== -1) tabs.value.splice(idx, 1);

        if (activeTabId.value === tabId) {
            if (tabs.value.length > 0) {
                const newIdx = Math.min(idx, tabs.value.length - 1);
                activeTabId.value = tabs.value[newIdx].id;
            } else {
                activeTabId.value = null;
            }
        }
    }

    function getInstance(tabId) {
        return botInstances.get(tabId) || null;
    }

    function getActiveInstance() {
        return activeTabId.value ? botInstances.get(activeTabId.value) : null;
    }

    // Auto-save for a specific tab
    async function autoSaveTab(tabId) {
        if (!autoSave.value) return;
        const tab = tabs.value.find(t => t.id === tabId);
        const instance = botInstances.get(tabId);
        if (!tab?.presetId || !instance) return;
        await savePresetById(tab.presetId, tab.presetName, instance.currentPresetState.value);
    }

    function getOpenTabsState() {
        return {
            openTabs: tabs.value.map(t => ({ id: t.id, presetId: t.presetId, presetName: t.presetName })),
            activeTabId: activeTabId.value
        };
    }

    async function restoreOpenTabs(savedTabs, savedActiveTabId) {
        for (const tab of savedTabs) {
            if (tab.presetId) {
                await openTab(tab.presetId, tab.presetName);
            }
        }
        if (savedActiveTabId && tabs.value.find(t => t.id === savedActiveTabId)) {
            activeTabId.value = savedActiveTabId;
        } else if (tabs.value.length > 0) {
            activeTabId.value = tabs.value[0].id;
        }
    }

    return {
        tabs,
        activeTabId,
        openTab,
        closeTab,
        getInstance,
        getActiveInstance,
        autoSaveTab,
        getOpenTabsState,
        restoreOpenTabs,
        registerCountListener
    };
}
