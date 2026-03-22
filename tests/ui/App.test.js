import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import App from '../../src/App.vue';

const mountApp = () =>
    mount(App, {
        global: { plugins: [PrimeVue] }
    });

describe('App', () => {
    it('renders the app title', () => {
        const wrapper = mountApp();
        expect(wrapper.text()).toContain('SRO Background Clicker Bot');
    });

    it('renders all child components', async () => {
        const wrapper = mountApp();
        await flushPromises();
        // Should contain key UI text from each component
        expect(wrapper.text()).toContain('Hedef Pencere');     // WindowSelector
        expect(wrapper.text()).toContain('Yeni Nokta Ekle');   // AddPointForm
        expect(wrapper.text()).toContain('Baslat');             // StatusPanel
    });

    it('shows empty points message initially', async () => {
        const wrapper = mountApp();
        await flushPromises();
        expect(wrapper.text()).toContain('Henuz nokta eklenmedi');
    });

    it('disables Baslat button when no window selected and no points', async () => {
        const wrapper = mountApp();
        await flushPromises();
        const baslatBtn = wrapper.findAll('button').find(b => b.text().includes('Baslat'));
        expect(baslatBtn.attributes('disabled')).toBeDefined();
    });

    it('registers click count listener on mount', async () => {
        mountApp();
        await flushPromises();
        expect(window.electronAPI.onClickCountUpdate).toHaveBeenCalled();
    });
});
