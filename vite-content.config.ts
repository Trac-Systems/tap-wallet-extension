import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      process: 'process/browser',
      buffer: 'buffer',
    },
  },
  build: {
    emptyOutDir: false,
    target: 'es2015', // Changed to es2015 for better compatibility
    rollupOptions: {
      input: {
        // content: './src/content-script/index.ts',
        'tap-script': './src/content-script/tap-script/index.ts',
      },
      output: {
        entryFileNames: 'assets/[name].js',
        format: 'iife', // Ensure IIFE format for content scripts
      },
    },
  },
});
