import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.VITE_BASE || '/';

  return {
    base,
    publicDir: 'data/public',
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          about: resolve(__dirname, 'about.html'),
          parks: resolve(__dirname, 'parks.html'),
          dining: resolve(__dirname, 'dining.html'),
          hotels: resolve(__dirname, 'hotels.html'),
          budget: resolve(__dirname, 'budget.html'),
          planning: resolve(__dirname, 'planning.html'),
          transportation: resolve(__dirname, 'transportation.html')
        }
      }
    }
  };
});
