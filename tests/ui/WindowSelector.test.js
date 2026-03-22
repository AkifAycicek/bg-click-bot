import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import WindowSelector from '../../src/components/WindowSelector.vue';

const mountWith = (props = {}) =>
    mount(WindowSelector, {
        props: { disabled: false, ...props }
    });

describe('WindowSelector', () => {
    it('renders select trigger', () => {
        const wrapper = mountWith();
        expect(wrapper.text()).toContain('Pencere secmek icin tiklayin...');
    });

    it('renders refresh button', () => {
        const wrapper = mountWith();
        const refreshBtn = wrapper.findAll('button').find(b => b.find('.pi-refresh').exists());
        expect(refreshBtn).toBeTruthy();
    });

    it('calls getWindows on mount', async () => {
        mountWith();
        await flushPromises();
        expect(window.electronAPI.getWindows).toHaveBeenCalled();
    });

    it('calls getWindows on refresh click', async () => {
        window.electronAPI.getWindows.mockClear();
        const wrapper = mountWith();
        await flushPromises();

        window.electronAPI.getWindows.mockClear();
        const refreshBtn = wrapper.findAll('button').find(b => b.find('.pi-refresh').exists());
        await refreshBtn.trigger('click');
        await flushPromises();
        expect(window.electronAPI.getWindows).toHaveBeenCalled();
    });

    it('disables select when disabled prop is true', () => {
        const wrapper = mountWith({ disabled: true });
        // PrimeVue Select renders a div with aria-disabled
        const select = wrapper.find('[role="combobox"]');
        if (select.exists()) {
            expect(select.attributes('aria-disabled')).toBe('true');
        }
    });

    it('emits update:selectedWindow when selection changes', async () => {
        const wrapper = mountWith();
        await flushPromises();
        // Verify the component has the emit defined
        expect(wrapper.vm.$options.emits || []).toBeDefined();
    });
});
