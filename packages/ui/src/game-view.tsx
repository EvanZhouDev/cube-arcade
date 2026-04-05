import type {
  ArcadeSnapshot,
  BreakoutSnapshot,
  Game2048Snapshot,
  SnakeSnapshot,
  TetrisSnapshot,
} from "@cube-arcade/game-engine";
import { clsx } from "clsx";

function toGridEntries<T>(grid: T[][]) {
  return grid.flatMap((row, rowIndex) =>
    row.map((value, columnIndex) => ({
      column: columnIndex,
      key: `${rowIndex}-${columnIndex}`,
      row: rowIndex,
      value,
    })),
  );
}

function toQueueEntries(queue: string[]) {
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

export function GameView({ snapshot }: { snapshot: ArcadeSnapshot }) {
  switch (snapshot.id) {
    case "2048":
      return (
        <div className="game-view game-view--2048">
          <Game2048Board snapshot={snapshot} />
        </div>
      );
    case "breakout":
      return (
        <div className="game-view game-view--breakout">
          <BreakoutBoard snapshot={snapshot} />
        </div>
      );
    case "snake":
      return (
        <div className="game-view game-view--snake">
          <SnakeBoard snapshot={snapshot} />
        </div>
      );
    case "tetris":
      return (
        <div className="game-view game-view--tetris">
          <TetrisBoard snapshot={snapshot} />
        </div>
      );
  }
}

function SnakeBoard({ snapshot }: { snapshot: SnakeSnapshot }) {
  return (
    <div className="game-panel">
      <div className="game-panel__hud">
        <HudChip label="Score" value={snapshot.score} />
        <HudChip label="Budget" value={`${snapshot.moveBudgetMs}ms`} />
        <HudChip label="Status" value={snapshot.gameOver ? "crash" : "live"} />
      </div>
      <div className="board board--snake">
        {toGridEntries(snapshot.grid).map((entry) => (
          <div
            className={clsx("board__cell", `board__cell--${entry.value}`)}
            key={entry.key}
          />
        ))}
      </div>
    </div>
  );
}

function Game2048Board({ snapshot }: { snapshot: Game2048Snapshot }) {
  return (
    <div className="game-panel">
      <div className="game-panel__hud">
        <HudChip label="Score" value={snapshot.score} />
        <HudChip label="Max Tile" value={snapshot.maxTile} />
        <HudChip label="Status" value={snapshot.won ? "2048" : "stack"} />
      </div>
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
    </div>
  );
}

function TetrisBoard({ snapshot }: { snapshot: TetrisSnapshot }) {
  return (
    <div className="game-panel game-panel--tetris">
      <div className="game-panel__hud">
        <HudChip label="Score" value={snapshot.score} />
        <HudChip label="Lines" value={snapshot.lines} />
        <HudChip label="Level" value={snapshot.level} />
      </div>
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
    </div>
  );
}

function BreakoutBoard({ snapshot }: { snapshot: BreakoutSnapshot }) {
  return (
    <div className="game-panel">
      <div className="game-panel__hud">
        <HudChip label="Score" value={snapshot.score} />
        <HudChip label="Lives" value={snapshot.lives} />
        <HudChip
          label="Bricks"
          value={snapshot.bricks.filter((brick) => brick.alive).length}
        />
      </div>
      <div className="breakout">
        <div className="breakout__field">
          {snapshot.bricks.map((brick) => (
            <div
              className={clsx("breakout__brick", {
                "breakout__brick--gone": !brick.alive,
              })}
              key={brick.id}
              style={{
                backgroundColor: brick.color,
                left: `${brick.x * 9.6}%`,
                top: `${brick.y * 6.2}%`,
              }}
            />
          ))}
          <div
            className="breakout__paddle"
            style={{
              left: `${(snapshot.paddle.x / 10) * 100}%`,
              width: `${(snapshot.paddle.width / 10) * 100}%`,
            }}
          />
          <div
            className="breakout__ball"
            style={{
              left: `${(snapshot.ball.x / 10) * 100}%`,
              top: `${(snapshot.ball.y / 16) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function HudChip({
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

function tileColor(value: number): string {
  if (value >= 1024) return "#f0634d";
  if (value >= 256) return "#f08a4a";
  if (value >= 64) return "#f4bb55";
  if (value >= 16) return "#eed170";
  if (value >= 8) return "#dfcda4";
  if (value >= 4) return "#d8d0b6";
  return "#d3c9c0";
}
