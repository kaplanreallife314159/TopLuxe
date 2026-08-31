import { z } from 'zod';

/**
 * Lecture typée et validée des variables d'environnement — TopLuxe.
 *
 * Conforme au ticket TLX-001, point 13. Toutes les variables listées dans .env.example ne sont
 * PAS toutes rendues obligatoires ici : celles réservées à des modules non encore développés
 * (Pi Network paiements, stockage KYC, stockage médias, e-mail) sont déclarées optionnelles à ce
 * stade, pour ne pas bloquer le démarrage de l'application avant leur ticket respectif. Elles
 * devront être rendues obligatoires (via `.min(1)` ou équivalent) au moment où le module
 * correspondant sera implémenté.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Ajoutée lors de l'audit TLX-001.1 (P1) : cette variable était déjà utilisée directement par
  // shared/logger/logger.ts (process.env.LOG_LEVEL) sans être déclarée ni documentée nulle part,
  // ce qui contredisait l'objectif même de ce fichier (source unique de vérité des variables
  // d'environnement). Reste optionnelle avec valeur par défaut : le logger doit pouvoir démarrer
  // même très tôt dans le cycle de vie de l'application, avant toute validation stricte.
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),

  NEXT_PUBLIC_PI_SANDBOX_MODE: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
  NEXT_PUBLIC_APP_ENV: z.string().default('development'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL est obligatoire'),
  DATABASE_CONNECTION_LIMIT: z.string().optional(),

  SESSION_COOKIE_NAME: z.string().default('topluxe_session'),
  SESSION_TOKEN_PEPPER: z.string().min(1, 'SESSION_TOKEN_PEPPER est obligatoire'),

  // Réservées aux tickets Pi Network / Paiements — non requises à ce stade (TLX-001).
  PI_API_KEY_TESTNET: z.string().optional(),
  PI_API_KEY_MAINNET: z.string().optional(),
  PI_APP_WALLET_PRIVATE_SEED_TESTNET: z.string().optional(),
  PI_APP_WALLET_PRIVATE_SEED_MAINNET: z.string().optional(),

  // Réservées aux tickets Stockage / KYC / E-mail / Monitoring — non requises à ce stade.
  OBJECT_STORAGE_ENDPOINT: z.string().optional(),
  OBJECT_STORAGE_ACCESS_KEY: z.string().optional(),
  OBJECT_STORAGE_SECRET_KEY: z.string().optional(),
  OBJECT_STORAGE_BUCKET: z.string().optional(),
  KYC_DOCUMENT_STORAGE_ENDPOINT: z.string().optional(),
  KYC_DOCUMENT_STORAGE_ACCESS_KEY: z.string().optional(),
  KYC_DOCUMENT_STORAGE_SECRET_KEY: z.string().optional(),
  KYC_DOCUMENT_STORAGE_BUCKET: z.string().optional(),
  EMAIL_PROVIDER_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),

  // NON CONFIRMÉ (cf. Sprint 0, section M) — ne doit pas être renseignée tant que non arbitrée.
  FX_RATE_SOURCE_CONFIG: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

/**
 * Valide et retourne les variables d'environnement. Lève une erreur explicite au démarrage
 * si une variable obligatoire manque, plutôt que de laisser une erreur cryptique survenir
 * plus tard dans un module métier.
 */
export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Configuration d'environnement invalide : ${parsed.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ')}`,
    );
  }
  cachedEnv = parsed.data;
  return cachedEnv;
}
