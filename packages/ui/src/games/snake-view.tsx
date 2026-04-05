import type { SnakeSnapshot } from "@cube-arcade/game-engine";
import { clsx } from "clsx";

import { GamePanel, HudChip, resolveGameStatus, toGridEntries } from "./shared";

export function SnakeView({
  connected,
  onReset,
  paused,
  snapshot,
}: {
  connected: boolean;
  onReset?: () => void;
  paused: boolean;
  snapshot: SnakeSnapshot;
}) {
  return (
    <GamePanel
      className="game-view game-view--snake"
      hud={
        <>
          <HudChip label="Score" value={snapshot.score} />
          <HudChip label="Tick" value={`${snapshot.moveBudgetMs}ms`} />
          <HudChip label="Field" value="14x14" />
        </>
      }
      onReset={onReset}
      status={resolveGameStatus({
        connected,
        gameOver: snapshot.gameOver,
        paused,
        won: snapshot.won,
      })}
      title={snapshot.name}
    >
      <div className="board board--snake">
        {toGridEntries(snapshot.grid).map((entry) => (
          <div
            className={clsx("board__cell", `board__cell--${entry.value}`)}
            key={entry.key}
          />
        ))}
      </div>
    </GamePanel>
  );
}
