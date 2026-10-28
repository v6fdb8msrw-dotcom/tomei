import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base './': relative Pfade, damit der Build auch unter /tomei/ auf GitHub Pages läuft.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5193 },
})
