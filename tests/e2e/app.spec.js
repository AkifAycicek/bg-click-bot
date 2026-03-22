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

test.describe('App Shell', () => {

    test('window title', async () => {
        const title = await page.title();
        expect(title).toBe('Background Clicker Bot');
    });

    test('app heading', async () => {
        const heading = await page.textContent('h1');
        expect(heading).toContain('Background Clicker Bot');
    });

    test('settings gear button visible', async () => {
        const gearBtn = await page.$('button .pi-cog');
        expect(gearBtn).toBeTruthy();
    });

    test('empty state shows onboarding steps', async () => {
        const text = await page.textContent('body');
        const hasOnboarding = text.includes('Baslamaya hazir misiniz');
        const hasTabs = (await page.$$('[role="tab"]')).length > 0;
        // Either onboarding or restored tabs
        expect(hasOnboarding || hasTabs).toBe(true);
    });
});

test.describe('Settings Drawer', () => {

    test('opens and shows content', async () => {
        const gearBtn = await page.$('button .pi-cog');
        await gearBtn.click();
        await page.waitForTimeout(500);

        const text = await page.textContent('body');
        expect(text).toContain('Karanlik Mod');
        expect(text).toContain('Profiller');
        expect(text).toContain('Import');
        expect(text).toContain('Export');
        expect(text).toContain('Oto-kaydet');
    });

    test('dark mode toggle exists', async () => {
        // Drawer should still be open from previous test
        const toggle = await page.$('.p-toggleswitch');
        expect(toggle).toBeTruthy();

        // Close drawer
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
    });
});

test.describe('Tab Management', () => {

    test('open new tab', async () => {
        const newTabBtn = await page.$('button:has-text("Yeni Sekme")');
        if (newTabBtn) {
            await newTabBtn.click();
        } else {
            const plusBtn = await page.$('button .pi-plus');
            if (plusBtn) await plusBtn.click();
        }
        await page.waitForTimeout(500);

        const text = await page.textContent('body');
        expect(text).toContain('Hedef ve Noktalar');
        expect(text).toContain('Yeni Nokta Ekle');
        expect(text).toContain('Kontrol');
    });

    test('unsaved tab shows asterisk', async () => {
        const tabs = await page.$$('[role="tab"]');
        expect(tabs.length).toBeGreaterThanOrEqual(1);
        // Find tab with * indicator
        const tabTexts = await Promise.all(tabs.map(t => t.textContent()));
        const hasUnsaved = tabTexts.some(t => t.includes('*'));
        expect(hasUnsaved).toBe(true);
    });

    test('validation messages when not ready', async () => {
        const text = await page.textContent('body');
        expect(text).toContain('Hedef pencere secilmedi');
        expect(text).toContain('En az bir tiklama noktasi ekleyin');
    });

    test('baslat button disabled when not ready', async () => {
        const baslatBtn = await page.$('button:has-text("Baslat")');
        expect(baslatBtn).toBeTruthy();
        const disabled = await baslatBtn.isDisabled();
        expect(disabled).toBe(true);
    });

    test('open second tab', async () => {
        const plusBtns = await page.$$('button .pi-plus');
        const tabBarPlus = plusBtns.find(async btn => {
            const parent = await btn.evaluateHandle(el => el.closest('[role="tablist"]'));
            return parent;
        });
        if (tabBarPlus) {
            await tabBarPlus.click();
        } else if (plusBtns.length > 0) {
            await plusBtns[plusBtns.length - 1].click();
        }
        await page.waitForTimeout(500);

        const tabs = await page.$$('[role="tab"]');
        expect(tabs.length).toBeGreaterThanOrEqual(2);
    });

    test('close a tab', async () => {
        const tabsBefore = await page.$$('[role="tab"]');
        const countBefore = tabsBefore.length;

        // Click close button on first tab
        const closeBtn = await page.$('[role="tab"] button .pi-times');
        if (closeBtn) {
            await closeBtn.click();
            await page.waitForTimeout(300);
        }

        const tabsAfter = await page.$$('[role="tab"]');
        expect(tabsAfter.length).toBe(countBefore - 1);
    });
});

test.describe('Bot Workflow', () => {

    test('window selector visible', async () => {
        const selector = await page.$('text=Pencere secmek icin tiklayin...');
        expect(selector).toBeTruthy();
    });

    test('select window from picker', async () => {
        const selectorTrigger = await page.$('text=Pencere secmek icin tiklayin...');
        if (selectorTrigger) {
            await selectorTrigger.click();
        } else {
            const desktopIcon = await page.$('.pi-desktop');
            if (desktopIcon) await desktopIcon.click();
        }
        await page.waitForTimeout(1000);

        // Pick first window card
        const windowCards = await page.$$('[role="dialog"] .cursor-pointer');
        if (windowCards.length > 0) {
            await windowCards[0].click();
            await page.waitForTimeout(300);
        }

        // Validation for window should be gone
        const text = await page.textContent('body');
        expect(text).not.toContain('Hedef pencere secilmedi');
    });

    test('add point with name', async () => {
        // Fill name
        const textInputs = await page.$$('input[type="text"]');
        const nameInput = textInputs.find(async input => {
            const placeholder = await input.getAttribute('placeholder');
            return placeholder && placeholder.includes('Buff');
        });
        if (nameInput) {
            await nameInput.fill('Test Point');
        }

        // Fill coordinates
        const inputs = await page.$$('input[role="spinbutton"]');
        if (inputs.length >= 3) {
            await inputs[0].fill('150');
            await inputs[1].fill('250');
            await inputs[2].fill('1000');
        }

        const ekleBtn = await page.$('button:has-text("Ekle")');
        await ekleBtn.click();
        await page.waitForTimeout(200);

        const bodyText = await page.textContent('body');
        expect(bodyText).toContain('150');
        expect(bodyText).toContain('250');
        expect(bodyText).toContain('1000');
    });

    test('add second point', async () => {
        const inputs = await page.$$('input[role="spinbutton"]');
        if (inputs.length >= 3) {
            await inputs[0].fill('300');
            await inputs[1].fill('400');
            await inputs[2].fill('2000');
        }

        const ekleBtn = await page.$('button:has-text("Ekle")');
        await ekleBtn.click();
        await page.waitForTimeout(200);

        const bodyText = await page.textContent('body');
        expect(bodyText).toContain('300');
        expect(bodyText).toContain('400');
        expect(bodyText).toContain('2000');
    });

    test('points validation gone after adding', async () => {
        const text = await page.textContent('body');
        expect(text).not.toContain('En az bir tiklama noktasi ekleyin');
    });

    test('delete a point', async () => {
        const trashBtns = await page.$$('button:has(.pi-trash)');
        const countBefore = trashBtns.length;
        expect(countBefore).toBeGreaterThanOrEqual(2);

        await trashBtns[0].click();
        await page.waitForTimeout(200);

        const trashAfter = await page.$$('button:has(.pi-trash)');
        expect(trashAfter.length).toBe(countBefore - 1);
    });

    test('hotkey input visible', async () => {
        const text = await page.textContent('body');
        expect(text).toContain('Kisayol');
    });

    test('start and stop bot', async () => {
        const baslatBtn = await page.$('button:has-text("Baslat")');
        if (baslatBtn && !(await baslatBtn.isDisabled())) {
            await baslatBtn.click();
            await page.waitForTimeout(500);

            // Durdur button visible
            const durdurBtn = await page.$('button:has-text("Durdur")');
            expect(durdurBtn).toBeTruthy();

            // Tab has stop icon
            const stopIcon = await page.$('[role="tab"] .pi-stop');
            expect(stopIcon).toBeTruthy();

            // Toast notification
            const toast = await page.$('.p-toast-message');
            if (toast) {
                const toastText = await toast.textContent();
                expect(toastText).toContain('baslatildi');
            }

            // Stop bot
            await durdurBtn.click();
            await page.waitForTimeout(200);

            // Baslat button back
            const baslatAgain = await page.$('button:has-text("Baslat")');
            expect(baslatAgain).toBeTruthy();
        }
    });

    test('pause/resume buttons appear when running', async () => {
        const baslatBtn = await page.$('button:has-text("Baslat")');
        if (baslatBtn && !(await baslatBtn.isDisabled())) {
            await baslatBtn.click();
            await page.waitForTimeout(500);

            // Pause buttons should appear
            const pauseBtns = await page.$$('button:has(.pi-pause)');
            expect(pauseBtns.length).toBeGreaterThanOrEqual(1);

            // Stop bot
            const durdurBtn = await page.$('button:has-text("Durdur")');
            await durdurBtn.click();
            await page.waitForTimeout(200);
        }
    });
});
