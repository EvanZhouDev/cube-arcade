import { beforeEach, describe, expect, it } from "vitest";

import { resetArcadeStoreForTests, useArcadeStore } from "./arcade-store";

describe("arcade store", () => {
  beforeEach(async () => {
    resetArcadeStoreForTests();
    await useArcadeStore.getState().disconnect();
  });

  it("connects the simulator and translates cube turns into commands", async () => {
    await useArcadeStore.getState().connectSimulator();
    useArcadeStore.getState().simulateMove("U");

    const state = useArcadeStore.getState();
    expect(state.cubeState.connected).toBe(true);
    expect(state.cubeState.lastCommand).toBe("right");
    expect(state.cubeState.lastMove).toBe("U");
  });

  it("switches games through the shared store", () => {
    useArcadeStore.getState().selectGame("tetris");
    const state = useArcadeStore.getState();
    expect(state.gameId).toBe("tetris");
    expect(state.meta.name).toBe("Tetris");
  });
});
