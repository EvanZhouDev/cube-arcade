import type { BreakoutSnapshot } from "@cube-arcade/game-engine";
import { clsx } from "clsx";

import { GamePanel, HudChip, resolveGameStatus } from "./shared";

export function BreakoutView({
  connected,
  onReset,
  paused,
  snapshot,
}: {
  connected: boolean;
  onReset?: () => void;
  paused: boolean;
  snapshot: BreakoutSnapshot;
}) {
  return (
    <GamePanel
      className="game-view game-view--breakout"
      hud={
        <>
          <HudChip label="Score" value={snapshot.score} />
          <HudChip label="Lives" value={snapshot.lives} />
          <HudChip
            label="Bricks"
            value={snapshot.bricks.filter((brick) => brick.alive).length}
          />
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
    </GamePanel>
  );
}
