import { z } from 'zod';
import { UnauthorizedError } from '@/shared/errors/AppError';
import { logger } from '@/shared/logger/logger';
import type { VerifiedPiIdentity } from '@/modules/identity/types/session';

/**
 * Service de vérification du token Pi Network — TopLuxe (TLX-006).
 *
 * Implémente exactement le mécanisme confirmé dans l'addendum Pi Network Authentication et
 * revérifié avant ce ticket (documentation officielle Pi SDK, page Platform/Authentication) :
 *
 *   GET https://api.minepi.com/v2/me
 *   Authorization: Bearer <accessToken>
 *
 * Un token valide retourne un UserDTO (200) ; un token invalide/expiré retourne 401. Cet appel
 * ne nécessite AUCUNE clé API applicative (Server API Key) — seul l'accessToken de l'utilisateur
 * est requis, conformément à la documentation ("Authorization method: Access token") et à
 * l'exigence explicite de ce ticket (aucune clé API sur ce flux d'authentification).
 *
 * Forme exacte du UserDTO, confirmée sur platform/PlatformAPI#userdto :
 *   { uid: string, credentials: { scopes: Scope[], valid_until: {...} }, username?: string }
 * `username` est explicitement documenté comme optionnel côté Pi (présent uniquement si le
 * scope `username` a été accordé) — TopLuxe l'exige néanmoins strictement ici, puisque
 * l'authentification TopLuxe ne demande justement que ce scope et que `users.pi_username` est
 * NOT NULL en base ; son absence est donc traitée comme un échec de validation.
 */
const userDtoSchema = z.object({
  uid: z.string().min(1),
  username: z.string().min(1).optional(),
  credentials: z.object({
    scopes: z.array(z.string()),
    valid_until: z
      .object({
        timestamp: z.number(),
        iso8601: z.string(),
      })
      .optional(),
  }),
});

const PI_ME_ENDPOINT = 'https://api.minepi.com/v2/me';

export class PiTokenVerificationService {
  /**
   * @param fetchImpl Permet l'injection d'un fetch mocké dans les tests (aucun appel réseau réel
   * ne doit jamais être effectué dans les tests unitaires — voir tests/unit/identity).
   */
  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  async verifyAccessToken(accessToken: string): Promise<VerifiedPiIdentity> {
    if (!accessToken || typeof accessToken !== 'string') {
      throw new UnauthorizedError('Token Pi manquant ou invalide.');
    }

    let response: Response;
    try {
      response = await this.fetchImpl(PI_ME_ENDPOINT, {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (networkError) {
      // Ne jamais inclure le token dans les logs, y compris en cas d'erreur (exigence explicite
      // du ticket). On ne logue que le fait qu'un appel a échoué, pas son contenu.
      logger.error({ endpoint: PI_ME_ENDPOINT }, 'Échec réseau lors de la vérification du token Pi');
      throw new UnauthorizedError('Impossible de vérifier le token Pi (erreur réseau).');
    }

    if (response.status === 401) {
      throw new UnauthorizedError('Token Pi invalide ou expiré.');
    }

    if (!response.ok) {
      logger.error(
        { endpoint: PI_ME_ENDPOINT, status: response.status },
        'Réponse inattendue de la Pi Platform lors de la vérification du token',
      );
      throw new UnauthorizedError('La vérification du token Pi a échoué.');
    }

    const rawBody: unknown = await response.json();
    const parsed = userDtoSchema.safeParse(rawBody);

    if (!parsed.success) {
      logger.error(
        { endpoint: PI_ME_ENDPOINT, issues: parsed.error.issues },
        'Réponse de la Pi Platform non conforme au UserDTO attendu',
      );
      throw new UnauthorizedError('Réponse de vérification Pi invalide.');
    }

    const { uid, username, credentials } = parsed.data;

    // Défense en profondeur : s'assurer que le scope 'username' a bien été accordé, en plus de
    // vérifier la simple présence du champ (le champ pourrait en théorie être présent sans que
    // le scope correspondant figure dans la liste, ce qui serait incohérent).
    if (!credentials.scopes.includes('username') || !username) {
      throw new UnauthorizedError(
        "Le token Pi ne comporte pas le scope 'username' requis par TopLuxe.",
      );
    }

    return { piUid: uid, piUsername: username };
  }
}
