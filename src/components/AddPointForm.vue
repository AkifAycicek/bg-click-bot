<template>
    <div>
        <h4 class="text-xs font-semibold mb-3 text-surface-500">Yeni Nokta Ekle</h4>

        <div class="flex items-end gap-2 mb-3">
            <div class="flex-1">
                <label class="block text-xs mb-1">Isim</label>
                <InputText v-model="name" placeholder="orn: Buff, HP potion..." class="w-full" :disabled="disabled" />
            </div>
        </div>

        <div class="flex items-end gap-2 mb-3">
            <div class="flex-1">
                <label class="block text-xs mb-1">X</label>
                <InputNumber v-model="x" class="w-full" :disabled="disabled" />
            </div>
            <div class="flex-1">
                <label class="block text-xs mb-1">Y</label>
                <InputNumber v-model="y" class="w-full" :disabled="disabled" />
            </div>
            <Button
                label="Yakala"
                icon="pi pi-map-marker"
                severity="secondary"
                size="small"
                @click="capture"
                :disabled="disabled || !selectedHwnd"
                :loading="capturing"
            />
        </div>

        <div class="flex items-end gap-2 mb-3">
            <div class="flex-1">
                <label class="block text-xs mb-1">Aralik (ms)</label>
                <InputNumber v-model="interval" :min="100" :step="100" class="w-full" :disabled="disabled" />
            </div>
            <div class="flex-1">
                <label class="block text-xs mb-1">Input Tipi</label>
                <Select v-model="inputType" :options="inputTypes" optionLabel="label" optionValue="value" class="w-full" :disabled="disabled" />
            </div>
        </div>

        <div class="flex items-end gap-2">
            <div class="flex-1"></div>
            <Button
                label="Ekle"
                icon="pi pi-plus"
                size="small"
                @click="addPoint"
                :disabled="disabled || x == null || y == null || !interval"
            />
        </div>
    </div>
</template>

<script setup>
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import { ref } from 'vue';

const inputTypes = [
    { label: 'Sol Tik', value: 'left-click' },
    { label: 'Sag Tik', value: 'right-click' },
    { label: 'Orta Tik', value: 'middle-click' },
    { label: 'Cift Tik', value: 'double-click' }
];

const props = defineProps({
    selectedHwnd: Number,
    disabled: Boolean
});

const emit = defineEmits(['add-point']);

const name = ref('');
const x = ref(null);
const y = ref(null);
const interval = ref(1000);
const inputType = ref('left-click');
const capturing = ref(false);

async function capture() {
    if (!props.selectedHwnd) return;
    capturing.value = true;
    try {
        const pos = await window.electronAPI.capturePosition(props.selectedHwnd);
        x.value = pos.x;
        y.value = pos.y;
    } finally {
        capturing.value = false;
    }
}

function addPoint() {
    if (x.value == null || y.value == null || !interval.value) return;
    emit('add-point', { name: name.value.trim() || null, x: x.value, y: y.value, interval: interval.value, inputType: inputType.value });
    name.value = '';
    x.value = null;
    y.value = null;
}
</script>
