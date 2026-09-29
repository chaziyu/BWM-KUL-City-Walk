import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    sourcemap: process.env.ENABLE_SOURCEMAPS === 'true',
  },
  test: {
    exclude: ['node_modules', 'tests/browser/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: 'coverage',
      include: [
        'src/services/api-client.js',
        'src/services/session-client.js',
        'src/services/storage.js',
        'src/services/storage-migration.js',
        'src/features/passport/progress-service.js',
        'src/features/sites/site-domain.js',
        'src/features/trails/trail-engine.js',
        'api/_shared/config.js',
        'api/_shared/http.js',
        'api/_shared/security.js',
        'api/_shared/session.js',
        'api/_shared/chat-quota.js',
        'api/_shared/rate-limit.js',
        'api/_shared/ai/answer-cache.js',
        'api/_shared/ai/deterministic-answer.js',
        'api/_shared/ai/retrieve-sites.js',
        'api/_shared/ai/response-contract.js',
      ],
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70,
      },
    },
  },
});
