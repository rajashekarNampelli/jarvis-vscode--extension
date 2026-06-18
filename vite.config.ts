import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'webview',
  base: '',
  build: {
    outDir: '../dist/webview',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // IIFE format — avoids ES module + nonce CSP headaches in webviews
        format: 'iife',
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/index[extname]',
        // No code-splitting — single bundle is simpler for webviews
        inlineDynamicImports: true,
      },
    },
    // CSS injection via JS, not a <link> tag — avoids broken relative paths in webviews
    cssCodeSplit: false,
  },
});
