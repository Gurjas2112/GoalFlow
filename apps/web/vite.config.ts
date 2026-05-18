import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Load VITE_* env vars from the monorepo root .env (and apps/web/.env*) so we
  // don't need to duplicate Azure/API keys between root and apps/web.
  envDir: path.resolve(__dirname, '../../'),
})
