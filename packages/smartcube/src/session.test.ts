import { describe, expect, it } from "vitest";

import { createSimulatorSmartcube, moveToCommand } from "./index";

describe("smartcube session", () => {
  it("maps quarter turns to commands", () => {
    expect(moveToCommand("U")).toBe("right");
    expect(moveToCommand("U'")).toBe("left");
    expect(moveToCommand("F2")).toBe("pause");
  });

  it("tracks move history in the simulator", () => {
    const session = createSimulatorSmartcube();
    session.simulateSequence(["U", "R", "F"]);
    expect(session.getState().moveHistory).toEqual(["U", "R", "F"]);
    expect(session.getState().lastCommand).toBe("primary");
  });
});
