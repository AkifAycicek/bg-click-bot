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

        <div v-if="isRunning" class="flex items-center gap-2 ml-auto">
            <Tag severity="info" :value="'Toplam: ' + totalClicks" />
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
