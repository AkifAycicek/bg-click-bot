import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [vue()],
    base: './',
    build: {
        outDir: 'dist-renderer',
        chunkSizeWarningLimit: 1000
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./tests/ui/setup.js'],
        include: ['tests/ui/**/*.test.js']
    }
});
