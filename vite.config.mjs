import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    sourcemap: process.env.ENABLE_SOURCEMAPS === 'true',
  },
  test: {
    exclude: ['node_modules', 'tests/browser/**'],
  },
});
