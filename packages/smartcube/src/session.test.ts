import { describe, expect, it } from "vitest";

import {
  SOLVED_FACELETS,
  createSimulatorSmartcube,
  moveToCommand,
} from "./index";
import { SessionCore } from "./session";

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

  it("accepts external facelet sync and disconnect state", () => {
    const session = new SessionCore({
      disconnectImpl: async () => undefined,
      features: {
        battery: true,
        hardwareBluetooth: true,
        orientation: true,
        solvedResync: true,
      },
      mode: "hardware",
      name: "Hardware cube",
    });

    const facelets = `${SOLVED_FACELETS.slice(0, 8)}R${SOLVED_FACELETS.slice(9)}`;
    session.setFacelets(facelets);
    session.markDisconnected();

    expect(session.getState().facelets).toBe(facelets);
    expect(session.getState().connected).toBe(false);
  });
});
