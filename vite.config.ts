import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/disney-tips/',
  publicDir: 'data',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html')
      }
    }
  }
});
