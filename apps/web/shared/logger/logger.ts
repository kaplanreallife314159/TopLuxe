import pino from 'pino';

/**
 * Logger structuré — TopLuxe.
 *
 * Règle de sécurité impérative (cf. Sprint 0 / spécifications, section sécurité) : ne jamais
 * logger de données sensibles (documents KYC, tokens de session en clair, clés privées de
 * portefeuille applicatif Pi, mots de passe/secrets quelconques). La liste `redactedPaths`
 * ci-dessous doit être complétée à chaque fois qu'un nouveau champ sensible est introduit dans
 * un payload logué, plutôt que de faire confiance à une vigilance manuelle au cas par cas.
 */
const redactedPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  'accessToken',
  'token',
  'tokenHash',
  'password',
  'sessionToken',
  'piAppWalletPrivateSeed',
  '*.accessToken',
  '*.tokenHash',
  '*.piAppWalletPrivateSeed',
];

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: redactedPaths,
    censor: '[REDACTED]',
  },
  base: {
    app: 'topluxe',
    env: process.env.NEXT_PUBLIC_APP_ENV ?? 'development',
  },
});

export type Logger = typeof logger;
