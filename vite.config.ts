import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@xparse-kit/visualizer': path.resolve(
        __dirname,
        './node_modules/@xparse-kit/visualizer/dist/index.esm.min.js',
      ),
    },
  },
});
