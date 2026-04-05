import {
  type ArcadeGameId,
  type ArcadeSnapshot,
  createGameController,
  dispatchGameInput,
} from "@cube-arcade/game-engine";
import {
  type SmartcubeMove,
  type SmartcubeState,
  createSimulatorSmartcube,
} from "@cube-arcade/smartcube";

export function createSimulatorHarness(gameId: ArcadeGameId, seed = 101) {
  const controller = createGameController(gameId, seed);
  const smartcube = createSimulatorSmartcube();
  let lastEventAt: number | null = null;
  let latestCubeState: SmartcubeState = smartcube.getState();

  smartcube.subscribe((cubeState) => {
    latestCubeState = cubeState;
    if (cubeState.lastEventAt && cubeState.lastEventAt !== lastEventAt) {
      lastEventAt = cubeState.lastEventAt;
      if (cubeState.lastCommand) {
        dispatchGameInput(controller, {
          command: cubeState.lastCommand,
          cube: cubeState,
          receivedAt: cubeState.lastEventAt,
          sourceMove: cubeState.lastMove,
        });
      }
    }
  });

  return {
    cubeState: () => latestCubeState,
    snapshot: (): ArcadeSnapshot => controller.getSnapshot(),
    tick: (deltaMs: number) => controller.tick(deltaMs),
    turn: (move: SmartcubeMove) => smartcube.simulateMove(move),
  };
}
