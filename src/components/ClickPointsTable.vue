<template>
    <DataTable :value="tableData" size="small" stripedRows>
        <Column field="index" header="#" style="width: 3rem" />
        <Column field="x" header="X" />
        <Column field="y" header="Y" />
        <Column field="interval" header="Aralik (ms)" />
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

const props = defineProps({
    points: Array,
    clickCounts: Array,
    isRunning: Boolean
});

defineEmits(['remove-point']);

const tableData = computed(() =>
    props.points.map((p, i) => ({
        index: i + 1,
        x: p.x,
        y: p.y,
        interval: p.interval,
        clicks: props.clickCounts[i] || 0
    }))
);
</script>
