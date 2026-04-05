import type { ArcadeSnapshot } from "@cube-arcade/game-engine";

import { BreakoutView } from "./games/breakout-view";
import { Game2048View } from "./games/game2048-view";
import { SnakeView } from "./games/snake-view";
import { TetrisView } from "./games/tetris-view";

export function GameView({
  connected = true,
  onReset,
  paused = false,
  snapshot,
}: {
  connected?: boolean;
  onReset?: () => void;
  paused?: boolean;
  snapshot: ArcadeSnapshot;
}) {
  switch (snapshot.id) {
    case "2048":
      return (
        <Game2048View
          connected={connected}
          onReset={onReset}
          paused={paused}
          snapshot={snapshot}
        />
      );
    case "breakout":
      return (
        <BreakoutView
          connected={connected}
          onReset={onReset}
          paused={paused}
          snapshot={snapshot}
        />
      );
    case "snake":
      return (
        <SnakeView
          connected={connected}
          onReset={onReset}
          paused={paused}
          snapshot={snapshot}
        />
      );
    case "tetris":
      return (
        <TetrisView
          connected={connected}
          onReset={onReset}
          paused={paused}
          snapshot={snapshot}
        />
      );
  }
}
