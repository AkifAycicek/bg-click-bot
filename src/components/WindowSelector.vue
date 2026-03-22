<template>
    <div class="flex items-end gap-2">
        <div class="flex-1">
            <Select
                v-model="selected"
                :options="windows"
                optionLabel="title"
                dataKey="hwnd"
                placeholder="Pencere secin..."
                class="w-full"
                :disabled="disabled"
                filter
                autoFilterFocus
                :filterFields="['title']"
                filterPlaceholder="Pencere ara..."
            >
                <template #value="{ value, placeholder }">
                    <div v-if="value" class="flex items-center gap-2">
                        <img v-if="value.thumbnail" :src="value.thumbnail" class="w-8 h-5 object-cover rounded border border-surface-200" />
                        <span class="truncate">{{ value.title }}</span>
                    </div>
                    <span v-else class="text-surface-400">{{ placeholder }}</span>
                </template>
                <template #option="{ option }">
                    <div class="flex items-center gap-3 py-1">
                        <img v-if="option.thumbnail" :src="option.thumbnail" class="w-20 h-12 object-cover rounded border border-surface-200" />
                        <div v-else class="w-20 h-12 rounded border border-surface-200 bg-surface-100 flex items-center justify-center">
                            <i class="pi pi-desktop text-surface-400" />
                        </div>
                        <span class="truncate text-sm">{{ option.title }}</span>
                    </div>
                </template>
            </Select>
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
