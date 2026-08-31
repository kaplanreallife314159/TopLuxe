import { test, expect } from '@playwright/test';

/**
 * Test E2E de la route de health check, exécuté contre un serveur Next.js réellement démarré
 * (cf. playwright.config.ts, webServer). Nécessite que les dépendances soient installées et que
 * `npm run dev` puisse démarrer — non exécutable dans l'environnement ayant généré ce dépôt
 * (voir rapport TLX-001, section G).
 */
test('GET /api/health returns 200 with ok status', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.status).toBe('ok');
});
