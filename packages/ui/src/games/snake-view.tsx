import type { SnakeSnapshot } from "@cube-arcade/game-engine";
import { clsx } from "clsx";

import { GamePanel, HudChip, toGridEntries } from "./shared";

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
    <GamePanel
      className="game-view game-view--snake"
      hud={<HudChip label="Score" value={snapshot.score} />}
      status={null}
      title={snapshot.name}
    >
      <div
        className={clsx("snake-stage", {
          "snake-stage--prompt": Boolean(prompt),
        })}
      >
        <div className="snake-stage__screen">
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
    </GamePanel>
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
