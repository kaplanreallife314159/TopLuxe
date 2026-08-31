import { describe, it, expect } from 'vitest';
import type { SchedulerPort, ScheduledJobHandle } from '../../../apps/web/shared/scheduler/SchedulerPort';

/**
 * Ce test ne vérifie pas d'implémentation concrète (aucune n'existe à ce stade, conformément à
 * la décision "Redis exclu du MVP"). Il vérifie uniquement qu'une implémentation factice
 * respectant l'interface SchedulerPort peut être construite et utilisée par un consommateur
 * type — garantissant que le contrat d'interface est cohérent et utilisable.
 */
class NoopScheduler implements SchedulerPort {
  async scheduleAt(jobName: string): Promise<ScheduledJobHandle> {
    return { jobName, cancel: () => {} };
  }
  async scheduleRecurring(jobName: string): Promise<ScheduledJobHandle> {
    return { jobName, cancel: () => {} };
  }
  async cancel(): Promise<void> {}
}

describe('SchedulerPort contract', () => {
  it('allows a no-op implementation to satisfy the interface', async () => {
    const scheduler: SchedulerPort = new NoopScheduler();
    const handle = await scheduler.scheduleAt('escrow.autoRelease', new Date(), { orderId: '1' });
    expect(handle.jobName).toBe('escrow.autoRelease');
    expect(() => handle.cancel()).not.toThrow();
  });
});
