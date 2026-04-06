export {
  createGameRegistry,
  defineGame,
  dispatchGameInput,
  isDirectionalCommand,
} from "@cube-arcade/game-sdk";
export type {
  BaseGameSnapshot,
  CubeCommand,
  CubeFeatures,
  CubeMode,
  CubeMove,
  CubeState,
  DirectionalCubeCommand,
  FaceName,
  GameControlHint,
  GameController,
  GameDefinition,
  GameInput,
  GameMeta,
  GameSnapshotBase,
  Quaternion,
} from "@cube-arcade/game-sdk";
export { create2048Game, game2048 } from "./games/game2048";
export { createSnakeGame, snakeGame } from "./games/snake";
export { createTetrisGame, tetrisGame } from "./games/tetris";
export {
  ARCADE_GAMES,
  ARCADE_GAME_IDS,
  assertGameId,
  createGameController,
  getArcadeGameDefinition,
} from "./registry";
export type {
  ArcadeGameController,
  ArcadeGameDefinition,
  ArcadeGameId,
  ArcadeGameMeta,
  ArcadeSnapshot,
  Game2048Snapshot,
  SnakeSnapshot,
  TetrisSnapshot,
} from "./types";
