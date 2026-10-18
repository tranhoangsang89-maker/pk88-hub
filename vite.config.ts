import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-serverless-dev',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url?.startsWith('/api/scrape-metrics')) {
            try {
              const urlObj = new URL(req.url, 'http://localhost:3000');
              const targetUrl = urlObj.searchParams.get('url') || '';
              const handlerModule = await server.ssrLoadModule('/api/scrape-metrics.ts');
              const handler = handlerModule.default;
              const fakeReq = {
                query: { url: targetUrl },
                method: req.method,
                headers: req.headers
              };
              const fakeRes = {
                setHeader: (k: string, v: string) => res.setHeader(k, v),
                status: (code: number) => {
                  res.statusCode = code;
                  return {
                    json: (data: any) => {
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify(data));
                    },
                    end: () => res.end()
                  };
                }
              };
              await handler(fakeReq, fakeRes);
              return;
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
              return;
            }
          }
          next();
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    watch: {
      ignored: ['**/*.pdf', '**/*.xlsx', '**/*.docx', '**/scratch_*', '**/*.txt']
    }
  }
});

