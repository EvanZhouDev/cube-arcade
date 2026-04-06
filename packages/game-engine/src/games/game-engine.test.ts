import { describe, expect, it } from "vitest";

import {
  type Game2048TestState,
  apply2048CommandForTesting,
  slideLineForTesting,
} from "./game2048";
import { createSnakeGame } from "./snake";
import {
  type TetrisTestState,
  applyTetrisCommandForTesting,
  createTetrisGame,
  rotateTetrisStateForTesting,
} from "./tetris";

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
    expect(snapshot.awaitingStart).toBe(true);
    expect(snapshot.grid[7]?.[5]).toBe("head");
    expect(snapshot.score).toBe(0);

    game.handleCommand("left");
    snapshot = game.getSnapshot();
    expect(snapshot.awaitingStart).toBe(false);
  });

  it("ignores reversing snake into itself while already moving", () => {
    const game = createSnakeGame(2);

    game.handleCommand("right");
    game.tick(160);
    game.handleCommand("left");
    game.tick(160);

    const snapshot = game.getSnapshot();
    expect(snapshot.gameOver).toBe(false);
    expect(snapshot.grid[7]?.[7]).toBe("head");
  });

  it("merges 2048 rows and reports the merge score", () => {
    const merged = slideLineForTesting([2, 2, 4, 0]);
    expect(merged.next).toEqual([4, 4, 0, 0]);
    expect(merged.score).toBe(4);
  });

  it("restarts 2048 on the next move after no moves remain", () => {
    const state: Game2048TestState = {
      board: [
        2, 4, 2, 4,
        4, 2, 4, 2,
        2, 4, 2, 4,
        4, 2, 4, 2,
      ],
      gameOver: true,
      score: 640,
      seed: 9,
      won: false,
    };

    const restarted = apply2048CommandForTesting(state, "left");

    expect(restarted.gameOver).toBe(false);
    expect(restarted.score).toBe(0);
    expect(restarted.won).toBe(false);
    expect(restarted.board.filter((value) => value !== 0)).toHaveLength(2);
  });

  it("hard drops a Tetris piece into the stack", () => {
    const game = createTetrisGame(5);
    game.handleCommand("up");
    const snapshot = game.getSnapshot();
    const occupied = snapshot.board.flat().filter(Boolean);
    expect(occupied.length).toBeGreaterThan(0);
  });

  it("waits for input before Tetris starts falling", () => {
    const game = createTetrisGame(5);
    const initial = game.getSnapshot();

    game.tick(5_000);
    let snapshot = game.getSnapshot();
    expect(snapshot.awaitingStart).toBe(true);
    expect(snapshot.board).toEqual(initial.board);

    game.handleCommand("left");
    snapshot = game.getSnapshot();
    expect(snapshot.awaitingStart).toBe(false);
    expect(snapshot.board).not.toEqual(initial.board);
  });

  it("restarts Tetris directly into play on the next turn after game over", () => {
    const state: TetrisTestState = {
      accumulatorMs: 0,
      active: {
        rotation: 0,
        type: "T",
        x: 5,
        y: 0,
      },
      awaitingStart: false,
      bag: [],
      board: Array.from({ length: 20 }, () =>
        Array.from({ length: 10 }, () => null),
      ),
      gameOver: true,
      level: 3,
      lines: 17,
      nextQueue: ["I", "O", "L"],
      score: 4200,
      seed: 11,
      won: false,
    };

    const restarted = applyTetrisCommandForTesting(state, "left");

    expect(restarted.gameOver).toBe(false);
    expect(restarted.awaitingStart).toBe(false);
    expect(restarted.level).toBe(1);
    expect(restarted.lines).toBe(0);
    expect(restarted.score).toBe(0);
    expect(restarted.active.x).toBe(2);
  });

  it("uses wall kicks when rotating a Tetris piece near the wall", () => {
    const state: TetrisTestState = {
      accumulatorMs: 0,
      active: {
        rotation: 1,
        type: "I",
        x: 7,
        y: 0,
      },
      awaitingStart: false,
      bag: [],
      board: Array.from({ length: 20 }, () =>
        Array.from({ length: 10 }, () => null),
      ),
      gameOver: false,
      level: 1,
      lines: 0,
      nextQueue: [],
      score: 0,
      seed: 1,
      won: false,
    };

    const rotated = rotateTetrisStateForTesting(state, -1);

    expect(rotated.active.rotation).toBe(0);
    expect(rotated.active.x).toBe(6);
  });
});
