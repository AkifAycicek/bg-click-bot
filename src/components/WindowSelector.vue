<template>
    <div>
        <!-- Selected window display / trigger -->
        <div
            class="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
            :class="[
                disabled ? 'opacity-50 pointer-events-none' : '',
                selected ? 'border-2 border-green-500 bg-green-50/30 shadow-md shadow-green-200/50' : 'border border-surface-200 hover:border-green-300'
            ]"
            @click="showPicker = true"
        >
            <template v-if="selected">
                <img v-if="selected.thumbnail" :src="selected.thumbnail" class="w-16 h-10 object-cover rounded border border-surface-200" />
                <div v-else class="w-16 h-10 rounded border border-surface-200 bg-surface-100 flex items-center justify-center">
                    <i class="pi pi-desktop text-surface-400" />
                </div>
                <span class="truncate flex-1 text-sm font-medium">{{ selected.title }}</span>
            </template>
            <template v-else>
                <i class="pi pi-desktop text-surface-400" />
                <span class="text-surface-400 text-sm flex-1">Pencere secmek icin tiklayin...</span>
            </template>
            <Button
                icon="pi pi-refresh"
                severity="secondary"
                text
                size="small"
                class="ml-auto"
                @click.stop="refresh"
                :loading="loading"
                v-tooltip.top="'Yenile'"
            />
        </div>

        <!-- Window picker dialog -->
        <Dialog
            v-model:visible="showPicker"
            header="Pencere Secin"
            modal
            :style="{ width: '700px', maxHeight: '80vh' }"
        >
            <div class="mb-3">
                <InputText
                    v-model="searchText"
                    placeholder="Pencere ara..."
                    class="w-full"
                    ref="searchInput"
                />
            </div>
            <div class="grid grid-cols-3 gap-3" style="max-height: 50vh">
                <div
                    v-for="win in filteredWindows"
                    :key="win.hwnd"
                    class="cursor-pointer border border-surface-200 rounded-lg overflow-hidden hover:border-primary-400 hover:shadow-md transition-all"
                    :class="{ 'ring-2 ring-green-500 shadow-lg shadow-green-200/50': selected?.hwnd === win.hwnd }"
                    @click="selectWindow(win)"
                >
                    <img v-if="win.thumbnail" :src="win.thumbnail" class="w-full h-28 object-cover bg-surface-100" />
                    <div v-else class="w-full h-28 bg-surface-100 flex items-center justify-center">
                        <i class="pi pi-desktop text-surface-300 text-3xl" />
                    </div>
                    <div class="p-2">
                        <p class="text-xs truncate" :title="win.title">{{ win.title }}</p>
                    </div>
                </div>
            </div>
            <p v-if="filteredWindows.length === 0" class="text-center text-surface-400 py-8 text-sm">
                Pencere bulunamadi.
            </p>
        </Dialog>
    </div>
</template>

<script setup>
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import { computed, nextTick, onMounted, ref, watch } from 'vue';

const props = defineProps({
    disabled: Boolean,
    targetTitle: String
});

const emit = defineEmits(['update:selectedWindow']);

const windows = ref([]);
const selected = ref(null);
const loading = ref(false);
const showPicker = ref(false);
const searchText = ref('');
const searchInput = ref(null);

const filteredWindows = computed(() => {
    const term = searchText.value.trim().toLowerCase();
    if (!term) return windows.value;
    return windows.value.filter(w => w.title.toLowerCase().includes(term));
});

async function refresh() {
    loading.value = true;
    try {
        windows.value = await window.electronAPI.getWindows();
    } finally {
        loading.value = false;
    }
}

function selectWindow(win) {
    selected.value = win;
    showPicker.value = false;
    searchText.value = '';
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

watch(showPicker, async (val) => {
    if (val) {
        await refresh();
        nextTick(() => searchInput.value?.$el?.focus());
    }
});

onMounted(async () => {
    await refresh();
    if (props.targetTitle) matchByTitle(props.targetTitle);
});
</script>
