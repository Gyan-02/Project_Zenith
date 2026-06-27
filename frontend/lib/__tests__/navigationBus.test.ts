import { describe, expect, it, vi } from "vitest";
import { createNavigationBus } from "../navigationBus";

describe("navigationBus", () => {
  it("publishes authoritative targets and supports unsubscribe", () => {
    const bus = createNavigationBus();
    const listener = vi.fn();
    const unsubscribe = bus.subscribe(listener);
    const saturn = { kind: "planet" as const, id: "saturn", label: "Saturn" };

    bus.publish(saturn);
    expect(bus.current()).toEqual(saturn);
    expect(listener).toHaveBeenLastCalledWith(saturn);

    unsubscribe();
    bus.clear();
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
