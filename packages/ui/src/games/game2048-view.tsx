import type { Game2048Snapshot } from "@cube-arcade/game-engine";
import { clsx } from "clsx";

import { toGridEntries } from "./shared";

export function Game2048View({
  connected,
  paused,
  snapshot,
}: {
  connected: boolean;
  paused: boolean;
  snapshot: Game2048Snapshot;
}) {
  const prompt = resolve2048Prompt({ connected, paused, snapshot });

  return (
    <div className="game-panel game-view game-view--2048">
      <div className="game-panel__topline game-panel__topline--2048">
        <h2 className="game-panel__title">{snapshot.name}</h2>
        <div className="score-line score-line--2048">
          <div
            className="score-line__group"
            aria-label={`Score ${snapshot.score}`}
          >
            <span>SCORE</span>
            <strong>{String(snapshot.score).padStart(4, "0")}</strong>
          </div>
          <div
            className="score-line__group"
            aria-label={`Max tile ${snapshot.maxTile}`}
          >
            <span>MAX</span>
            <strong>{snapshot.maxTile}</strong>
          </div>
        </div>
      </div>
      <div
        className={clsx("stack-stage", {
          "stack-stage--prompt": Boolean(prompt),
        })}
      >
        <div className="board board--2048">
          {toGridEntries(snapshot.board).map((entry) => (
            <div
              className={clsx("board__tile", {
                "board__tile--filled": entry.value > 0,
              })}
              key={entry.key}
              style={{
                backgroundColor:
                  entry.value > 0 ? tileColor(entry.value) : undefined,
              }}
            >
              {entry.value > 0 ? entry.value : ""}
            </div>
          ))}
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

function resolve2048Prompt({
  connected,
  paused,
  snapshot,
}: {
  connected: boolean;
  paused: boolean;
  snapshot: Game2048Snapshot;
}) {
  if (!connected) {
    return null;
  }

  if (paused) {
    return "INPUT PAUSED";
  }

  if (snapshot.won) {
    return "2048 ACHIEVED";
  }

  if (snapshot.gameOver) {
    return "NO MOVES LEFT\nTURN ANY FACE\nTO RESTART";
  }

  return null;
}

function tileColor(value: number): string {
  if (value >= 1024) return "#f0634d";
  if (value >= 256) return "#f08a4a";
  if (value >= 64) return "#f4bb55";
  if (value >= 16) return "#eed170";
  if (value >= 8) return "#dfcda4";
  if (value >= 4) return "#d8d0b6";
  return "#d3c9c0";
}
