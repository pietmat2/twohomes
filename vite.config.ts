import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Relative base + HashRouter means the built site runs from any static host
// (Vercel, Netlify, GitHub Pages, S3) with no rewrite rules.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
