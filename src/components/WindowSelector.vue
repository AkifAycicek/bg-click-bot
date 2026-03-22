<template>
    <div class="flex items-end gap-2">
        <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Hedef Pencere</label>
            <Select
                v-model="selected"
                :options="windows"
                optionLabel="title"
                placeholder="Pencere secin..."
                class="w-full"
                :disabled="disabled"
            />
        </div>
        <Button
            icon="pi pi-refresh"
            severity="secondary"
            @click="refresh"
            :disabled="disabled"
            :loading="loading"
        />
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import Select from 'primevue/select';
import Button from 'primevue/button';

const props = defineProps({
    disabled: Boolean
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

watch(selected, (val) => {
    emit('update:selectedWindow', val);
});

onMounted(refresh);
</script>
