<template>
    <DataTable
        :value="tableData"
        size="small"
        stripedRows
        :editMode="isRunning ? undefined : 'cell'"
        @cell-edit-complete="onCellEdit"
        :rowClass="rowClass"
    >
        <Column field="index" header="#" style="width: 3rem" />
        <Column field="name" header="Isim">
            <template #body="{ data }">
                <span :class="isRunning ? '' : 'editable-cell'">
                    {{ data.name || '-' }}
                    <i v-if="!isRunning" class="pi pi-pencil editable-icon" />
                </span>
            </template>
            <template #editor="{ data }">
                <InputText v-model="data.name" class="w-full" />
            </template>
        </Column>
        <Column field="x" header="X">
            <template #body="{ data }">
                <span :class="isRunning ? '' : 'editable-cell'">
                    {{ data.x }}
                    <i v-if="!isRunning" class="pi pi-pencil editable-icon" />
                </span>
            </template>
            <template #editor="{ data }">
                <InputNumber v-model="data.x" class="w-full" :disabled="isRunning" />
            </template>
        </Column>
        <Column field="y" header="Y">
            <template #body="{ data }">
                <span :class="isRunning ? '' : 'editable-cell'">
                    {{ data.y }}
                    <i v-if="!isRunning" class="pi pi-pencil editable-icon" />
                </span>
            </template>
            <template #editor="{ data }">
                <InputNumber v-model="data.y" class="w-full" :disabled="isRunning" />
            </template>
        </Column>
        <Column field="interval" header="Aralik (ms)">
            <template #body="{ data }">
                <span :class="isRunning ? '' : 'editable-cell'">
                    {{ data.interval }}
                    <i v-if="!isRunning" class="pi pi-pencil editable-icon" />
                </span>
            </template>
            <template #editor="{ data }">
                <InputNumber v-model="data.interval" :min="100" :step="100" class="w-full" :disabled="isRunning" />
            </template>
        </Column>
        <Column field="inputType" header="Input">
            <template #body="{ data }">
                <span :class="isRunning ? '' : 'editable-cell'">
                    {{ inputTypeLabel(data.inputType) }}
                    <i v-if="!isRunning" class="pi pi-pencil editable-icon" />
                </span>
            </template>
            <template #editor="{ data }">
                <Select v-model="data.inputType" :options="inputTypeOptions" optionLabel="label" optionValue="value" class="w-full" />
            </template>
        </Column>
        <Column field="clicks" header="Tiklamalar" />
        <Column header="" style="width: 7rem">
            <template #body="{ data }">
                <div class="flex gap-1">
                    <Button
                        v-if="isRunning"
                        :icon="isPaused(data.index - 1) ? 'pi pi-play' : 'pi pi-pause'"
                        :severity="isPaused(data.index - 1) ? 'success' : 'warn'"
                        text
                        size="small"
                        @click="$emit('toggle-pause', data.index - 1)"
                        v-tooltip.top="isPaused(data.index - 1) ? 'Devam et' : 'Duraklat'"
                    />
                    <Button
                        icon="pi pi-map-marker"
                        severity="secondary"
                        text
                        size="small"
                        @click="$emit('recapture-point', data.index - 1)"
                        :disabled="isRunning || capturing"
                        v-tooltip.top="'Koordinat yakala'"
                    />
                    <Button
                        icon="pi pi-trash"
                        severity="danger"
                        text
                        size="small"
                        @click="$emit('remove-point', data.index - 1)"
                        :disabled="isRunning"
                        v-tooltip.top="'Sil'"
                    />
                </div>
            </template>
        </Column>
    </DataTable>
    <p v-if="points.length === 0" class="text-center text-sm text-surface-400 py-4">
        Henuz nokta eklenmedi.
    </p>
</template>

<script setup>
import { computed } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';

const inputTypeOptions = [
    { label: 'Sol Tik', value: 'left-click' },
    { label: 'Sag Tik', value: 'right-click' },
    { label: 'Orta Tik', value: 'middle-click' },
    { label: 'Cift Tik', value: 'double-click' }
];

const inputTypeLabels = {
    'left-click': 'Sol Tik',
    'right-click': 'Sag Tik',
    'middle-click': 'Orta Tik',
    'double-click': 'Cift Tik'
};

function inputTypeLabel(type) {
    return inputTypeLabels[type] || 'Sol Tik';
}

const props = defineProps({
    points: Array,
    clickCounts: Array,
    pausedPoints: Array,
    isRunning: Boolean,
    capturing: Boolean
});

const emit = defineEmits(['remove-point', 'update-point', 'recapture-point', 'toggle-pause']);

function isPaused(index) {
    return props.pausedPoints?.[index] || false;
}

function rowClass(data) {
    return isPaused(data.index - 1) ? 'opacity-40' : '';
}

const tableData = computed(() =>
    props.points.map((p, i) => ({
        index: i + 1,
        name: p.name || '',
        x: p.x,
        y: p.y,
        interval: p.interval,
        inputType: p.inputType || 'left-click',
        clicks: props.clickCounts[i] || 0
    }))
);

function onCellEdit(event) {
    const { data, newValue, field } = event;
    if (newValue == null || (field === 'interval' && newValue < 100)) return;
    const idx = data.index - 1;
    emit('update-point', { index: idx, field, value: newValue });
}
</script>

<style scoped>
.editable-cell {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px dashed transparent;
    transition: all 0.15s;
}

.editable-cell:hover {
    border-color: var(--p-primary-color, #6366f1);
    background: rgba(99, 102, 241, 0.08);
}

:global(.dark-mode) .editable-cell:hover {
    border-color: var(--p-primary-300, #a5b4fc);
    background: rgba(165, 180, 252, 0.1);
}

.editable-icon {
    font-size: 0.65rem;
    opacity: 0;
    color: var(--p-primary-color, #6366f1);
    transition: opacity 0.15s;
}

.editable-cell:hover .editable-icon {
    opacity: 0.7;
}
</style>
