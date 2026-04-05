import type { Game2048Snapshot } from "@cube-arcade/game-engine";
import { clsx } from "clsx";

import { GamePanel, HudChip, resolveGameStatus, toGridEntries } from "./shared";

export function Game2048View({
  connected,
  onReset,
  paused,
  snapshot,
}: {
  connected: boolean;
  onReset?: () => void;
  paused: boolean;
  snapshot: Game2048Snapshot;
}) {
  return (
    <GamePanel
      className="game-view game-view--2048"
      hud={
        <>
          <HudChip label="Score" value={snapshot.score} />
          <HudChip label="Max Tile" value={snapshot.maxTile} />
          <HudChip label="Board" value="4x4" />
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
    </GamePanel>
  );
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
