export { create2048Game } from "./games/game2048";
export { createBreakoutGame } from "./games/breakout";
export { createSnakeGame } from "./games/snake";
export { createTetrisGame } from "./games/tetris";
export {
  ARCADE_GAME_IDS,
  assertGameId,
  createGameController,
} from "./registry";
export type {
  ArcadeGameId,
  ArcadeSnapshot,
  BreakoutSnapshot,
  Game2048Snapshot,
  GameControlHint,
  GameController,
  GameMeta,
  SnakeSnapshot,
  TetrisSnapshot,
} from "./types";
