"use client";

import {
  type ArcadeGameId,
  type ArcadeSnapshot,
  type GameController,
  type GameMeta,
  createGameController,
} from "@cube-arcade/game-engine";
import {
  type CubeCommand,
  SOLVED_FACELETS,
  type SmartcubeSession,
  type SmartcubeSimulatorSession,
  type SmartcubeState,
  canUseBrowserBluetooth,
  connectBrowserSmartcube,
  connectGanBrowserSmartcube,
  createSimulatorSmartcube,
} from "@cube-arcade/smartcube";
import { create } from "zustand";

type Session = SmartcubeSession | SmartcubeSimulatorSession;

interface ArcadeStore {
  bluetoothAvailable: boolean | null;
  connectHardware: () => Promise<void>;
  connectGanHardware: (manualMacAddress?: string) => Promise<void>;
  connectSimulator: () => Promise<void>;
  controller: GameController;
  cubeState: SmartcubeState;
  disconnect: () => Promise<void>;
  error: string | null;
  gameId: ArcadeGameId;
  meta: GameMeta;
  paused: boolean;
  refreshBluetoothAvailability: () => void;
  resetGame: () => void;
  resyncCube: () => void;
  selectGame: (gameId: ArcadeGameId) => void;
  session: Session | null;
  simulateMove: (move: string) => void;
  snapshot: ArcadeSnapshot;
  tick: (deltaMs: number) => void;
}

const initialController = createGameController("snake", 17);

const initialCubeState: SmartcubeState = {
  batteryLevel: null,
  connected: false,
  facelets: SOLVED_FACELETS,
  features: {
    battery: false,
    hardwareBluetooth: false,
    orientation: false,
    solvedResync: true,
  },
  lastCommand: null,
  lastEventAt: null,
  lastMove: null,
  mode: "simulator",
  moveHistory: [],
  name: "No smartcube connected",
  orientation: null,
};

let unsubscribeCube: (() => void) | null = null;

function createInitialController() {
  return createGameController("snake", 17);
}

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown smartcube error.";
}

export const useArcadeStore = create<ArcadeStore>((set, get) => {
  function syncSnapshot(controller: GameController) {
    set({
      meta: controller.meta,
      snapshot: controller.getSnapshot(),
    });
  }

  function dispatchCommand(command: CubeCommand) {
    if (command === "pause") {
      set((state) => ({
        paused: !state.paused,
      }));
      return;
    }
    const controller = get().controller;
    controller.handleCommand(command);
    syncSnapshot(controller);
  }

  async function attachSession(session: Session): Promise<void> {
    unsubscribeCube?.();
    unsubscribeCube = session.subscribe((cubeState) => {
      const lastEventAt = get().cubeState.lastEventAt;
      set({
        cubeState,
        error: null,
        session,
      });
      if (
        cubeState.lastEventAt &&
        cubeState.lastEventAt !== lastEventAt &&
        cubeState.lastCommand
      ) {
        dispatchCommand(cubeState.lastCommand);
      }
    });
  }

  return {
    bluetoothAvailable: null,
    async connectHardware() {
      try {
        const existing = get().session;
        if (existing) {
          await existing.disconnect();
        }
        const session = await connectBrowserSmartcube();
        await attachSession(session);
      } catch (error) {
        set({
          error: messageFromError(error),
        });
      }
    },
    async connectGanHardware(manualMacAddress) {
      try {
        const existing = get().session;
        if (existing) {
          await existing.disconnect();
        }
        const session = await connectGanBrowserSmartcube(manualMacAddress);
        await attachSession(session);
      } catch (error) {
        set({
          error: messageFromError(error),
        });
      }
    },
    async connectSimulator() {
      const existing = get().session;
      if (existing) {
        await existing.disconnect();
      }
      const session = createSimulatorSmartcube();
      await attachSession(session);
    },
    controller: initialController,
    cubeState: initialCubeState,
    async disconnect() {
      unsubscribeCube?.();
      unsubscribeCube = null;
      const session = get().session;
      if (session) {
        await session.disconnect();
      }
      set({
        cubeState: initialCubeState,
        session: null,
      });
    },
    error: null,
    gameId: "snake",
    meta: initialController.meta,
    paused: false,
    refreshBluetoothAvailability() {
      set({
        bluetoothAvailable: canUseBrowserBluetooth(),
      });
    },
    resetGame() {
      const controller = get().controller;
      controller.reset(Date.now());
      syncSnapshot(controller);
    },
    resyncCube() {
      const session = get().session;
      session?.resyncToSolved();
    },
    selectGame(gameId) {
      const controller = createGameController(gameId, Date.now());
      set({
        controller,
        gameId,
        meta: controller.meta,
        snapshot: controller.getSnapshot(),
      });
    },
    session: null,
    simulateMove(move) {
      const session = get().session;
      if (session && "simulateMove" in session) {
        session.simulateMove(
          move as Parameters<SmartcubeSimulatorSession["simulateMove"]>[0],
        );
      }
    },
    snapshot: initialController.getSnapshot(),
    tick(deltaMs) {
      if (get().paused) {
        return;
      }
      const controller = get().controller;
      controller.tick(deltaMs);
      syncSnapshot(controller);
    },
  };
});

export function resetArcadeStoreForTests(): void {
  unsubscribeCube?.();
  unsubscribeCube = null;
  const controller = createInitialController();
  useArcadeStore.setState({
    bluetoothAvailable: null,
    controller,
    cubeState: initialCubeState,
    error: null,
    gameId: "snake",
    meta: controller.meta,
    paused: false,
    session: null,
    snapshot: controller.getSnapshot(),
  });
}
