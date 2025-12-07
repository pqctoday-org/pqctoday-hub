/// <reference types="vitest" />
import { defineConfig, configDefaults } from 'vitest/config'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

import tailwindcss from '@tailwindcss/vite'

// Plugin to update build timestamp on every build
function buildTimestampPlugin(): Plugin {
  return {
    name: 'build-timestamp',
    config() {
      return {
        define: {
          __BUILD_TIMESTAMP__: JSON.stringify(
            new Date().toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              timeZone: 'America/Chicago',
              timeZoneName: 'short',
            })
          ),
        },
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [buildTimestampPlugin(), react(), tailwindcss(), wasm(), topLevelAwait()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
  optimizeDeps: {
    exclude: ['mlkem-wasm', '@openforge-sh/liboqs'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react', 'clsx'],
          'vendor-pqc': ['mlkem-wasm', '@openforge-sh/liboqs', 'pqcrypto', '@noble/hashes'],
        },
      },
    },
  },
})
