import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' — 전시장 로컬 서버(하위 경로 포함)에서도 에셋 경로가 깨지지 않게 (plan.md §14)
export default defineConfig({
  base: './',
  plugins: [react()],
});
