export type ArcadeGameId = "snake" | "2048" | "tetris" | "breakout";
export type CubeCommand =
  | "left"
  | "right"
  | "up"
  | "down"
  | "primary"
  | "secondary"
  | "pause";

export interface GameControlHint {
  command: CubeCommand;
  effect: string;
  label: string;
}

export interface GameMeta {
  accent: string;
  controls: GameControlHint[];
  description: string;
  id: ArcadeGameId;
  name: string;
  tagline: string;
}

export interface BaseGameSnapshot {
  gameOver: boolean;
  id: ArcadeGameId;
  name: string;
  score: number;
  won: boolean;
}

export interface SnakeSnapshot extends BaseGameSnapshot {
  food: {
    x: number;
    y: number;
  };
  grid: Array<Array<"empty" | "food" | "head" | "body">>;
  id: "snake";
  moveBudgetMs: number;
}

export interface Game2048Snapshot extends BaseGameSnapshot {
  board: number[][];
  id: "2048";
  maxTile: number;
}

export interface TetrisSnapshot extends BaseGameSnapshot {
  board: (string | null)[][];
  id: "tetris";
  level: number;
  lines: number;
  nextQueue: string[];
}

export interface BreakoutSnapshot extends BaseGameSnapshot {
  ball: {
    active: boolean;
    x: number;
    y: number;
  };
  bricks: Array<{
    alive: boolean;
    color: string;
    id: string;
    x: number;
    y: number;
  }>;
  id: "breakout";
  lives: number;
  paddle: {
    width: number;
    x: number;
  };
}

export type ArcadeSnapshot =
  | SnakeSnapshot
  | Game2048Snapshot
  | TetrisSnapshot
  | BreakoutSnapshot;

export interface GameController<
  TSnapshot extends ArcadeSnapshot = ArcadeSnapshot,
> {
  getSnapshot: () => TSnapshot;
  handleCommand: (command: CubeCommand) => void;
  meta: GameMeta;
  reset: (seed?: number) => void;
  tick: (deltaMs: number) => void;
}
