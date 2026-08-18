import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    // 統計 JSON は viewer/ の外（../data）にあるので読み取りを許可する
    fs: { allow: ['..'] },
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      /* 統計ビューアと相関図の 2 画面。共通コード（テーマなど）は自動で共有される */
      input: {
        main: 'index.html',
        map: 'map.html',
      },
    },
  },
});
