import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Tùy chọn: Nhóm các thư viện lớn như MUI vào chunk riêng
          mui: ['@mui/material', '@mui/icons-material'],
        },
      },
    },
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