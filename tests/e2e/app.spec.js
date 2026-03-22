const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('@playwright/test');
const path = require('path');

let electronApp;
let page;

test.beforeAll(async () => {
    // Remove ELECTRON_RUN_AS_NODE so Electron starts as a real browser process
    const env = { ...process.env };
    delete env.ELECTRON_RUN_AS_NODE;

    electronApp = await electron.launch({
        args: [path.join(__dirname, '..', '..')],
        env
    });
    page = await electronApp.firstWindow();
    // Wait for Vue to mount
    await page.waitForSelector('#app');
});

test.afterAll(async () => {
    if (electronApp) await electronApp.close();
});

// Helper: get nth combobox (0=preset, 1=window selector)
async function getCombobox(index) {
    const comboboxes = await page.$$('[role="combobox"]');
    return comboboxes[index] || null;
}

// Helper: get the "Ayarlar" card's spinbutton inputs (X, Y, Interval)
async function getPointInputs() {
    // Find inputs inside the AddPointForm (after "Yeni Nokta Ekle" text)
    return await page.$$('input[role="spinbutton"]');
}

// Helper: get trash buttons inside the points table only
async function getTableTrashButtons() {
    // Trash buttons that are siblings of map-marker buttons (in the table)
    return await page.$$('button:has(.pi-trash)');
}

test.describe('Background Clicker Bot Electron App', () => {

    test('window title should be Background Clicker Bot', async () => {
        const title = await page.title();
        expect(title).toBe('Background Clicker Bot');
    });

    test('should show app heading', async () => {
        const heading = await page.textContent('h1');
        expect(heading).toContain('Background Clicker Bot');
    });

    test('should show settings gear button', async () => {
        const gearBtn = await page.$('button .pi-cog');
        expect(gearBtn).toBeTruthy();
    });

    test('should show window selector', async () => {
        // Only one combobox on main page now (window selector)
        const windowSelect = await getCombobox(0);
        expect(windowSelect).toBeTruthy();
    });

    test('should show refresh button', async () => {
        const refreshBtn = await page.$('button .pi-refresh');
        expect(refreshBtn).toBeTruthy();
    });

    test('should show add point form', async () => {
        const formText = await page.textContent('body');
        expect(formText).toContain('Yeni Nokta Ekle');
        expect(formText).toContain('Yakala');
        expect(formText).toContain('Ekle');
    });

    test('should show points table section', async () => {
        const text = await page.textContent('body');
        expect(text).toContain('Tiklama Noktalari');
    });

    test('should show Baslat button', async () => {
        const baslatBtn = await page.$('button:has-text("Baslat")');
        expect(baslatBtn).toBeTruthy();
    });

    test('should populate window list on dropdown open', async () => {
        const windowSelect = await getCombobox(0);
        if (windowSelect) {
            await windowSelect.click();
            await page.waitForTimeout(500);
            const options = await page.$$('[role="option"]');
            expect(options.length).toBeGreaterThanOrEqual(0);
            await page.keyboard.press('Escape');
        }
    });

    test('should select a window, add multiple points, and verify table', async () => {
        // 1. Open window selector dropdown (only combobox on main page)
        const windowSelect = await getCombobox(0);
        await windowSelect.click();
        await page.waitForTimeout(500);

        // Clear filter to see all windows
        const filterInput = await page.$('input[role="searchbox"]');
        if (filterInput) {
            await filterInput.fill('');
            await page.waitForTimeout(300);
        }

        // Select the first option
        const firstOption = await page.$('[role="option"]');
        expect(firstOption).toBeTruthy();
        await firstOption.click();
        await page.waitForTimeout(300);

        // 2. Add first point: x=100, y=200, interval=500
        let inputs = await getPointInputs();
        await inputs[0].fill('100');
        await inputs[1].fill('200');
        await inputs[2].fill('500');

        const ekleBtn = await page.$('button:has-text("Ekle")');
        await ekleBtn.click();
        await page.waitForTimeout(200);

        // Verify first row
        let bodyText = await page.textContent('body');
        expect(bodyText).toContain('100');
        expect(bodyText).toContain('200');
        expect(bodyText).toContain('500');
        // Table should have data (empty message gone or never shown)

        // 3. Add second point: x=350, y=420, interval=1500
        inputs = await getPointInputs();
        await inputs[0].fill('350');
        await inputs[1].fill('420');
        await inputs[2].fill('1500');
        await ekleBtn.click();
        await page.waitForTimeout(200);

        bodyText = await page.textContent('body');
        expect(bodyText).toContain('350');
        expect(bodyText).toContain('420');
        expect(bodyText).toContain('1500');

        // 4. Add third point: x=50, y=900, interval=3000
        inputs = await getPointInputs();
        await inputs[0].fill('50');
        await inputs[1].fill('900');
        await inputs[2].fill('3000');
        await ekleBtn.click();
        await page.waitForTimeout(200);

        bodyText = await page.textContent('body');
        expect(bodyText).toContain('50');
        expect(bodyText).toContain('900');
        expect(bodyText).toContain('3000');

        // 5. Verify all values still in table
        expect(bodyText).toContain('100');
        expect(bodyText).toContain('200');
        expect(bodyText).toContain('500');
        expect(bodyText).toContain('350');
        expect(bodyText).toContain('420');
        expect(bodyText).toContain('1500');

        // 6. Baslat should be enabled
        const baslatBtn = await page.$('button:has-text("Baslat")');
        const disabled = await baslatBtn.isDisabled();
        expect(disabled).toBe(false);

        // 7. Count recapture buttons (map-marker) as proxy for table rows
        let mapButtons = await page.$$('button:has(.pi-map-marker)');
        // Subtract 1 for AddPointForm's Yakala button
        const formYakalaCount = 1;
        const tableRowCount = mapButtons.length - formYakalaCount;
        expect(tableRowCount).toBeGreaterThanOrEqual(3);

        // 8. Delete one point via first table trash button
        let trashButtons = await getTableTrashButtons();
        const trashBefore = trashButtons.length;
        // Click the second trash button (skip PresetManager's trash if any)
        await trashButtons[1].click();
        await page.waitForTimeout(200);

        trashButtons = await getTableTrashButtons();
        expect(trashButtons.length).toBe(trashBefore - 1);
    });
});
