import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://api.dan.io.vn:30020',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});