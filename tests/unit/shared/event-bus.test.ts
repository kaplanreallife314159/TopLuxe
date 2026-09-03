import { describe, it, expect, vi } from 'vitest';
import { eventBus } from '../../../apps/web/shared/events/EventBus';

describe('EventBus (in-memory)', () => {
  it('invokes a subscribed handler when the corresponding event is published', async () => {
    const handler = vi.fn();
    eventBus.subscribe('test.event', handler);

    await eventBus.publish('test.event', { hello: 'world' });

    expect(handler).toHaveBeenCalledWith({ hello: 'world' });
  });

  it('does not invoke handlers subscribed to a different event name', async () => {
    const handler = vi.fn();
    eventBus.subscribe('test.other-event', handler);

    await eventBus.publish('test.unrelated-event', { foo: 'bar' });

    expect(handler).not.toHaveBeenCalled();
  });
});
