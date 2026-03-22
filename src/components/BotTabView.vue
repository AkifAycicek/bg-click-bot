<template>
    <div v-if="tabs.length === 0" class="text-center text-surface-400 py-12">
        <i class="pi pi-inbox text-4xl mb-3 block" />
        <p class="text-sm">Henuz acik sekme yok.</p>
        <p class="text-xs mt-1">Ayarlardan bir profil acin veya yeni sekme ekleyin.</p>
        <Button
            label="Yeni Sekme"
            icon="pi pi-plus"
            size="small"
            class="mt-4"
            @click="onNewTab"
        />
    </div>

    <Tabs v-else :value="activeTabId" @update:value="activeTabId = $event" scrollable>
        <TabList>
            <Tab v-for="tab in tabs" :key="tab.id" :value="tab.id">
                <span class="inline-flex items-center gap-2">
                    <Button
                        v-if="getInstance(tab.id)?.isRunning.value"
                        icon="pi pi-stop"
                        severity="danger"
                        text
                        rounded
                        size="small"
                        class="p-0 w-5 h-5 flex items-center justify-center self-center"
                        @click.stop="getInstance(tab.id)?.stopBot()"
                        v-tooltip.top="'Durdur'"
                    />
                    <Button
                        v-else-if="getInstance(tab.id)?.canStart.value"
                        icon="pi pi-play"
                        severity="success"
                        text
                        rounded
                        size="small"
                        class="p-0 w-5 h-5 flex items-center justify-center self-center"
                        @click.stop="getInstance(tab.id)?.startBot()"
                        v-tooltip.top="'Baslat'"
                    />
                    <i v-else class="pi pi-circle text-surface-300" style="font-size: 0.5rem" />
                    <span :class="{ 'italic text-surface-400': !tab.presetId }">
                        {{ tab.presetName }}{{ !tab.presetId ? ' *' : '' }}
                    </span>
                    <Button
                        v-if="!tab.presetId"
                        icon="pi pi-save"
                        severity="success"
                        text
                        rounded
                        size="small"
                        class="p-0 w-5 h-5 flex items-center justify-center"
                        @click.stop="onSaveTab(tab.id)"
                        v-tooltip.top="'Profil olarak kaydet'"
                    />
                    <Button
                        icon="pi pi-times"
                        text
                        rounded
                        size="small"
                        class="p-0 w-5 h-5 flex items-center justify-center"
                        @click.stop="onCloseTab(tab.id)"
                    />
                </span>
            </Tab>
            <Button
                icon="pi pi-plus"
                text
                rounded
                size="small"
                @click="onNewTab"
                v-tooltip.top="'Yeni sekme'"
                class="self-center"
            />
        </TabList>
        <TabPanels>
            <TabPanel v-for="tab in tabs" :key="tab.id" :value="tab.id">
                <BotPanel
                    v-if="getInstance(tab.id)"
                    :instance="getInstance(tab.id)"
                    :tabId="tab.id"
                />
            </TabPanel>
        </TabPanels>
    </Tabs>

    <!-- Save unsaved tab dialog -->
    <Dialog v-model:visible="showSaveDialog" header="Profil Olarak Kaydet" modal :style="{ width: '350px' }">
        <div class="flex flex-col gap-3 pt-2">
            <InputText v-model="saveName" placeholder="Profil adi..." class="w-full" @keyup.enter="confirmSave" />
            <div class="flex justify-end gap-2">
                <Button label="Iptal" severity="secondary" size="small" @click="showSaveDialog = false" />
                <Button label="Kaydet" size="small" @click="confirmSave" :disabled="!saveName.trim()" />
            </div>
        </div>
    </Dialog>
</template>

<script setup>
import { ref } from 'vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Tab from 'primevue/tab';
import TabList from 'primevue/tablist';
import TabPanel from 'primevue/tabpanel';
import TabPanels from 'primevue/tabpanels';
import Tabs from 'primevue/tabs';
import { useTabManager } from '../composables/useTabManager';
import { usePresets } from '../composables/usePresets';
import BotPanel from './BotPanel.vue';

const { tabs, activeTabId, openTab, closeTab, getInstance } = useTabManager();
const { createPreset } = usePresets();

const showSaveDialog = ref(false);
const saveName = ref('');
const saveTabId = ref(null);

async function onNewTab() {
    await openTab(null, 'Yeni Sekme');
}

function onSaveTab(tabId) {
    saveTabId.value = tabId;
    saveName.value = '';
    showSaveDialog.value = true;
}

async function confirmSave() {
    if (!saveName.value.trim() || !saveTabId.value) return;
    const instance = getInstance(saveTabId.value);
    if (!instance) return;

    const result = await createPreset(saveName.value.trim(), instance.currentPresetState.value);

    // Update tab to link with saved preset
    const tab = tabs.value.find(t => t.id === saveTabId.value);
    if (tab) {
        tab.presetId = result.id;
        tab.presetName = saveName.value.trim();
    }

    showSaveDialog.value = false;
    saveName.value = '';
    saveTabId.value = null;
}

async function onCloseTab(tabId) {
    await closeTab(tabId);
}

defineExpose({ openTab });
</script>
