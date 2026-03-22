<template>
    <DataTable
        :value="tableData"
        size="small"
        stripedRows
        :editMode="isRunning ? undefined : 'cell'"
        @cell-edit-complete="onCellEdit"
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
        <Column field="clicks" header="Tiklamalar" />
        <Column header="" style="width: 5rem">
            <template #body="{ data }">
                <div class="flex gap-1">
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

const props = defineProps({
    points: Array,
    clickCounts: Array,
    isRunning: Boolean,
    capturing: Boolean
});

const emit = defineEmits(['remove-point', 'update-point', 'recapture-point']);

const tableData = computed(() =>
    props.points.map((p, i) => ({
        index: i + 1,
        name: p.name || '',
        x: p.x,
        y: p.y,
        interval: p.interval,
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
