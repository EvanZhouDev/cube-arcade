import type {
  BreakoutSnapshot,
  CubeCommand,
  GameController,
  GameMeta,
} from "../types";

interface Brick {
  alive: boolean;
  color: string;
  id: string;
  x: number;
  y: number;
}

interface BreakoutState {
  ball: {
    active: boolean;
    vx: number;
    vy: number;
    x: number;
    y: number;
  };
  bricks: Brick[];
  gameOver: boolean;
  lives: number;
  paddleX: number;
  score: number;
  won: boolean;
}

const WIDTH = 10;
const HEIGHT = 16;
const PADDLE_WIDTH = 2.4;
const PADDLE_Y = 14.75;
const MOVE_STEP = 0.8;

const META: GameMeta = {
  accent: "#4dd7ff",
  controls: [
    { command: "left", effect: "Move the paddle left", label: "Paddle left" },
    {
      command: "right",
      effect: "Move the paddle right",
      label: "Paddle right",
    },
    { command: "primary", effect: "Launch the ball", label: "Launch" },
  ],
  description:
    "A clean single-screen brick breaker that turns face twists into paddle movement.",
  id: "breakout",
  name: "Breakout",
  tagline: "Launch, track angles, and clear the wall.",
};

function createBricks(): Brick[] {
  const colors = ["#ff7c66", "#ffb74f", "#f3de58", "#7edd70", "#63c6f5"];
  const bricks: Brick[] = [];
  for (let row = 0; row < 5; row += 1) {
    for (let column = 0; column < 10; column += 1) {
      bricks.push({
        alive: true,
        color: colors[row] ?? colors[0] ?? "#ffffff",
        id: `${row}-${column}`,
        x: column,
        y: 1 + row,
      });
    }
  }
  return bricks;
}

function createInitialState(): BreakoutState {
  return {
    ball: {
      active: false,
      vx: 3.8,
      vy: -6.8,
      x: WIDTH / 2,
      y: PADDLE_Y - 0.6,
    },
    bricks: createBricks(),
    gameOver: false,
    lives: 3,
    paddleX: WIDTH / 2,
    score: 0,
    won: false,
  };
}

function clampPaddle(x: number): number {
  return Math.min(WIDTH - PADDLE_WIDTH / 2, Math.max(PADDLE_WIDTH / 2, x));
}

function resetBall(state: BreakoutState): BreakoutState {
  return {
    ...state,
    ball: {
      active: false,
      vx: 3.8,
      vy: -6.8,
      x: state.paddleX,
      y: PADDLE_Y - 0.6,
    },
  };
}

function tickBall(state: BreakoutState, deltaMs: number): BreakoutState {
  if (!state.ball.active || state.gameOver || state.won) {
    return state.ball.active
      ? state
      : {
          ...state,
          ball: {
            ...state.ball,
            x: state.paddleX,
            y: PADDLE_Y - 0.6,
          },
        };
  }

  const nextState = {
    ...state,
    ball: {
      ...state.ball,
      x: state.ball.x + state.ball.vx * (deltaMs / 1000),
      y: state.ball.y + state.ball.vy * (deltaMs / 1000),
    },
    bricks: state.bricks.map((brick) => ({ ...brick })),
  };

  if (nextState.ball.x <= 0.4 || nextState.ball.x >= WIDTH - 0.4) {
    nextState.ball.vx *= -1;
    nextState.ball.x = Math.min(WIDTH - 0.4, Math.max(0.4, nextState.ball.x));
  }

  if (nextState.ball.y <= 0.5) {
    nextState.ball.vy *= -1;
    nextState.ball.y = 0.5;
  }

  if (
    nextState.ball.y >= PADDLE_Y - 0.4 &&
    nextState.ball.y <= PADDLE_Y + 0.2 &&
    nextState.ball.x >= nextState.paddleX - PADDLE_WIDTH / 2 &&
    nextState.ball.x <= nextState.paddleX + PADDLE_WIDTH / 2 &&
    nextState.ball.vy > 0
  ) {
    const offset = (nextState.ball.x - nextState.paddleX) / (PADDLE_WIDTH / 2);
    nextState.ball.vx = offset * 5.6;
    nextState.ball.vy = -Math.abs(nextState.ball.vy);
    nextState.ball.y = PADDLE_Y - 0.45;
  }

  for (const brick of nextState.bricks) {
    if (
      brick.alive &&
      nextState.ball.x >= brick.x &&
      nextState.ball.x <= brick.x + 0.92 &&
      nextState.ball.y >= brick.y &&
      nextState.ball.y <= brick.y + 0.42
    ) {
      brick.alive = false;
      nextState.ball.vy *= -1;
      nextState.score += 10;
      break;
    }
  }

  if (nextState.ball.y > HEIGHT) {
    if (nextState.lives === 1) {
      return {
        ...nextState,
        gameOver: true,
        lives: 0,
      };
    }
    return resetBall({
      ...nextState,
      lives: nextState.lives - 1,
    });
  }

  if (nextState.bricks.every((brick) => !brick.alive)) {
    return {
      ...nextState,
      won: true,
    };
  }

  return nextState;
}

export function createBreakoutGame(): GameController<BreakoutSnapshot> {
  let state = createInitialState();

  return {
    getSnapshot() {
      return {
        ball: {
          active: state.ball.active,
          x: state.ball.x,
          y: state.ball.y,
        },
        bricks: state.bricks,
        gameOver: state.gameOver,
        id: "breakout",
        lives: state.lives,
        name: META.name,
        paddle: {
          width: PADDLE_WIDTH,
          x: state.paddleX,
        },
        score: state.score,
        won: state.won,
      };
    },
    handleCommand(command: CubeCommand) {
      if (state.gameOver || state.won) {
        if (command === "primary") {
          state = createInitialState();
        }
        return;
      }
      if (command === "left") {
        const paddleX = clampPaddle(state.paddleX - MOVE_STEP);
        state = {
          ...tickBall(
            {
              ...state,
              paddleX,
            },
            0,
          ),
          paddleX,
        };
      } else if (command === "right") {
        const paddleX = clampPaddle(state.paddleX + MOVE_STEP);
        state = {
          ...tickBall(
            {
              ...state,
              paddleX,
            },
            0,
          ),
          paddleX,
        };
      } else if (command === "primary" && !state.ball.active) {
        state = {
          ...state,
          ball: {
            ...state.ball,
            active: true,
          },
        };
      }
    },
    meta: META,
    reset() {
      state = createInitialState();
    },
    tick(deltaMs: number) {
      state = tickBall(state, deltaMs);
    },
  };
}
