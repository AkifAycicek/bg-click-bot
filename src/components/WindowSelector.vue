<template>
    <div class="flex items-end gap-2">
        <div class="flex-1">
            <Select
                v-model="selected"
                :options="windows"
                optionLabel="title"
                placeholder="Pencere secin..."
                class="w-full"
                :disabled="disabled"
                filter
                autoFilterFocus
                :filterFields="['title']"
                filterPlaceholder="Pencere ara..."
            />
        </div>
        <Button
            icon="pi pi-refresh"
            severity="secondary"
            @click="refresh"
            :disabled="disabled"
            :loading="loading"
            v-tooltip.top="'Pencere listesini yenile'"
        />
    </div>
</template>

<script setup>
import Button from 'primevue/button';
import Select from 'primevue/select';
import { onMounted, ref, watch } from 'vue';

const props = defineProps({
    disabled: Boolean,
    targetTitle: String
});

const emit = defineEmits(['update:selectedWindow']);

const windows = ref([]);
const selected = ref(null);
const loading = ref(false);

async function refresh() {
    loading.value = true;
    try {
        windows.value = await window.electronAPI.getWindows();
    } finally {
        loading.value = false;
    }
}

function matchByTitle(title) {
    if (!title || windows.value.length === 0) return;
    const lower = title.toLowerCase();
    const match = windows.value.find(w => w.title.toLowerCase().includes(lower));
    if (match) selected.value = match;
}

watch(selected, (val) => {
    emit('update:selectedWindow', val);
});

watch(() => props.targetTitle, (title) => {
    if (title) matchByTitle(title);
});

onMounted(async () => {
    await refresh();
    if (props.targetTitle) matchByTitle(props.targetTitle);
});
</script>
