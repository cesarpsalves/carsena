import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  envDir: '../../',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      '@carsena/design-system': path.resolve(__dirname, '../../packages/design-system'),
      '@carsena/types': path.resolve(__dirname, '../../packages/types'),
    },
  },
})
