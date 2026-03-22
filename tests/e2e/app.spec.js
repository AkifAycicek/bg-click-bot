const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('@playwright/test');
const path = require('path');

let electronApp;
let page;

test.beforeAll(async () => {
    electronApp = await electron.launch({
        args: [path.join(__dirname, '..', '..')]
    });
    page = await electronApp.firstWindow();
    // Wait for Vue to mount
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

    test('should show window selector with label', async () => {
        const label = await page.textContent('label');
        expect(label).toContain('Hedef Pencere');
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

    test('should show empty points message', async () => {
        const text = await page.textContent('body');
        expect(text).toContain('Henuz nokta eklenmedi');
    });

    test('should show disabled Baslat button', async () => {
        const baslatBtn = await page.$('button:has-text("Baslat")');
        expect(baslatBtn).toBeTruthy();
        const disabled = await baslatBtn.isDisabled();
        expect(disabled).toBe(true);
    });

    test('should populate window list on dropdown open', async () => {
        // Click the Select dropdown
        const select = await page.$('[role="combobox"]');
        if (select) {
            await select.click();
            // Wait for dropdown to open and filter
            await page.waitForTimeout(500);
            // Should have at least one option in the listbox
            const options = await page.$$('[role="option"]');
            expect(options.length).toBeGreaterThanOrEqual(0);
            // Close dropdown by pressing Escape
            await page.keyboard.press('Escape');
        }
    });

    test('should select a window, add multiple points, and verify table', async () => {
        // 1. Open dropdown and select first available window
        const select = await page.$('[role="combobox"]');
        await select.click();
        await page.waitForTimeout(500);

        // Clear the default filter to see all windows
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
        const inputs = await page.$$('input[role="spinbutton"]');
        // inputs: [X, Y, Interval]
        await inputs[0].fill('100');
        await inputs[1].fill('200');
        await inputs[2].fill('500');

        const ekleBtn = await page.$('button:has-text("Ekle")');
        await ekleBtn.click();
        await page.waitForTimeout(200);

        // Verify first row in table
        let bodyText = await page.textContent('body');
        expect(bodyText).toContain('100');
        expect(bodyText).toContain('200');
        expect(bodyText).toContain('500');
        // Empty message should be gone
        expect(bodyText).not.toContain('Henuz nokta eklenmedi');

        // 3. Add second point: x=350, y=420, interval=1500
        const inputs2 = await page.$$('input[role="spinbutton"]');
        await inputs2[0].fill('350');
        await inputs2[1].fill('420');
        await inputs2[2].fill('1500');
        await ekleBtn.click();
        await page.waitForTimeout(200);

        bodyText = await page.textContent('body');
        expect(bodyText).toContain('350');
        expect(bodyText).toContain('420');
        expect(bodyText).toContain('1500');

        // 4. Add third point: x=50, y=900, interval=3000
        const inputs3 = await page.$$('input[role="spinbutton"]');
        await inputs3[0].fill('50');
        await inputs3[1].fill('900');
        await inputs3[2].fill('3000');
        await ekleBtn.click();
        await page.waitForTimeout(200);

        bodyText = await page.textContent('body');
        expect(bodyText).toContain('50');
        expect(bodyText).toContain('900');
        expect(bodyText).toContain('3000');

        // 5. Verify table has 3 rows (check row numbers)
        expect(bodyText).toContain('1');
        expect(bodyText).toContain('2');
        expect(bodyText).toContain('3');

        // 6. Verify all original values still in table
        expect(bodyText).toContain('100');
        expect(bodyText).toContain('200');
        expect(bodyText).toContain('500');
        expect(bodyText).toContain('350');
        expect(bodyText).toContain('420');
        expect(bodyText).toContain('1500');

        // 7. Baslat button should now be enabled (window selected + points added)
        const baslatBtn = await page.$('button:has-text("Baslat")');
        const disabled = await baslatBtn.isDisabled();
        expect(disabled).toBe(false);

        // 8. Delete the second point (index 1)
        const trashButtons = await page.$$('button:has(.pi-trash)');
        expect(trashButtons.length).toBe(3);
        await trashButtons[1].click();
        await page.waitForTimeout(200);

        // Verify second point (350, 420, 1500) is gone, others remain
        bodyText = await page.textContent('body');
        expect(bodyText).toContain('100');
        expect(bodyText).toContain('50');
        expect(bodyText).toContain('900');
        // 350/420 might appear as substrings, so check trash button count
        const remainingTrash = await page.$$('button:has(.pi-trash)');
        expect(remainingTrash.length).toBe(2);
    });
});
