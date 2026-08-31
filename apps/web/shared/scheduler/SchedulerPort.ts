/**
 * Interface d'abstraction pour la planification de tâches — TopLuxe.
 *
 * Conforme à la décision verrouillée du Sprint 0 : Redis est EXCLU du MVP initial. Cette
 * interface permet de concevoir les futurs jobs planifiés (réconciliation de paiement,
 * libération automatique d'escrow, expiration de réservation — tous hors périmètre de ce
 * ticket TLX-001) sans dépendre d'une implémentation précise, afin de pouvoir introduire une
 * implémentation Redis-backed plus tard sans réécrire la logique métier des jobs eux-mêmes.
 *
 * AUCUNE implémentation concrète n'est fournie par ce ticket : ni une implémentation naïve
 * (setTimeout/setInterval), ni une implémentation Redis. Seule l'interface est posée, dans
 * l'esprit de la consigne "sans Redis" et "sans logique métier complexe" à ce stade.
 */
export interface ScheduledJobHandle {
  readonly jobName: string;
  cancel(): void;
}

export interface SchedulerPort {
  /**
   * Planifie l'exécution d'une tâche à une date donnée (ex. libération automatique d'un escrow).
   * NON IMPLÉMENTÉ à ce stade — interface uniquement.
   */
  scheduleAt(jobName: string, runAt: Date, payload: unknown): Promise<ScheduledJobHandle>;

  /**
   * Planifie l'exécution récurrente d'une tâche (ex. job de réconciliation périodique).
   * NON IMPLÉMENTÉ à ce stade — interface uniquement.
   */
  scheduleRecurring(
    jobName: string,
    intervalMs: number,
    payload: unknown,
  ): Promise<ScheduledJobHandle>;

  cancel(jobName: string): Promise<void>;
}
