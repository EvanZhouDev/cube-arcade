import {
  type GameController,
  type GameMeta,
  defineGame,
  isDirectionalCommand,
} from "@cube-arcade/game-sdk";

import { randomIndex } from "../random";
import type { SnakeSnapshot } from "../types";

interface Point {
  x: number;
  y: number;
}

type Direction = "up" | "down" | "left" | "right";

interface SnakeState {
  accumulatorMs: number;
  direction: Direction;
  food: Point;
  gameOver: boolean;
  score: number;
  seed: number;
  segments: Point[];
  won: boolean;
}

const WIDTH = 14;
const HEIGHT = 14;
const STEP_MS = 150;

const META: GameMeta<"snake"> = {
  accent: "#57d163",
  controls: [
    { command: "left", effect: "Steer left", label: "Left" },
    { command: "right", effect: "Steer right", label: "Right" },
    { command: "up", effect: "Climb upward", label: "Up" },
    { command: "down", effect: "Dive downward", label: "Down" },
  ],
  description:
    "A clean grid-runner that turns white and red face twists into four-direction movement.",
  id: "snake",
  name: "Snake",
  tagline: "Classic routing with cube-face steering.",
};

function createInitialState(seed = 1): SnakeState {
  const base: SnakeState = {
    accumulatorMs: 0,
    direction: "right",
    food: { x: 0, y: 0 },
    gameOver: false,
    score: 0,
    seed,
    segments: [
      { x: 5, y: 7 },
      { x: 4, y: 7 },
      { x: 3, y: 7 },
    ],
    won: false,
  };
  const [food, nextSeed] = placeFood(base.segments, seed);
  return {
    ...base,
    food,
    seed: nextSeed,
  };
}

function placeFood(segments: Point[], seed: number): [Point, number] {
  const occupied = new Set(
    segments.map((segment) => `${segment.x},${segment.y}`),
  );
  const options: Point[] = [];
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      if (!occupied.has(`${x},${y}`)) {
        options.push({ x, y });
      }
    }
  }

  if (options.length === 0) {
    return [{ x: 0, y: 0 }, seed];
  }

  const result = randomIndex(options.length, seed);
  const choice = options[result.value] ?? options[0] ?? { x: 0, y: 0 };
  return [choice, result.nextSeed];
}

function getNextHead(head: Point, direction: Direction): Point {
  switch (direction) {
    case "down":
      return { x: head.x, y: head.y + 1 };
    case "left":
      return { x: head.x - 1, y: head.y };
    case "right":
      return { x: head.x + 1, y: head.y };
    case "up":
      return { x: head.x, y: head.y - 1 };
  }
}

function isOpposite(current: Direction, next: Direction): boolean {
  return (
    (current === "left" && next === "right") ||
    (current === "right" && next === "left") ||
    (current === "up" && next === "down") ||
    (current === "down" && next === "up")
  );
}

function applyStep(state: SnakeState): SnakeState {
  if (state.gameOver || state.won) {
    return state;
  }

  const head = state.segments[0];
  if (!head) {
    return state;
  }
  const nextHead = getNextHead(head, state.direction);
  const ateFood = nextHead.x === state.food.x && nextHead.y === state.food.y;
  const outOfBounds =
    nextHead.x < 0 ||
    nextHead.x >= WIDTH ||
    nextHead.y < 0 ||
    nextHead.y >= HEIGHT;
  const relevantSegments = ateFood
    ? state.segments
    : state.segments.slice(0, -1);
  const hitsSelf = relevantSegments.some(
    (segment) => segment.x === nextHead.x && segment.y === nextHead.y,
  );

  if (outOfBounds || hitsSelf) {
    return {
      ...state,
      gameOver: true,
    };
  }

  const nextSegments = [nextHead, ...state.segments];
  if (!ateFood) {
    nextSegments.pop();
  }

  if (ateFood) {
    const [food, nextSeed] = placeFood(nextSegments, state.seed);
    return {
      ...state,
      food,
      score: state.score + 10,
      seed: nextSeed,
      segments: nextSegments,
      won: nextSegments.length === WIDTH * HEIGHT,
    };
  }

  return {
    ...state,
    segments: nextSegments,
  };
}

function renderGrid(state: SnakeState): SnakeSnapshot["grid"] {
  const grid = Array.from({ length: HEIGHT }, () =>
    Array.from(
      { length: WIDTH },
      (): "empty" | "food" | "head" | "body" => "empty",
    ),
  );
  const foodRow = grid[state.food.y];
  if (foodRow) {
    foodRow[state.food.x] = "food";
  }
  state.segments.forEach((segment, index) => {
    const row = grid[segment.y];
    if (row) {
      row[segment.x] = index === 0 ? "head" : "body";
    }
  });
  return grid;
}

export const snakeGame = defineGame({
  create(seed?: number): GameController<SnakeSnapshot> {
    let state = createInitialState(seed);

    return {
      getSnapshot() {
        return {
          food: state.food,
          gameOver: state.gameOver,
          grid: renderGrid(state),
          id: "snake",
          moveBudgetMs: STEP_MS,
          name: META.name,
          score: state.score,
          won: state.won,
        };
      },
      handleCommand(command) {
        if (
          !isDirectionalCommand(command) ||
          isOpposite(state.direction, command)
        ) {
          return;
        }
        state = {
          ...state,
          direction: command,
        };
      },
      handleInput({ command }) {
        if (
          !isDirectionalCommand(command) ||
          isOpposite(state.direction, command)
        ) {
          return;
        }
        state = {
          ...state,
          direction: command,
        };
      },
      meta: META,
      reset(nextSeed?: number) {
        state = createInitialState(nextSeed);
      },
      tick(deltaMs: number) {
        if (state.gameOver || state.won) {
          return;
        }
        let accumulatorMs = state.accumulatorMs + deltaMs;
        while (accumulatorMs >= STEP_MS) {
          accumulatorMs -= STEP_MS;
          state = applyStep({
            ...state,
            accumulatorMs,
          });
        }
        state = {
          ...state,
          accumulatorMs,
        };
      },
    };
  },
  meta: META,
});

export function createSnakeGame(seed?: number): GameController<SnakeSnapshot> {
  return snakeGame.create(seed);
}
