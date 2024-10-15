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
    rollupOptions: {
      input: {
        // content: './src/content-script/index.ts',
        'tap-script': './src/content-script/tap-script/index.ts',
      },
      output: {
        entryFileNames: 'assets/[name].js',
      },
    },
  },
});
