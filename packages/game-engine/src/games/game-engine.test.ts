import { describe, expect, it } from "vitest";

import { createBreakoutGame } from "./breakout";
import { slideLineForTesting } from "./game2048";
import { createSnakeGame } from "./snake";
import { createTetrisGame } from "./tetris";

describe("game engine", () => {
  it("waits for input before snake starts moving", () => {
    const game = createSnakeGame(2);
    game.tick(160);
    let snapshot = game.getSnapshot();

    expect(snapshot.awaitingStart).toBe(true);
    expect(snapshot.grid[7]?.[5]).toBe("head");

    game.handleCommand("down");
    snapshot = game.getSnapshot();
    expect(snapshot.awaitingStart).toBe(false);

    game.tick(160);
    snapshot = game.getSnapshot();
    expect(snapshot.grid[8]?.[5]).toBe("head");
  });

  it("restarts snake on the next turn after game over", () => {
    const game = createSnakeGame(2);

    game.handleCommand("up");
    for (let index = 0; index < 8; index += 1) {
      game.tick(160);
    }

    let snapshot = game.getSnapshot();
    expect(snapshot.gameOver).toBe(true);

    game.handleCommand("left");
    snapshot = game.getSnapshot();
    expect(snapshot.gameOver).toBe(false);
    expect(snapshot.awaitingStart).toBe(false);
    expect(snapshot.grid[7]?.[5]).toBe("head");
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
