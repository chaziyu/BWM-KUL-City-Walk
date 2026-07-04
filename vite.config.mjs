import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src/pwa',
      filename: 'sw.js',
      injectRegister: 'auto',
      registerType: 'prompt',
      manifest: {
        id: '/',
        name: 'BWM KUL City Walk',
        short_name: 'BWM Walk',
        description: "Discover Kuala Lumpur's Heritage Buildings",
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#4F46E5',
        background_color: '#ffffff',
        icons: [
          {
            src: 'images/pwa/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'images/pwa/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  build: {
    sourcemap: process.env.ENABLE_SOURCEMAPS === 'true',
  },
  test: {
    exclude: ['node_modules', 'tests/browser/**'],
  },
});
