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

export function GameView({ snapshot }: { snapshot: ArcadeSnapshot }) {
  switch (snapshot.id) {
    case "2048":
      return <Game2048Board snapshot={snapshot} />;
    case "breakout":
      return <BreakoutBoard snapshot={snapshot} />;
    case "snake":
      return <SnakeBoard snapshot={snapshot} />;
    case "tetris":
      return <TetrisBoard snapshot={snapshot} />;
  }
}

function SnakeBoard({ snapshot }: { snapshot: SnakeSnapshot }) {
  return (
    <div className="board board--snake">
      {toGridEntries(snapshot.grid).map((entry) => (
        <div
          className={clsx("board__cell", `board__cell--${entry.value}`)}
          key={entry.key}
        />
      ))}
    </div>
  );
}

function Game2048Board({ snapshot }: { snapshot: Game2048Snapshot }) {
  return (
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
  );
}

function TetrisBoard({ snapshot }: { snapshot: TetrisSnapshot }) {
  return (
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
  );
}

function BreakoutBoard({ snapshot }: { snapshot: BreakoutSnapshot }) {
  return (
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
