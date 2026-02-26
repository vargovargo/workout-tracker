import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // On GitHub Actions, GITHUB_REPOSITORY = 'user/repo' → base becomes '/repo/'
  // Locally it's undefined → base stays '/'
  base: process.env.GITHUB_REPOSITORY
    ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
    : '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
