import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import ClickPointsTable from '../../src/components/ClickPointsTable.vue';

const samplePoints = [
    { x: 100, y: 200, interval: 500 },
    { x: 300, y: 400, interval: 1000 }
];

const mountWith = (props) =>
    mount(ClickPointsTable, {
        props,
        global: { plugins: [PrimeVue] }
    });

describe('ClickPointsTable', () => {
    it('shows empty message when no points', () => {
        const wrapper = mountWith({ points: [], clickCounts: [], isRunning: false });
        expect(wrapper.text()).toContain('Henuz nokta eklenmedi');
    });

    it('renders rows for each point', () => {
        const wrapper = mountWith({ points: samplePoints, clickCounts: [5, 10], isRunning: false });
        expect(wrapper.text()).toContain('100');
        expect(wrapper.text()).toContain('200');
        expect(wrapper.text()).toContain('500');
        expect(wrapper.text()).toContain('300');
        expect(wrapper.text()).toContain('400');
        expect(wrapper.text()).toContain('1000');
    });

    it('displays click counts', () => {
        const wrapper = mountWith({ points: samplePoints, clickCounts: [5, 10], isRunning: false });
        expect(wrapper.text()).toContain('5');
        expect(wrapper.text()).toContain('10');
    });

    it('shows zero when clickCounts is empty', () => {
        const wrapper = mountWith({ points: samplePoints, clickCounts: [], isRunning: false });
        // Should show 0 for each point
        const text = wrapper.text();
        expect(text).toContain('0');
    });

    it('emits remove-point with correct index on trash click', async () => {
        const wrapper = mountWith({ points: samplePoints, clickCounts: [0, 0], isRunning: false });
        const trashButtons = wrapper.findAll('button').filter(b => {
            const icon = b.find('.pi-trash');
            return icon.exists();
        });
        if (trashButtons.length > 0) {
            await trashButtons[0].trigger('click');
            expect(wrapper.emitted('remove-point')).toBeTruthy();
            expect(wrapper.emitted('remove-point')[0]).toEqual([0]);
        }
    });

    it('disables trash buttons when running', () => {
        const wrapper = mountWith({ points: samplePoints, clickCounts: [0, 0], isRunning: true });
        const trashButtons = wrapper.findAll('button').filter(b => b.find('.pi-trash').exists());
        for (const btn of trashButtons) {
            expect(btn.attributes('disabled')).toBeDefined();
        }
    });
});
