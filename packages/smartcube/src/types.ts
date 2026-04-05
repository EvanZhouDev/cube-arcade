export type FaceName = "U" | "R" | "F" | "D" | "L" | "B";

export type SmartcubeMove =
  | "U"
  | "U'"
  | "U2"
  | "R"
  | "R'"
  | "R2"
  | "F"
  | "F'"
  | "F2"
  | "D"
  | "D'"
  | "D2"
  | "L"
  | "L'"
  | "L2"
  | "B"
  | "B'"
  | "B2";

export type CubeCommand =
  | "left"
  | "right"
  | "up"
  | "down"
  | "primary"
  | "secondary"
  | "pause";

export type SmartcubeMode = "hardware" | "simulator";

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface SmartcubeFeatures {
  battery: boolean;
  hardwareBluetooth: boolean;
  orientation: boolean;
  solvedResync: boolean;
}

export interface SmartcubeState {
  batteryLevel: number | null;
  connected: boolean;
  facelets: string;
  features: SmartcubeFeatures;
  lastCommand: CubeCommand | null;
  lastEventAt: number | null;
  lastMove: SmartcubeMove | null;
  mode: SmartcubeMode;
  moveHistory: SmartcubeMove[];
  name: string;
  orientation: Quaternion | null;
}

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
