import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()], base: './',
  server: { host: '127.0.0.1', port: 5190, strictPort: true,
    proxy: { '/api/local-llm': { target: 'http://127.0.0.1:5193', changeOrigin: true } } },
  build: { target: 'es2022' }
});
