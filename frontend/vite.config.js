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
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
  server: {
    host: true,
    allowedHosts: ["provoking-tipper-tattling.ngrok-free.dev"],
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: false,
      }
    }
  },
})
