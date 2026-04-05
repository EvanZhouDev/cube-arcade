import { SessionCore } from "./session";
import type { SmartcubeMove, SmartcubeSimulatorSession } from "./types";

export function createSimulatorSmartcube(
  name = "Smartcube Simulator",
): SmartcubeSimulatorSession {
  const session = new SessionCore({
    disconnectImpl: async () => {},
    features: {
      battery: false,
      hardwareBluetooth: false,
      orientation: false,
      solvedResync: true,
    },
    mode: "simulator",
    name,
  });

  return {
    ...session,
    simulateMove(move: SmartcubeMove) {
      session.applyMove(move);
    },
    simulateSequence(moves: SmartcubeMove[]) {
      for (const move of moves) {
        session.applyMove(move);
      }
    },
  };
}
