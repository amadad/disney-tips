import { defineConfig } from 'vite';

export default defineConfig({
  base: '/disney-tips/',
  publicDir: 'data',
  build: {
    outDir: 'dist'
  }
});
