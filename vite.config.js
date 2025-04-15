import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/yingmu-ar-crisis/', // 设置基本路径为您的仓库名称
})
