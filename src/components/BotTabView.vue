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
                    {{ tab.presetName }}
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
</template>

<script setup>
import Button from 'primevue/button';
import Tab from 'primevue/tab';
import TabList from 'primevue/tablist';
import TabPanel from 'primevue/tabpanel';
import TabPanels from 'primevue/tabpanels';
import Tabs from 'primevue/tabs';
import { useTabManager } from '../composables/useTabManager';
import BotPanel from './BotPanel.vue';

const { tabs, activeTabId, openTab, closeTab, getInstance } = useTabManager();

async function onNewTab() {
    await openTab(null, 'Yeni Sekme');
}

async function onCloseTab(tabId) {
    await closeTab(tabId);
}

defineExpose({ openTab });
</script>
