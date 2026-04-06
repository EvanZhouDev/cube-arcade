import { clsx } from "clsx";
import type { ReactNode } from "react";

export function toGridEntries<T>(grid: T[][]) {
  return grid.flatMap((row, rowIndex) =>
    row.map((value, columnIndex) => ({
      column: columnIndex,
      key: `${rowIndex}-${columnIndex}`,
      row: rowIndex,
      value,
    })),
  );
}

export function toQueueEntries(queue: string[]) {
  const seen = new Map<string, number>();
  return queue.map((piece) => {
    const occurrence = (seen.get(piece) ?? 0) + 1;
    seen.set(piece, occurrence);
    return {
      key: `${piece}-${occurrence}`,
      piece,
    };
  });
}

export function GamePanel({
  children,
  className,
  hud,
  onReset,
  status,
  title,
}: {
  children: ReactNode;
  className?: string;
  hud: ReactNode;
  onReset?: () => void;
  status?: string | null;
  title: string;
}) {
  return (
    <div className={clsx("game-panel", className)}>
      <div className="game-panel__topline">
        <div>
          <h2 className="game-panel__title">{title}</h2>
          {status ? <p className="game-panel__status">{status}</p> : null}
        </div>
        {onReset ? (
          <button
            className="ghost-button game-panel__reset"
            onClick={onReset}
            type="button"
          >
            RESET
          </button>
        ) : null}
      </div>
      <div className="game-panel__hud">{hud}</div>
      {children}
    </div>
  );
}

export function HudChip({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="hud-chip">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function resolveGameStatus({
  connected,
  gameOver,
  paused,
  won,
}: {
  connected: boolean;
  gameOver: boolean;
  paused: boolean;
  won: boolean;
}) {
  if (!connected) {
    return "CONNECT CUBE TO START";
  }

  if (paused) {
    return "INPUT PAUSED";
  }

  if (won) {
    return "RUN CLEARED";
  }

  if (gameOver) {
    return "GAME OVER";
  }

  return "LIVE SIGNAL";
}
