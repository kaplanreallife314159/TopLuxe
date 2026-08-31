import type { PrismaClient } from '@prisma/client';

/**
 * Accès aux données de session — TopLuxe.
 *
 * Reflète strictement le modèle `Session` déjà spécifié (session opaque, token_hash, pas de
 * JWT) — cf. Sprint 0, section E.
 */
export class SessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(params: { userId: string; tokenHash: string; expiresAt: Date }) {
    return this.prisma.session.create({ data: params });
  }

  findByTokenHash(tokenHash: string) {
    return this.prisma.session.findUnique({ where: { tokenHash } });
  }

  revoke(sessionId: string) {
    return this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }
}
