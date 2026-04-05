export type FaceName = "U" | "R" | "F" | "D" | "L" | "B";

export type CubeMove =
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

export type DirectionalCubeCommand = Extract<
  CubeCommand,
  "left" | "right" | "up" | "down"
>;

export type CubeMode = "hardware" | "simulator";

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface CubeFeatures {
  battery: boolean;
  hardwareBluetooth: boolean;
  orientation: boolean;
  solvedResync: boolean;
}

export interface CubeState {
  batteryLevel: number | null;
  connected: boolean;
  facelets: string;
  features: CubeFeatures;
  lastCommand: CubeCommand | null;
  lastEventAt: number | null;
  lastMove: CubeMove | null;
  mode: CubeMode;
  moveHistory: CubeMove[];
  name: string;
  orientation: Quaternion | null;
}

export interface GameInput {
  command: CubeCommand;
  cube: CubeState;
  receivedAt: number;
  sourceMove: CubeMove | null;
}

export interface GameControlHint {
  command: CubeCommand;
  effect: string;
  label: string;
}

export interface GameMeta<TGameId extends string = string> {
  accent: string;
  controls: GameControlHint[];
  description: string;
  id: TGameId;
  name: string;
  tagline: string;
}

export interface GameSnapshotBase<TGameId extends string = string> {
  gameOver: boolean;
  id: TGameId;
  name: string;
  score: number;
  won: boolean;
}

export type BaseGameSnapshot<TGameId extends string = string> =
  GameSnapshotBase<TGameId>;

export interface GameController<
  TSnapshot extends GameSnapshotBase = GameSnapshotBase,
> {
  getSnapshot: () => TSnapshot;
  handleCommand: (command: CubeCommand) => void;
  handleInput?: (input: GameInput) => void;
  meta: GameMeta<TSnapshot["id"]>;
  reset: (seed?: number) => void;
  tick: (deltaMs: number) => void;
}

export interface GameDefinition<
  TGameId extends string = string,
  TSnapshot extends GameSnapshotBase<TGameId> = GameSnapshotBase<TGameId>,
> {
  create: (seed?: number) => GameController<TSnapshot>;
  meta: GameMeta<TGameId>;
}

export function defineGame<
  TGameId extends string,
  TSnapshot extends GameSnapshotBase<TGameId>,
>(definition: GameDefinition<TGameId, TSnapshot>) {
  return definition;
}
