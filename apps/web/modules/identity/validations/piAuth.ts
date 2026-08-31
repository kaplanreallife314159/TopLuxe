import { z } from 'zod';

/**
 * Schéma de validation du corps de la requête POST /api/v1/auth/pi-login — TLX-006.
 *
 * `.strict()` est délibéré et constitue une exigence de sécurité, pas un simple détail de
 * validation : il garantit que TOUTE tentative du navigateur d'envoyer des champs
 * supplémentaires (par exemple `piUid` ou `username` fournis directement par le client) est
 * rejetée avec une erreur 400, plutôt que silencieusement ignorée. La seule donnée d'identité
 * jamais acceptée par ce endpoint est celle validée côté serveur via GET /v2/me.
 */
export const piLoginRequestSchema = z
  .object({
    accessToken: z.string().min(1, 'accessToken est requis'),
  })
  .strict();

export type PiLoginRequest = z.infer<typeof piLoginRequestSchema>;
