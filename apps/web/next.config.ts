import type { NextConfig } from 'next';

/**
 * Configuration Next.js — TopLuxe.
 *
 * Aucune configuration spécifique à Pi Network ici : le chargement du script Pi
 * (https://sdk.minepi.com/pi-sdk.js) se fait au niveau du layout via next/script,
 * conformément à la documentation officielle de pi-sdk-nextjs (voir addendum Pi Network
 * Authentication et Sprint 0, section F). Ce ticket (TLX-001) ne câble pas encore ce script.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // eslint et typescript restent bloquants au build par défaut (aucune option de bypass ajoutée),
  // conformément à l'exigence de qualité déjà actée dans la CI (Sprint 0, section I).
};

export default nextConfig;
