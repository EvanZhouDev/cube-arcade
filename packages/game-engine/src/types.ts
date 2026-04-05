import type {
  BaseGameSnapshot,
  GameController,
  GameDefinition,
  GameMeta,
} from "@cube-arcade/game-sdk";

export type { CubeCommand, GameControlHint } from "@cube-arcade/game-sdk";

export interface SnakeSnapshot extends BaseGameSnapshot<"snake"> {
  food: {
    x: number;
    y: number;
  };
  grid: Array<Array<"empty" | "food" | "head" | "body">>;
  id: "snake";
  moveBudgetMs: number;
}

export interface Game2048Snapshot extends BaseGameSnapshot<"2048"> {
  board: number[][];
  id: "2048";
  maxTile: number;
}

export interface TetrisSnapshot extends BaseGameSnapshot<"tetris"> {
  board: (string | null)[][];
  id: "tetris";
  level: number;
  lines: number;
  nextQueue: string[];
}

export interface BreakoutSnapshot extends BaseGameSnapshot<"breakout"> {
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

export type ArcadeGameId = ArcadeSnapshot["id"];
export type ArcadeGameDefinition<TId extends ArcadeGameId = ArcadeGameId> =
  GameDefinition<TId, Extract<ArcadeSnapshot, { id: TId }>>;
export type ArcadeGameController<
  TSnapshot extends ArcadeSnapshot = ArcadeSnapshot,
> = GameController<TSnapshot>;
export type ArcadeGameMeta<TId extends ArcadeGameId = ArcadeGameId> =
  GameMeta<TId>;
