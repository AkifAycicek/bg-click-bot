<template>
    <div class="max-w-2xl mx-auto p-6 flex flex-col gap-5">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-bold">SRO Background Clicker Bot</h1>
            <Button
                :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
                severity="secondary"
                text
                rounded
                @click="toggleDark"
                v-tooltip.left="isDark ? 'Aydinlik mod' : 'Karanlik mod'"
            />
        </div>

        <Card>
            <template #title><span class="text-sm">Ayarlar</span></template>
            <template #content>
                <div class="flex flex-col gap-4">
                    <WindowSelector
                        :disabled="isRunning"
                        @update:selectedWindow="selectedWindow = $event"
                    />
                    <AddPointForm
                        :selectedHwnd="selectedWindow?.hwnd"
                        :disabled="isRunning"
                        @add-point="addPoint"
                    />
                </div>
            </template>
        </Card>

        <Card>
            <template #title><span class="text-sm">Tiklama Noktalari</span></template>
            <template #content>
                <ClickPointsTable
                    :points="points"
                    :clickCounts="clickCounts"
                    :isRunning="isRunning"
                    :capturing="recapturing"
                    @remove-point="removePoint"
                    @update-point="updatePoint"
                    @recapture-point="recapturePoint"
                />
            </template>
        </Card>

        <Card>
            <template #title><span class="text-sm">Kontrol</span></template>
            <template #content>
                <StatusPanel
                    :isRunning="isRunning"
                    :canStart="canStart"
                    :totalClicks="totalClicks"
                    @start="startBot"
                    @stop="stopBot"
                />
            </template>
        </Card>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import WindowSelector from './components/WindowSelector.vue';
import AddPointForm from './components/AddPointForm.vue';
import ClickPointsTable from './components/ClickPointsTable.vue';
import StatusPanel from './components/StatusPanel.vue';

const isDark = ref(false);

function toggleDark() {
    isDark.value = !isDark.value;
    document.documentElement.classList.toggle('dark-mode', isDark.value);
    localStorage.setItem('sro-dark-mode', isDark.value ? '1' : '0');
}

function initDarkMode() {
    const saved = localStorage.getItem('sro-dark-mode');
    if (saved !== null) {
        isDark.value = saved === '1';
    } else {
        isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    document.documentElement.classList.toggle('dark-mode', isDark.value);
}

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
    initDarkMode();
    window.electronAPI.onClickCountUpdate(onClickCountUpdate);
});

onUnmounted(() => {
    window.electronAPI.removeClickCountListener();
});
</script>
