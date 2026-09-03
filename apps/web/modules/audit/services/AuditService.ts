import { AuditLogRepository } from '@/modules/audit/repositories/AuditLogRepository';
import type { AuditLogEntry } from '@/modules/audit/types/audit';
import { eventBus } from '@/shared/events/EventBus';

/**
 * Service d'audit — TopLuxe.
 *
 * Conforme aux spécifications techniques (module Audit & Journalisation, section 2) : table
 * strictement en ajout, consommateur universel des événements sensibles des autres modules.
 *
 * Ce ticket (TLX-001) fournit le service et son abonnement générique au bus d'événements.
 * Aucun événement métier concret n'est encore publié par les autres modules (ils n'existent pas
 * encore) — l'abonnement est donc prêt mais inactif tant que le premier événement réel
 * (ex. `user.registered`, au ticket TLX-006) n'est pas publié.
 */
export class AuditService {
  constructor(private readonly repository: AuditLogRepository) {}

  async record(entry: AuditLogEntry): Promise<void> {
    await this.repository.create(entry);
  }

  /**
   * Abonne ce service à un canal d'événements générique. À invoquer une fois au démarrage de
   * l'application pour chaque événement métier sensible, au fur et à mesure de leur introduction
   * par les modules concernés (cf. tableau des événements par module dans les spécifications).
   */
  subscribeTo(eventName: string, mapToEntry: (payload: unknown) => AuditLogEntry): void {
    eventBus.subscribe(eventName, async (payload) => {
      await this.record(mapToEntry(payload));
    });
  }
}
