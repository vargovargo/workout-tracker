import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // @firebase/util@1.13 references postinstall.mjs which npm doesn't generate
      '@firebase/util/dist/postinstall.mjs': resolve(__dirname, 'src/lib/firebasePostinstallStub.js'),
    },
  },
  // Custom domain fitness.vargo.city — always serve from root
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
