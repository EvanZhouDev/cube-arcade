import {
  type CubeCommand,
  type GameController,
  type GameMeta,
  defineGame,
} from "@cube-arcade/game-sdk";

import { randomIndex } from "../random";
import type { TetrisSnapshot } from "../types";

type TetrominoType = "I" | "J" | "L" | "O" | "S" | "T" | "Z";
type Cell = [number, number];

interface ActivePiece {
  rotation: number;
  type: TetrominoType;
  x: number;
  y: number;
}

interface TetrisState {
  accumulatorMs: number;
  active: ActivePiece;
  bag: TetrominoType[];
  board: (TetrominoType | null)[][];
  gameOver: boolean;
  level: number;
  lines: number;
  nextQueue: TetrominoType[];
  score: number;
  seed: number;
  won: boolean;
}

const WIDTH = 10;
const HEIGHT = 20;

const SHAPES: Record<TetrominoType, Cell[][]> = {
  I: [
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
    ],
    [
      [2, 0],
      [2, 1],
      [2, 2],
      [2, 3],
    ],
  ],
  J: [
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [2, 0],
      [1, 1],
      [1, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [2, 2],
    ],
    [
      [1, 0],
      [1, 1],
      [0, 2],
      [1, 2],
    ],
  ],
  L: [
    [
      [2, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [1, 1],
      [1, 2],
      [2, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [0, 2],
    ],
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [1, 2],
    ],
  ],
  O: [
    [
      [1, 0],
      [2, 0],
      [1, 1],
      [2, 1],
    ],
  ],
  S: [
    [
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
    ],
    [
      [1, 0],
      [1, 1],
      [2, 1],
      [2, 2],
    ],
  ],
  T: [
    [
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
    [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, 2],
    ],
  ],
  Z: [
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
    [
      [2, 0],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
  ],
};

const COLORS: Record<TetrominoType, string> = {
  I: "#49c6f3",
  J: "#4060ff",
  L: "#f18a25",
  O: "#f6d74f",
  S: "#69d35d",
  T: "#ac65ff",
  Z: "#ef5955",
};

const META: GameMeta<"tetris"> = {
  accent: "#8f63ff",
  controls: [
    { command: "left", effect: "Shift the piece left", label: "Move left" },
    { command: "right", effect: "Shift the piece right", label: "Move right" },
    { command: "down", effect: "Soft drop by one row", label: "Soft drop" },
    { command: "up", effect: "Hard drop instantly", label: "Hard drop" },
    { command: "primary", effect: "Rotate clockwise", label: "Rotate CW" },
    {
      command: "secondary",
      effect: "Rotate counterclockwise",
      label: "Rotate CCW",
    },
  ],
  description:
    "Stack falling pieces, burn lines cleanly, and keep the well from topping out.",
  id: "tetris",
  name: "Tetris",
  tagline: "A real ruleset with bag randomization and line clears.",
};

function emptyBoard(): (TetrominoType | null)[][] {
  return Array.from({ length: HEIGHT }, () =>
    Array.from({ length: WIDTH }, () => null),
  );
}

function cellsForPiece(piece: ActivePiece): Cell[] {
  const rotations = SHAPES[piece.type];
  const shape =
    rotations[piece.rotation % rotations.length] ?? rotations[0] ?? [];
  return shape.map(([x, y]) => [piece.x + x, piece.y + y]);
}

function collides(
  board: (TetrominoType | null)[][],
  piece: ActivePiece,
): boolean {
  return cellsForPiece(piece).some(([x, y]) => {
    return (
      x < 0 || x >= WIDTH || y >= HEIGHT || (y >= 0 && board[y]?.[x] !== null)
    );
  });
}

function refillBag(seed: number): { bag: TetrominoType[]; seed: number } {
  const pool: TetrominoType[] = ["I", "J", "L", "O", "S", "T", "Z"];
  const bag: TetrominoType[] = [];
  let nextSeed = seed;
  while (pool.length > 0) {
    const result = randomIndex(pool.length, nextSeed);
    nextSeed = result.nextSeed;
    const [picked] = pool.splice(result.value, 1);
    if (picked) {
      bag.push(picked);
    }
  }
  return { bag, seed: nextSeed };
}

function drawFromQueue(
  queue: TetrominoType[],
  bag: TetrominoType[],
  seed: number,
): {
  bag: TetrominoType[];
  next: TetrominoType;
  queue: TetrominoType[];
  seed: number;
} {
  let nextBag = [...bag];
  const nextQueue = [...queue];
  let nextSeed = seed;
  while (nextQueue.length < 3) {
    if (nextBag.length === 0) {
      const refill = refillBag(nextSeed);
      nextBag = refill.bag;
      nextSeed = refill.seed;
    }
    const picked = nextBag.shift();
    if (picked) {
      nextQueue.push(picked);
    }
  }
  const next = nextQueue.shift() ?? "I";
  return {
    bag: nextBag,
    next,
    queue: nextQueue,
    seed: nextSeed,
  };
}

function createPiece(type: TetrominoType): ActivePiece {
  return {
    rotation: 0,
    type,
    x: 3,
    y: -1,
  };
}

function lockPiece(state: TetrisState): TetrisState {
  const board = state.board.map((row) => [...row]);
  for (const [x, y] of cellsForPiece(state.active)) {
    if (y < 0) {
      return {
        ...state,
        gameOver: true,
      };
    }
    const row = board[y];
    if (row) {
      row[x] = state.active.type;
    }
  }

  let cleared = 0;
  const compacted = board.filter((row) => {
    const full = row.every(Boolean);
    if (full) {
      cleared += 1;
    }
    return !full;
  });
  while (compacted.length < HEIGHT) {
    compacted.unshift(Array.from({ length: WIDTH }, () => null));
  }

  const draw = drawFromQueue(state.nextQueue, state.bag, state.seed);
  const active = createPiece(draw.next);
  return {
    accumulatorMs: 0,
    active,
    bag: draw.bag,
    board: compacted,
    gameOver: collides(compacted, active),
    level: Math.floor((state.lines + cleared) / 10) + 1,
    lines: state.lines + cleared,
    nextQueue: draw.queue,
    score: state.score + ([0, 100, 300, 500, 800][cleared] ?? 0),
    seed: draw.seed,
    won: false,
  };
}

function createInitialState(seed = 11): TetrisState {
  const refill = refillBag(seed);
  const draw = drawFromQueue([], refill.bag, refill.seed);
  return {
    accumulatorMs: 0,
    active: createPiece(draw.next),
    bag: draw.bag,
    board: emptyBoard(),
    gameOver: false,
    level: 1,
    lines: 0,
    nextQueue: draw.queue,
    score: 0,
    seed: draw.seed,
    won: false,
  };
}

function dropInterval(level: number): number {
  return Math.max(90, 720 - level * 45);
}

function movePiece(
  state: TetrisState,
  deltaX: number,
  deltaY: number,
): TetrisState {
  const candidate = {
    ...state.active,
    x: state.active.x + deltaX,
    y: state.active.y + deltaY,
  };
  if (collides(state.board, candidate)) {
    return state;
  }
  return {
    ...state,
    active: candidate,
  };
}

function rotatePiece(state: TetrisState, direction: 1 | -1): TetrisState {
  const rotations = SHAPES[state.active.type].length;
  const candidate = {
    ...state.active,
    rotation: (state.active.rotation + direction + rotations) % rotations,
  };
  const kicks = [0, -1, 1, -2, 2];
  for (const offset of kicks) {
    const kicked = {
      ...candidate,
      x: candidate.x + offset,
    };
    if (!collides(state.board, kicked)) {
      return {
        ...state,
        active: kicked,
      };
    }
  }
  return state;
}

function hardDrop(state: TetrisState): TetrisState {
  let current = state;
  while (true) {
    const next = movePiece(current, 0, 1);
    if (next === current) {
      return lockPiece(current);
    }
    current = next;
  }
}

function renderBoard(state: TetrisState): (string | null)[][] {
  const board = state.board.map((row) =>
    row.map((cell) => (cell ? COLORS[cell] : null)),
  );
  for (const [x, y] of cellsForPiece(state.active)) {
    if (y >= 0 && y < HEIGHT) {
      const row = board[y];
      if (row) {
        row[x] = COLORS[state.active.type];
      }
    }
  }
  return board;
}

export const tetrisGame = defineGame({
  create(seed?: number): GameController<TetrisSnapshot> {
    let state = createInitialState(seed);

    function applyCommand(command: CubeCommand) {
      if (state.gameOver) {
        return;
      }
      if (command === "left") {
        state = movePiece(state, -1, 0);
      } else if (command === "right") {
        state = movePiece(state, 1, 0);
      } else if (command === "down") {
        const next = movePiece(state, 0, 1);
        state =
          next === state
            ? lockPiece(state)
            : { ...next, score: next.score + 1 };
      } else if (command === "up") {
        state = hardDrop(state);
      } else if (command === "primary") {
        state = rotatePiece(state, 1);
      } else if (command === "secondary") {
        state = rotatePiece(state, -1);
      }
    }

    return {
      getSnapshot() {
        return {
          board: renderBoard(state),
          gameOver: state.gameOver,
          id: "tetris",
          level: state.level,
          lines: state.lines,
          name: META.name,
          nextQueue: state.nextQueue,
          score: state.score,
          won: state.won,
        };
      },
      handleCommand(command: CubeCommand) {
        applyCommand(command);
      },
      handleInput({ command }) {
        applyCommand(command);
      },
      meta: META,
      reset(nextSeed?: number) {
        state = createInitialState(nextSeed);
      },
      tick(deltaMs: number) {
        if (state.gameOver) {
          return;
        }
        let accumulatorMs = state.accumulatorMs + deltaMs;
        const interval = dropInterval(state.level);
        while (accumulatorMs >= interval) {
          accumulatorMs -= interval;
          const next = movePiece(state, 0, 1);
          state = next === state ? lockPiece(state) : next;
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

export function createTetrisGame(
  seed?: number,
): GameController<TetrisSnapshot> {
  return tetrisGame.create(seed);
}
