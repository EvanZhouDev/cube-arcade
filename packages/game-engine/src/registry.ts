import { createGameRegistry } from "@cube-arcade/game-sdk";

import { game2048 } from "./games/game2048";
import { snakeGame } from "./games/snake";
import { tetrisGame } from "./games/tetris";
import type {
  ArcadeGameController,
  ArcadeGameDefinition,
  ArcadeGameId,
} from "./types";

const arcadeGameDefinitions = {
  "2048": game2048,
  snake: snakeGame,
  tetris: tetrisGame,
} as const satisfies Record<ArcadeGameId, ArcadeGameDefinition>;

const arcadeGameRegistry = createGameRegistry(arcadeGameDefinitions);

export const ARCADE_GAMES = [
  snakeGame,
  game2048,
  tetrisGame,
] as const satisfies readonly ArcadeGameDefinition[];

export const ARCADE_GAME_IDS = arcadeGameRegistry.ids;

export function createGameController(
  id: ArcadeGameId,
  seed?: number,
): ArcadeGameController {
  return arcadeGameRegistry.create(id, seed) as ArcadeGameController;
}

export function getArcadeGameDefinition(
  id: ArcadeGameId,
): ArcadeGameDefinition {
  return arcadeGameRegistry.getDefinition(id) as ArcadeGameDefinition;
}

export function assertGameId(value: string): ArcadeGameId {
  return arcadeGameRegistry.assertId(value);
}
