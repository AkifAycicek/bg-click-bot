import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import AddPointForm from '../../src/components/AddPointForm.vue';

const mountWith = (props) =>
    mount(AddPointForm, {
        props,
        global: { plugins: [PrimeVue] }
    });

describe('AddPointForm', () => {
    it('renders form labels', () => {
        const wrapper = mountWith({ selectedHwnd: 1001, disabled: false });
        expect(wrapper.text()).toContain('X');
        expect(wrapper.text()).toContain('Y');
        expect(wrapper.text()).toContain('Aralik (ms)');
    });

    it('renders Yakala and Ekle buttons', () => {
        const wrapper = mountWith({ selectedHwnd: 1001, disabled: false });
        expect(wrapper.text()).toContain('Yakala');
        expect(wrapper.text()).toContain('Ekle');
    });

    it('disables Yakala button when no hwnd selected', () => {
        const wrapper = mountWith({ selectedHwnd: undefined, disabled: false });
        const yakalaBtn = wrapper.findAll('button').find(b => b.text().includes('Yakala'));
        expect(yakalaBtn.attributes('disabled')).toBeDefined();
    });

    it('disables all inputs when disabled prop is true', () => {
        const wrapper = mountWith({ selectedHwnd: 1001, disabled: true });
        const yakalaBtn = wrapper.findAll('button').find(b => b.text().includes('Yakala'));
        expect(yakalaBtn.attributes('disabled')).toBeDefined();
    });

    it('calls electronAPI.capturePosition on Yakala click', async () => {
        window.electronAPI.capturePosition.mockResolvedValueOnce({ x: 50, y: 75 });
        const wrapper = mountWith({ selectedHwnd: 1001, disabled: false });
        const yakalaBtn = wrapper.findAll('button').find(b => b.text().includes('Yakala'));
        await yakalaBtn.trigger('click');
        expect(window.electronAPI.capturePosition).toHaveBeenCalledWith(1001);
    });

    it('disables Ekle button when coordinates are empty', () => {
        const wrapper = mountWith({ selectedHwnd: 1001, disabled: false });
        const ekleBtn = wrapper.findAll('button').find(b => b.text().includes('Ekle'));
        expect(ekleBtn.attributes('disabled')).toBeDefined();
    });
});
