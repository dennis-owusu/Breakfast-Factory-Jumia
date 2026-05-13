import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        secure: false,
      }
    },
    hmr: {
      overlay: true,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: [
      'd3-interpolate',
      'd3-scale',
      'd3-array',
      'd3-color',
      'd3-format',
      'd3-time',
      'd3-time-format',
      'recharts'
    ],
    esbuildOptions: {
      target: 'es2020'
    }
  },
  build: {
    sourcemap: true,
  },
})
