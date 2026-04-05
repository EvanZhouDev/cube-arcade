import { describe, expect, it } from "vitest";

import { createSimulatorHarness } from "./index";

describe("simulator harness", () => {
  it("forwards simulator turns into the active game controller", () => {
    const harness = createSimulatorHarness("snake", 19);
    harness.turn("U");
    harness.tick(160);
    expect(harness.snapshot().score).toBeGreaterThanOrEqual(0);
    expect(harness.cubeState().lastMove).toBe("U");
  });
});
