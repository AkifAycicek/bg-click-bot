<template>
    <div class="flex items-center gap-3">
        <Button
            v-if="!isRunning"
            label="Baslat"
            icon="pi pi-play"
            severity="success"
            @click="$emit('start')"
            :disabled="!canStart"
        />
        <Button
            v-else
            label="Durdur"
            icon="pi pi-stop"
            severity="danger"
            @click="$emit('stop')"
        />

        <div v-if="isRunning" class="flex items-center gap-3 ml-auto">
            <div class="flex items-center gap-1">
                <i class="pi pi-spin pi-spinner text-primary-400" style="font-size: 0.75rem" />
                <span class="text-xs text-surface-500">Calisiyor</span>
            </div>
            <Tag severity="info" :value="'Toplam: ' + totalClicks" />
        </div>
        <div v-else-if="!canStart" class="ml-auto">
            <span class="text-xs text-surface-400">Pencere ve nokta ekleyerek baslayin</span>
        </div>
    </div>
</template>

<script setup>
import Button from 'primevue/button';
import Tag from 'primevue/tag';

defineProps({
    isRunning: Boolean,
    canStart: Boolean,
    totalClicks: Number
});

defineEmits(['start', 'stop']);
</script>
