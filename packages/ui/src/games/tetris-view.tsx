import type { TetrisSnapshot } from "@cube-arcade/game-engine";
import { clsx } from "clsx";

import {
  GamePanel,
  HudChip,
  resolveGameStatus,
  toGridEntries,
  toQueueEntries,
} from "./shared";

export function TetrisView({
  connected,
  onReset,
  paused,
  snapshot,
}: {
  connected: boolean;
  onReset?: () => void;
  paused: boolean;
  snapshot: TetrisSnapshot;
}) {
  return (
    <GamePanel
      className="game-view game-view--tetris"
      hud={
        <>
          <HudChip label="Score" value={snapshot.score} />
          <HudChip label="Lines" value={snapshot.lines} />
          <HudChip label="Level" value={snapshot.level} />
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
      <div className="game-panel__body">
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
        <div className="queue-panel">
          <span>NEXT</span>
          <div className="queue-panel__list">
            {toQueueEntries(snapshot.nextQueue).map((entry) => (
              <div className="queue-panel__piece" key={entry.key}>
                {entry.piece}
              </div>
            ))}
          </div>
        </div>
      </div>
    </GamePanel>
  );
}
