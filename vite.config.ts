import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {crx} from '@crxjs/vite-plugin';
import defineManifest from './manifest.config';
import svgr from 'vite-plugin-svgr';
import path from 'path';
import {nodePolyfills} from 'vite-plugin-node-polyfills';
// import {NodeGlobalsPolyfillPlugin} from '@esbuild-plugins/node-globals-polyfill';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      process: 'process/browser',
      buffer: 'buffer',
    },
  },
  plugins: [
    react(),
    svgr(),
    crx({manifest: defineManifest}),
    nodePolyfills({
      exclude: [],
      // Whether to polyfill specific globals.
      globals: {
        Buffer: true, // can also be 'build', 'dev', or false
        global: true,
        process: true,
      },
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    }),
  ],
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        ui: 'index.html',
        notification: 'notification.html',
      },
      output: {
        entryFileNames: 'assets/[name].js', // output files as ui.js and notification.js
      },
    },
  },
  optimizeDeps: {
    include: ['buffer', '@metamask/browser-passworder'],
  },
  define: {global: 'self'},
});
