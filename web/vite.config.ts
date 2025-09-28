import { defineConfig } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'

// Derive base path for GitHub Pages or custom domain deployments.
// PUBLIC_BASE_PATH is set in the deploy workflow:
// - '/' when custom CNAME (root)
// - '/<repo>' for default GitHub Pages project site
// Normalize to ensure leading slash and no trailing slash (except root)
function normalizeBase(input?: string) {
  if (!input || input === '/') return '/'
  let b = input.trim()
  if (!b.startsWith('/')) b = '/' + b
  if (b.endsWith('/')) b = b.slice(0, -1)
  return b
}
const base = normalizeBase(process.env.PUBLIC_BASE_PATH)

export default defineConfig({
  plugins: [react()],
  base,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
