import { describe, it, expect } from 'vitest';
import { GET } from '../../apps/web/app/api/health/route';

/**
 * Test d'intégration de la route de health check.
 * Appelle directement le handler exporté par la route (sans serveur HTTP réel), ce qui reste
 * représentatif du comportement de la route car celle-ci ne dépend d'aucune ressource externe
 * (pas de base de données, pas de Pi Network), conformément à sa spécification (TLX-001, point 16).
 */
describe('GET /api/health', () => {
  it('returns a 200 status with a simple ok payload', async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ status: 'ok', service: 'topluxe-web' });
  });
});
