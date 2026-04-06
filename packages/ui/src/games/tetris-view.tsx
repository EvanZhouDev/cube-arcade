import type { TetrisSnapshot } from "@cube-arcade/game-engine";
import { clsx } from "clsx";

import { toGridEntries } from "./shared";

const TETROMINO_COLORS: Record<string, string> = {
  I: "#49c6f3",
  J: "#4060ff",
  L: "#f18a25",
  O: "#f6d74f",
  S: "#69d35d",
  T: "#ac65ff",
  Z: "#ef5955",
};

const TETROMINO_PREVIEWS: Record<string, Array<[number, number]>> = {
  I: [
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
  ],
  J: [
    [0, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  L: [
    [2, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  O: [
    [1, 0],
    [2, 0],
    [1, 1],
    [2, 1],
  ],
  S: [
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1],
  ],
  T: [
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  Z: [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
  ],
};

export function TetrisView({
  connected,
  paused,
  snapshot,
}: {
  connected: boolean;
  paused: boolean;
  snapshot: TetrisSnapshot;
}) {
  const prompt = resolveTetrisPrompt({ connected, paused, snapshot });

  return (
    <div className="game-panel game-view game-view--tetris">
      <div
        className={clsx("tetris-stage", {
          "tetris-stage--prompt": Boolean(prompt),
        })}
      >
        <div className="tetris-stage__stats">
          <h2 className="game-panel__title tetris-stage__title">
            {snapshot.name}
          </h2>
          <div
            className="tetris-stage__metric"
            aria-label={`Level ${snapshot.level}`}
          >
            <span>LEVEL</span>
            <strong>{snapshot.level}</strong>
          </div>
          <div
            className="tetris-stage__metric"
            aria-label={`Lines ${snapshot.lines}`}
          >
            <span>LINES</span>
            <strong>{snapshot.lines}</strong>
          </div>
          <div
            className="tetris-stage__metric"
            aria-label={`Score ${snapshot.score}`}
          >
            <span>SCORE</span>
            <strong>{snapshot.score}</strong>
          </div>
        </div>
        <div className="tetris-stage__well">
          <div className="board board--tetris">
            {toGridEntries(snapshot.board).map((entry) => (
              <div
                className={clsx("board__cell", {
                  "board__cell--filled": Boolean(entry.value),
                })}
                key={entry.key}
                style={{
                  backgroundColor: entry.value ?? undefined,
                }}
              />
            ))}
          </div>
        </div>
        <div className="tetris-stage__queue">
          <span className="tetris-stage__queue-title">NEXT</span>
          <div className="tetris-stage__queue-list">
            {buildPreviewPieces(snapshot.nextQueue).map(({ key, piece }) => (
              <div className="tetris-preview" key={key}>
                <div className="tetris-preview__grid">
                  {Array.from({ length: 16 }, (_, cellIndex) => {
                    const x = cellIndex % 4;
                    const y = Math.floor(cellIndex / 4);
                    const filled = (TETROMINO_PREVIEWS[piece] ?? []).some(
                      ([cellX, cellY]) => cellX === x && cellY === y,
                    );
                    return (
                      <div
                        className={clsx("tetris-preview__cell", {
                          "tetris-preview__cell--filled": filled,
                        })}
                        key={`${piece}-${x}-${y}`}
                        style={{
                          backgroundColor: filled
                            ? (TETROMINO_COLORS[piece] ?? "#ffffff")
                            : undefined,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        {prompt ? (
          <div className="stack-stage__prompt">
            <span>{prompt}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function buildPreviewPieces(queue: string[]) {
  const occurrences = new Map<string, number>();
  return queue.slice(0, 3).map((piece) => {
    const nextOccurrence = (occurrences.get(piece) ?? 0) + 1;
    occurrences.set(piece, nextOccurrence);
    return {
      key: `${piece}-${nextOccurrence}`,
      piece,
    };
  });
}

function resolveTetrisPrompt({
  connected,
  paused,
  snapshot,
}: {
  connected: boolean;
  paused: boolean;
  snapshot: TetrisSnapshot;
}) {
  if (!connected) {
    return null;
  }

  if (snapshot.won) {
    return "RUN CLEARED";
  }

  if (snapshot.gameOver) {
    return "STACK OVERFLOW\nTURN ANY FACE\nTO RESTART";
  }

  if (snapshot.awaitingStart) {
    return "TURN ANY FACE TO START";
  }

  if (paused) {
    return "INPUT PAUSED";
  }

  return null;
}
