import type { Prisma, PrismaClient } from '@prisma/client';
import type { AuditLogEntry } from '@/modules/audit/types/audit';

export class AuditLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(entry: AuditLogEntry) {
    return this.prisma.auditLog.create({
      data: {
        actorUserId: entry.actorUserId,
        actionCode: entry.actionCode,
        entityType: entry.entityType,
        entityId: entry.entityId,
        // `details` est un champ Json? nullable côté Prisma : le typage Prisma.InputJsonValue
        // reflète correctement ce que l'API accepte, contrairement à un cast "as never" (corrigé
        // lors de l'audit TLX-001.1, P1 — un cast "as never" masquait silencieusement toute
        // erreur de type réelle sur ce champ).
        details: (entry.details ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }

  findByEntity(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
