import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 根据环境变量判断是GitHub Pages还是Vercel部署
  base: process.env.VERCEL ? '/' : '/yingmu-ar-crisis/',
})
