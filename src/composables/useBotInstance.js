import { ref, computed } from 'vue';

export function useBotInstance(tabId) {
    const selectedWindow = ref(null);
    const targetTitle = ref('');
    const points = ref([]);
    const isRunning = ref(false);
    const clickCounts = ref([]);
    const totalClicks = ref(0);
    const pausedPoints = ref([]);
    const recapturing = ref(false);

    const canStart = computed(() =>
        selectedWindow.value && points.value.length > 0 && !isRunning.value
    );

    const currentPresetState = computed(() => ({
        windowTitle: selectedWindow.value?.title || '',
        points: points.value.map(p => ({ x: p.x, y: p.y, interval: p.interval }))
    }));

    function onWindowSelected(win) {
        selectedWindow.value = win;
        targetTitle.value = '';
    }

    function addPoint(point) {
        points.value.push(point);
    }

    function removePoint(index) {
        points.value.splice(index, 1);
    }

    function updatePoint({ index, field, value }) {
        points.value[index] = { ...points.value[index], [field]: value };
        if (isRunning.value) {
            window.electronAPI.updatePoints(
                tabId,
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

    async function startBot() {
        if (!canStart.value) return;
        clickCounts.value = new Array(points.value.length).fill(0);
        totalClicks.value = 0;
        pausedPoints.value = new Array(points.value.length).fill(false);

        await window.electronAPI.startClicking(
            tabId,
            selectedWindow.value.hwnd,
            points.value.map(p => ({ x: p.x, y: p.y, interval: p.interval }))
        );

        isRunning.value = true;
    }

    async function stopBot() {
        await window.electronAPI.stopClicking(tabId);
        isRunning.value = false;
        pausedPoints.value = [];
    }

    async function togglePointPause(pointIndex) {
        await window.electronAPI.togglePointPause(tabId, pointIndex);
    }

    function handleCountUpdate(data) {
        if (data.tabId !== tabId) return;
        clickCounts.value = data.counts;
        totalClicks.value = data.total;
        if (data.paused) pausedPoints.value = data.paused;
    }

    function loadFromPreset(preset) {
        points.value = (preset.points || []).map(p => ({ ...p }));
        targetTitle.value = preset.windowTitle || '';
    }

    async function dispose() {
        if (isRunning.value) {
            await stopBot();
        }
    }

    return {
        tabId,
        selectedWindow,
        targetTitle,
        points,
        isRunning,
        clickCounts,
        totalClicks,
        recapturing,
        pausedPoints,
        canStart,
        currentPresetState,
        onWindowSelected,
        addPoint,
        removePoint,
        updatePoint,
        recapturePoint,
        startBot,
        stopBot,
        togglePointPause,
        handleCountUpdate,
        loadFromPreset,
        dispose
    };
}
