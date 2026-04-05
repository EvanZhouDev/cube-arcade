import type {
  CubeCommand,
  CubeFeatures,
  CubeMode,
  CubeMove,
  CubeState,
  FaceName,
  Quaternion,
} from "@cube-arcade/game-sdk";

export type { CubeCommand, FaceName, Quaternion } from "@cube-arcade/game-sdk";

export type SmartcubeMove = CubeMove;
export type SmartcubeMode = CubeMode;
export type SmartcubeFeatures = CubeFeatures;
export type SmartcubeState = CubeState;

export interface SmartcubeSession {
  disconnect: () => Promise<void>;
  getState: () => SmartcubeState;
  resyncToSolved: () => void;
  subscribe: (listener: SmartcubeStateListener) => () => void;
}

export interface SmartcubeSimulatorSession extends SmartcubeSession {
  simulateMove: (move: SmartcubeMove) => void;
  simulateSequence: (moves: SmartcubeMove[]) => void;
}

export type SmartcubeStateListener = (state: SmartcubeState) => void;

export interface CommandBinding {
  command: CubeCommand;
  description: string;
  face: FaceName;
  faceColor: string;
  faceLabel: string;
  move: SmartcubeMove;
  turn: "clockwise" | "counterclockwise" | "double";
}
