import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import StatusPanel from '../../src/components/StatusPanel.vue';

const mountWith = (props) =>
    mount(StatusPanel, {
        props,
        global: { plugins: [PrimeVue] }
    });

describe('StatusPanel', () => {
    it('shows Baslat button when not running', () => {
        const wrapper = mountWith({ isRunning: false, canStart: true, totalClicks: 0 });
        expect(wrapper.text()).toContain('Baslat');
        expect(wrapper.text()).not.toContain('Durdur');
    });

    it('shows Durdur button when running', () => {
        const wrapper = mountWith({ isRunning: true, canStart: false, totalClicks: 5 });
        expect(wrapper.text()).toContain('Durdur');
        expect(wrapper.text()).not.toContain('Baslat');
    });

    it('disables Baslat when canStart is false', () => {
        const wrapper = mountWith({ isRunning: false, canStart: false, totalClicks: 0 });
        const btn = wrapper.find('button');
        expect(btn.attributes('disabled')).toBeDefined();
    });

    it('emits start event when Baslat clicked', async () => {
        const wrapper = mountWith({ isRunning: false, canStart: true, totalClicks: 0 });
        await wrapper.find('button').trigger('click');
        expect(wrapper.emitted('start')).toBeTruthy();
    });

    it('emits stop event when Durdur clicked', async () => {
        const wrapper = mountWith({ isRunning: true, canStart: false, totalClicks: 0 });
        await wrapper.find('button').trigger('click');
        expect(wrapper.emitted('stop')).toBeTruthy();
    });

    it('shows total click count when running', () => {
        const wrapper = mountWith({ isRunning: true, canStart: false, totalClicks: 42 });
        expect(wrapper.text()).toContain('Toplam: 42');
    });

    it('does not show click count when not running', () => {
        const wrapper = mountWith({ isRunning: false, canStart: true, totalClicks: 0 });
        expect(wrapper.text()).not.toContain('Toplam:');
    });
});
