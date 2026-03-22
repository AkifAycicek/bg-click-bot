<template>
    <div class="max-w-2xl mx-auto p-6 flex flex-col gap-5">
        <h1 class="text-xl font-bold">SRO Background Clicker Bot</h1>

        <WindowSelector
            :disabled="isRunning"
            @update:selectedWindow="selectedWindow = $event"
        />

        <AddPointForm
            :selectedHwnd="selectedWindow?.hwnd"
            :disabled="isRunning"
            @add-point="addPoint"
        />

        <ClickPointsTable
            :points="points"
            :clickCounts="clickCounts"
            :isRunning="isRunning"
            :capturing="recapturing"
            @remove-point="removePoint"
            @update-point="updatePoint"
            @recapture-point="recapturePoint"
        />

        <StatusPanel
            :isRunning="isRunning"
            :canStart="canStart"
            :totalClicks="totalClicks"
            @start="startBot"
            @stop="stopBot"
        />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import WindowSelector from './components/WindowSelector.vue';
import AddPointForm from './components/AddPointForm.vue';
import ClickPointsTable from './components/ClickPointsTable.vue';
import StatusPanel from './components/StatusPanel.vue';

const selectedWindow = ref(null);
const points = ref([]);
const isRunning = ref(false);
const clickCounts = ref([]);
const totalClicks = ref(0);
const recapturing = ref(false);

const canStart = computed(() =>
    selectedWindow.value && points.value.length > 0 && !isRunning.value
);

function addPoint(point) {
    points.value.push(point);
}

function removePoint(index) {
    points.value.splice(index, 1);
}

async function updatePoint({ index, field, value }) {
    points.value[index] = { ...points.value[index], [field]: value };
    if (isRunning.value) {
        await window.electronAPI.updatePoints(
            selectedWindow.value.hwnd,
            points.value.map(p => ({ x: p.x, y: p.y, interval: p.interval }))
        );
    }
}

async function recapturePoint(index) {
    if (!selectedWindow.value) return;
    recapturing.value = true;
    try {
        const pos = await window.electronAPI.capturePosition(selectedWindow.value.hwnd);
        points.value[index] = { ...points.value[index], x: pos.x, y: pos.y };
    } finally {
        recapturing.value = false;
    }
}

function onClickCountUpdate(data) {
    clickCounts.value = data.counts;
    totalClicks.value = data.total;
}

async function startBot() {
    if (!canStart.value) return;
    clickCounts.value = new Array(points.value.length).fill(0);
    totalClicks.value = 0;

    await window.electronAPI.startClicking(
        selectedWindow.value.hwnd,
        points.value.map(p => ({ x: p.x, y: p.y, interval: p.interval }))
    );

    isRunning.value = true;
}

async function stopBot() {
    await window.electronAPI.stopClicking();
    isRunning.value = false;
}

onMounted(() => {
    window.electronAPI.onClickCountUpdate(onClickCountUpdate);
});

onUnmounted(() => {
    window.electronAPI.removeClickCountListener();
});
</script>
