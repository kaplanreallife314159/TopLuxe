import { z } from 'zod';

/**
 * Schémas de validation du module Identité — fondation uniquement.
 * Les schémas liés à l'authentification Pi (accessToken reçu du client, etc.) seront ajoutés
 * au ticket dédié, pas ici.
 */
export const revokeSessionSchema = z.object({
  sessionId: z.string().uuid(),
});
