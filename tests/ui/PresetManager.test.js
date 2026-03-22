import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import PresetManager from '../../src/components/PresetManager.vue';

const mountWith = (props = {}) =>
    mount(PresetManager, { props });

describe('PresetManager', () => {
    it('renders preset dropdown', async () => {
        const wrapper = mountWith();
        await flushPromises();
        expect(wrapper.text()).toContain('Profil secin...');
    });

    it('calls listPresets on mount', async () => {
        mountWith();
        await flushPromises();
        expect(window.electronAPI.listPresets).toHaveBeenCalled();
    });

    it('renders open-in-tab button', () => {
        const wrapper = mountWith();
        const openBtn = wrapper.findAll('button').find(b => b.find('.pi-external-link').exists());
        expect(openBtn).toBeTruthy();
    });

    it('renders new preset button', () => {
        const wrapper = mountWith();
        expect(wrapper.text()).toContain('Yeni');
    });

    it('renders import and export buttons', () => {
        const wrapper = mountWith();
        expect(wrapper.text()).toContain('Import');
        expect(wrapper.text()).toContain('Export');
    });

    it('renders auto-save toggle', () => {
        const wrapper = mountWith();
        expect(wrapper.text()).toContain('Oto-kaydet');
    });

    it('opens new preset dialog on Yeni click', async () => {
        const wrapper = mountWith();
        const newBtn = wrapper.findAll('button').find(b => b.text().includes('Yeni'));
        await newBtn.trigger('click');
        await flushPromises();
        expect(wrapper.vm.showNewDialog).toBe(true);
    });

    it('calls importPreset on import click', async () => {
        window.electronAPI.importPreset.mockClear();
        const wrapper = mountWith();
        const importBtn = wrapper.findAll('button').find(b => b.text().includes('Import'));
        await importBtn.trigger('click');
        await flushPromises();
        expect(window.electronAPI.importPreset).toHaveBeenCalled();
    });

    it('disables export when no preset selected', () => {
        const wrapper = mountWith();
        const exportBtn = wrapper.findAll('button').find(b => b.text().includes('Export'));
        expect(exportBtn.attributes('disabled')).toBeDefined();
    });

    it('disables open-in-tab when no preset selected', () => {
        const wrapper = mountWith();
        const openBtn = wrapper.findAll('button').find(b => b.find('.pi-external-link').exists());
        expect(openBtn.attributes('disabled')).toBeDefined();
    });
});
