import type { SnakeSnapshot } from "@cube-arcade/game-engine";
import { clsx } from "clsx";

import { toGridEntries } from "./shared";

export function SnakeView({
  connected,
  paused,
  snapshot,
}: {
  connected: boolean;
  paused: boolean;
  snapshot: SnakeSnapshot;
}) {
  const prompt = resolveSnakePrompt({ connected, paused, snapshot });

  return (
    <div className="game-panel game-view game-view--snake">
      <div className="game-panel__topline">
        <h2 className="game-panel__title">{snapshot.name}</h2>
        <div className="snake-score" aria-label={`Score ${snapshot.score}`}>
          <span>SCORE</span>
          <strong>{String(snapshot.score).padStart(3, "0")}</strong>
        </div>
      </div>
      <div
        className={clsx("snake-stage", {
          "snake-stage--prompt": Boolean(prompt),
        })}
      >
        <div className="board board--snake">
          {toGridEntries(snapshot.grid).map((entry) => (
            <div
              className={clsx("board__cell", `board__cell--${entry.value}`)}
              key={entry.key}
            />
          ))}
        </div>
        {prompt ? (
          <div className="snake-stage__prompt">
            <span>{prompt}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function resolveSnakePrompt({
  connected,
  paused,
  snapshot,
}: {
  connected: boolean;
  paused: boolean;
  snapshot: SnakeSnapshot;
}) {
  if (!connected) {
    return null;
  }

  if (paused) {
    return "INPUT PAUSED";
  }

  if (snapshot.awaitingStart) {
    return "TURN ANY FACE TO START";
  }

  if (snapshot.gameOver || snapshot.won) {
    return "TURN ANY FACE TO RESTART";
  }

  return null;
}
