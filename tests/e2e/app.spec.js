const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('@playwright/test');
const path = require('path');

let electronApp;
let page;

test.beforeAll(async () => {
    const env = { ...process.env };
    delete env.ELECTRON_RUN_AS_NODE;

    electronApp = await electron.launch({
        args: [path.join(__dirname, '..', '..')],
        env
    });
    page = await electronApp.firstWindow();
    await page.waitForSelector('#app');
});

test.afterAll(async () => {
    if (electronApp) await electronApp.close();
});

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

    test('should show empty tab state or restored tabs', async () => {
        const text = await page.textContent('body');
        // Either shows empty state or restored tabs from previous session
        const hasEmptyState = text.includes('Henuz acik sekme yok');
        const hasTabs = (await page.$$('[role="tab"]')).length > 0;
        expect(hasEmptyState || hasTabs).toBe(true);
    });

    test('should open new tab and show bot panel', async () => {
        // Click "Yeni Sekme" button (either in empty state or tab bar)
        const newTabBtn = await page.$('button:has-text("Yeni Sekme")');
        if (newTabBtn) {
            await newTabBtn.click();
        } else {
            // Tab bar plus button
            const plusBtn = await page.$('button .pi-plus');
            if (plusBtn) await plusBtn.click();
        }
        await page.waitForTimeout(500);

        // Should now show bot panel content
        const text = await page.textContent('body');
        expect(text).toContain('Hedef ve Noktalar');
        expect(text).toContain('Yeni Nokta Ekle');
        expect(text).toContain('Kontrol');
    });

    test('should show window selector in tab', async () => {
        const combobox = await page.$('[role="combobox"]');
        expect(combobox).toBeTruthy();
    });

    test('should add points and verify table in tab', async () => {
        // Select a window
        const combobox = await page.$('[role="combobox"]');
        await combobox.click();
        await page.waitForTimeout(500);

        const filterInput = await page.$('input[role="searchbox"]');
        if (filterInput) {
            await filterInput.fill('');
            await page.waitForTimeout(300);
        }

        const firstOption = await page.$('[role="option"]');
        if (firstOption) {
            await firstOption.click();
            await page.waitForTimeout(300);
        }

        // Add a point
        const inputs = await page.$$('input[role="spinbutton"]');
        if (inputs.length >= 3) {
            await inputs[0].fill('100');
            await inputs[1].fill('200');
            await inputs[2].fill('500');

            const ekleBtn = await page.$('button:has-text("Ekle")');
            await ekleBtn.click();
            await page.waitForTimeout(200);

            const bodyText = await page.textContent('body');
            expect(bodyText).toContain('100');
            expect(bodyText).toContain('200');
            expect(bodyText).toContain('500');
        }
    });

    test('should open settings drawer', async () => {
        const gearBtn = await page.$('button .pi-cog');
        await gearBtn.click();
        await page.waitForTimeout(500);

        const drawerText = await page.textContent('body');
        expect(drawerText).toContain('Karanlik Mod');
        expect(drawerText).toContain('Profiller');
        expect(drawerText).toContain('Import');
        expect(drawerText).toContain('Export');

        // Close drawer
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
    });

    test('tab should show running indicator when started', async () => {
        const baslatBtn = await page.$('button:has-text("Baslat")');
        if (baslatBtn && !(await baslatBtn.isDisabled())) {
            await baslatBtn.click();
            await page.waitForTimeout(500);

            // Should show Durdur button
            const durdurBtn = await page.$('button:has-text("Durdur")');
            expect(durdurBtn).toBeTruthy();

            // Green dot indicator in tab
            const greenDot = await page.$('.pi-circle-fill');
            expect(greenDot).toBeTruthy();

            // Stop it
            await durdurBtn.click();
            await page.waitForTimeout(200);
        }
    });
});
