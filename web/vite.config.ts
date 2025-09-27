import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Simple dev config (HTTP). If you need HTTPS later we can add a stable solution.
export default defineConfig({
  plugins: [react()],
})
