import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { BRAND } from './src/config/brand.ts'

// base './': relative Pfade, damit der Build auch unter /tomei/ auf GitHub Pages läuft.
// Titel und Beschreibung der index.html kommen aus der zentralen Branding-Datei.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'brand-html',
      transformIndexHtml: (html) =>
        html.replaceAll('%BRAND_NAME%', BRAND.name).replaceAll('%BRAND_CLAIM%', BRAND.claim).replaceAll('%BRAND_DESC%', BRAND.description.de),
    },
  ],
  server: { port: 5193 },
})
