import { defineConfig, loadEnv } from 'vite';
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { extname, resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.VITE_BASE || '/';
  const publicFiles = [
    'feed.xml',
    'health.json',
    'og-image.png',
    'robots.txt',
    'sitemap.xml',
    'tips.json',
  ];
  const publicContentTypes: Record<string, string> = {
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
  };

  return {
    base,
    publicDir: false,
    plugins: [{
      name: 'copy-public-data',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!req.url) {
            next();
            return;
          }

          const pathname = new URL(req.url, 'http://localhost').pathname;
          const file = pathname.slice(1);
          if (!publicFiles.includes(file)) {
            next();
            return;
          }

          const source = resolve(__dirname, 'data/public', file);
          if (!existsSync(source)) {
            next();
            return;
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', publicContentTypes[extname(file)] ?? 'application/octet-stream');
          res.end(readFileSync(source));
        });
      },
      closeBundle() {
        const outDir = resolve(__dirname, 'dist');
        mkdirSync(outDir, { recursive: true });
        for (const file of publicFiles) {
          const source = resolve(__dirname, 'data/public', file);
          if (existsSync(source)) {
            copyFileSync(source, resolve(outDir, file));
          }
        }
      },
    }],
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          plan: resolve(__dirname, 'plan.html'),
          tips: resolve(__dirname, 'tips.html'),
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
