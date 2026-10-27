import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * The app never talks to a server, and the policy makes that a rule the
 * browser enforces rather than a promise: no fetch, no beacon, no image or
 * font from anywhere but the app itself. If something ever slipped script into
 * the page, it would have nowhere to send what it read.
 *
 * Script allows 'unsafe-inline' only because Capacitor's Android bridge is
 * injected into the page as an inline script. Build-only: the dev server
 * needs inline scripts and a websocket for hot reload.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ')

function contentSecurityPolicy(): Plugin {
  const tags = [
    `<meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}" />`,
    '<meta name="referrer" content="no-referrer" />',
  ]
  return {
    name: 'twohomes:csp',
    apply: 'build',
    // Straight after the charset, so the policy governs every script below it.
    transformIndexHtml: (html) =>
      html.replace(/<meta charset="UTF-8" \/>/, (charset) => [charset, ...tags].join('\n    ')),
  }
}

// Relative base + HashRouter means the built site runs from any static host
// (Vercel, Netlify, GitHub Pages, S3) with no rewrite rules.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), contentSecurityPolicy()],
})
