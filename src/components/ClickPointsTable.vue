<template>
    <DataTable
        :value="tableData"
        size="small"
        stripedRows
        editMode="cell"
        @cell-edit-complete="onCellEdit"
    >
        <Column field="index" header="#" style="width: 3rem" />
        <Column field="x" header="X">
            <template #body="{ data }">{{ data.x }}</template>
            <template #editor="{ data }">
                <InputNumber v-model="data.x" class="w-full" :disabled="isRunning" />
            </template>
        </Column>
        <Column field="y" header="Y">
            <template #body="{ data }">{{ data.y }}</template>
            <template #editor="{ data }">
                <InputNumber v-model="data.y" class="w-full" :disabled="isRunning" />
            </template>
        </Column>
        <Column field="interval" header="Aralik (ms)">
            <template #body="{ data }">{{ data.interval }}</template>
            <template #editor="{ data }">
                <InputNumber v-model="data.interval" :min="100" :step="100" class="w-full" :disabled="isRunning" />
            </template>
        </Column>
        <Column field="clicks" header="Tiklamalar" />
        <Column header="" style="width: 3rem">
            <template #body="{ data }">
                <Button
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    size="small"
                    @click="$emit('remove-point', data.index - 1)"
                    :disabled="isRunning"
                />
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

const props = defineProps({
    points: Array,
    clickCounts: Array,
    isRunning: Boolean
});

const emit = defineEmits(['remove-point', 'update-point']);

const tableData = computed(() =>
    props.points.map((p, i) => ({
        index: i + 1,
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
