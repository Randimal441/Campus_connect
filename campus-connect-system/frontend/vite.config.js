import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
server: {
  port: 5173,            // Your frontend dev server port
  proxy: {
    '/api': {
      target: 'http://localhost:5001', // Backend server
      changeOrigin: true,              // Ensures the host header is correct
    },
  },
}});
