import { z } from "zod";

import { createBreakoutGame } from "./games/breakout";
import { create2048Game } from "./games/game2048";
import { createSnakeGame } from "./games/snake";
import { createTetrisGame } from "./games/tetris";
import type { ArcadeGameId, GameController } from "./types";

const gameIdSchema = z.enum(["snake", "2048", "tetris", "breakout"]);

export const ARCADE_GAME_IDS = gameIdSchema.options;

export function createGameController(
  id: ArcadeGameId,
  seed?: number,
): GameController {
  switch (id) {
    case "2048":
      return create2048Game(seed);
    case "breakout":
      return createBreakoutGame();
    case "snake":
      return createSnakeGame(seed);
    case "tetris":
      return createTetrisGame(seed);
  }
}

export function assertGameId(value: string): ArcadeGameId {
  return gameIdSchema.parse(value);
}
