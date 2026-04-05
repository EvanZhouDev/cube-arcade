import { describe, expect, it } from "vitest";

import { createBreakoutGame } from "./breakout";
import { slideLineForTesting } from "./game2048";
import { createSnakeGame } from "./snake";
import { createTetrisGame } from "./tetris";

describe("game engine", () => {
  it("advances snake in the current direction", () => {
    const game = createSnakeGame(2);
    game.tick(160);
    const snapshot = game.getSnapshot();
    expect(snapshot.grid[7]?.[6]).toBe("head");
  });

  it("merges 2048 rows and reports the merge score", () => {
    const merged = slideLineForTesting([2, 2, 4, 0]);
    expect(merged.next).toEqual([4, 4, 0, 0]);
    expect(merged.score).toBe(4);
  });

  it("hard drops a Tetris piece into the stack", () => {
    const game = createTetrisGame(5);
    game.handleCommand("up");
    const snapshot = game.getSnapshot();
    const occupied = snapshot.board.flat().filter(Boolean);
    expect(occupied.length).toBeGreaterThan(0);
  });

  it("launches and advances breakout ball", () => {
    const game = createBreakoutGame();
    game.handleCommand("primary");
    game.tick(100);
    const snapshot = game.getSnapshot();
    expect(snapshot.ball.active).toBe(true);
    expect(snapshot.ball.y).toBeLessThan(14);
  });
});
