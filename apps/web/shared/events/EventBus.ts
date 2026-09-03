/**
 * Bus d'événements interne (publication/souscription) — TopLuxe.
 *
 * Implémentation en mémoire, suffisante pour le monolithe modulaire au MVP (cf. architecture
 * technique, section 16.A). Aucun événement métier n'est encore publié par ce ticket (TLX-001) :
 * seule l'infrastructure est posée, pour être utilisée par les modules Identité/Audit dès le
 * prochain ticket, puis par l'ensemble des modules au fil du backlog.
 */
export type EventHandler<TPayload = unknown> = (payload: TPayload) => void | Promise<void>;

export interface EventBus {
  publish<TPayload = unknown>(eventName: string, payload: TPayload): Promise<void>;
  subscribe<TPayload = unknown>(eventName: string, handler: EventHandler<TPayload>): void;
}

class InMemoryEventBus implements EventBus {
  private handlers = new Map<string, EventHandler[]>();

  subscribe<TPayload = unknown>(eventName: string, handler: EventHandler<TPayload>): void {
    const existing = this.handlers.get(eventName) ?? [];
    existing.push(handler as EventHandler);
    this.handlers.set(eventName, existing);
  }

  async publish<TPayload = unknown>(eventName: string, payload: TPayload): Promise<void> {
    const handlers = this.handlers.get(eventName) ?? [];
    // Exécution séquentielle volontaire pour un MVP : simplifie le débogage et le traçage.
    // Une évolution vers une exécution parallèle/asynchrone pourra être envisagée si nécessaire.
    for (const handler of handlers) {
      await handler(payload);
    }
  }
}

// Instance singleton pour le monolithe modulaire — cohérent avec l'architecture validée.
export const eventBus: EventBus = new InMemoryEventBus();
