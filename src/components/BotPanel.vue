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
                <StatusPanel
                    :isRunning="instance.isRunning.value"
                    :canStart="instance.canStart.value"
                    :totalClicks="instance.totalClicks.value"
                    @start="instance.startBot()"
                    @stop="instance.stopBot()"
                />
            </template>
        </Card>
    </div>
</template>

<script setup>
import Card from 'primevue/card';
import WindowSelector from './WindowSelector.vue';
import AddPointForm from './AddPointForm.vue';
import ClickPointsTable from './ClickPointsTable.vue';
import StatusPanel from './StatusPanel.vue';
import { useTabManager } from '../composables/useTabManager';

const props = defineProps({
    instance: Object,
    tabId: String
});

const { autoSaveTab } = useTabManager();

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
