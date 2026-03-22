import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import App from '../../src/App.vue';

const mountApp = () => mount(App);

describe('App', () => {
    it('renders the app title', () => {
        const wrapper = mountApp();
        expect(wrapper.text()).toContain('Background Clicker Bot');
    });

    it('renders settings gear button', () => {
        const wrapper = mountApp();
        const gearBtn = wrapper.findAll('button').find(b => b.find('.pi-cog').exists());
        expect(gearBtn).toBeTruthy();
    });

    it('shows empty tab state initially', async () => {
        const wrapper = mountApp();
        await flushPromises();
        expect(wrapper.text()).toContain('Henuz acik sekme yok');
    });

    it('shows new tab button in empty state', async () => {
        const wrapper = mountApp();
        await flushPromises();
        expect(wrapper.text()).toContain('Yeni Sekme');
    });
});
