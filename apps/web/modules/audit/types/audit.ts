export interface AuditLogEntry {
  actorUserId: string | null;
  actionCode: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
}
