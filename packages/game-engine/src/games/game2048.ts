import {
  type GameController,
  type GameMeta,
  defineGame,
  isDirectionalCommand,
} from "@cube-arcade/game-sdk";

import { randomIndex } from "../random";
import type { Game2048Snapshot } from "../types";

interface State2048 {
  board: number[];
  gameOver: boolean;
  score: number;
  seed: number;
  won: boolean;
}

const SIZE = 4;

const META: GameMeta<"2048"> = {
  accent: "#f29f3a",
  controls: [
    { command: "left", effect: "Slide the board left", label: "Left" },
    { command: "right", effect: "Slide the board right", label: "Right" },
    { command: "up", effect: "Slide upward", label: "Up" },
    { command: "down", effect: "Slide downward", label: "Down" },
  ],
  description:
    "The cube becomes a directional pad for the cleanest 2048 implementation in the stack.",
  id: "2048",
  name: "2048",
  tagline: "Swipe logic translated into face turns.",
};

function spawnTile(board: number[], seed: number): [number[], number] {
  const openIndices = board
    .map((value, index) => ({ index, value }))
    .filter((entry) => entry.value === 0)
    .map((entry) => entry.index);

  if (openIndices.length === 0) {
    return [board, seed];
  }

  const indexResult = randomIndex(openIndices.length, seed);
  const valueResult = randomIndex(10, indexResult.nextSeed);
  const nextBoard = [...board];
  const targetIndex = openIndices[indexResult.value];
  if (typeof targetIndex === "number") {
    nextBoard[targetIndex] = valueResult.value === 0 ? 4 : 2;
  }
  return [nextBoard, valueResult.nextSeed];
}

function createInitialState(seed = 7): State2048 {
  let board = Array.from({ length: SIZE * SIZE }, () => 0);
  let nextSeed = seed;
  [board, nextSeed] = spawnTile(board, nextSeed);
  [board, nextSeed] = spawnTile(board, nextSeed);
  return {
    board,
    gameOver: false,
    score: 0,
    seed: nextSeed,
    won: false,
  };
}

function lineIndices(direction: "left" | "right" | "up" | "down"): number[][] {
  const rows = Array.from({ length: SIZE }, (_, index) => index);
  if (direction === "left" || direction === "right") {
    return rows.map((row) =>
      rows.map(
        (column) =>
          row * SIZE + (direction === "left" ? column : SIZE - 1 - column),
      ),
    );
  }
  return rows.map((column) =>
    rows.map(
      (row) => (direction === "up" ? row : SIZE - 1 - row) * SIZE + column,
    ),
  );
}

function slideLine(values: number[]): {
  moved: boolean;
  next: number[];
  score: number;
} {
  const filtered = values.filter(Boolean);
  const next: number[] = [];
  let score = 0;

  for (let index = 0; index < filtered.length; index += 1) {
    const current = filtered[index];
    if (typeof current !== "number") {
      continue;
    }
    const nextValue = filtered[index + 1];
    if (current === nextValue) {
      const merged = current * 2;
      next.push(merged);
      score += merged;
      index += 1;
    } else {
      next.push(current);
    }
  }

  while (next.length < SIZE) {
    next.push(0);
  }

  return {
    moved: next.some((value, index) => value !== values[index]),
    next,
    score,
  };
}

export const slideLineForTesting = slideLine;

function canMove(board: number[]): boolean {
  if (board.some((value) => value === 0)) {
    return true;
  }
  for (const direction of ["left", "right", "up", "down"] as const) {
    const moved = applyDirectionalMove(board, direction);
    if (moved.moved) {
      return true;
    }
  }
  return false;
}

function applyDirectionalMove(
  board: number[],
  direction: "left" | "right" | "up" | "down",
) {
  const nextBoard = [...board];
  let moved = false;
  let scoreDelta = 0;

  for (const indices of lineIndices(direction)) {
    const values = indices.map((index) => board[index] ?? 0);
    const result = slideLine(values);
    moved ||= result.moved;
    scoreDelta += result.score;
    indices.forEach((index, offset) => {
      nextBoard[index] = result.next[offset] ?? 0;
    });
  }

  return { moved, nextBoard, scoreDelta };
}

export function create2048Game(
  seed?: number,
): GameController<Game2048Snapshot> {
  let state = createInitialState(seed);

  function applyCommand(command: "left" | "right" | "up" | "down") {
    if (state.gameOver || state.won) {
      return;
    }
    const result = applyDirectionalMove(state.board, command);
    if (!result.moved) {
      return;
    }

    const [nextBoard, nextSeed] = spawnTile(result.nextBoard, state.seed);
    state = {
      board: nextBoard,
      gameOver: !canMove(nextBoard),
      score: state.score + result.scoreDelta,
      seed: nextSeed,
      won: nextBoard.some((value) => value >= 2048),
    };
  }

  return {
    getSnapshot() {
      return {
        board: Array.from({ length: SIZE }, (_, row) =>
          Array.from(
            { length: SIZE },
            (_, column) => state.board[row * SIZE + column] ?? 0,
          ),
        ),
        gameOver: state.gameOver,
        id: "2048",
        maxTile: Math.max(...state.board),
        name: META.name,
        score: state.score,
        won: state.won,
      };
    },
    handleCommand(command) {
      if (!isDirectionalCommand(command)) {
        return;
      }
      applyCommand(command);
    },
    handleInput({ command }) {
      if (!isDirectionalCommand(command)) {
        return;
      }
      applyCommand(command);
    },
    meta: META,
    reset(nextSeed?: number) {
      state = createInitialState(nextSeed);
    },
    tick() {},
  };
}

export const game2048 = defineGame({
  create: create2048Game,
  meta: META,
});
