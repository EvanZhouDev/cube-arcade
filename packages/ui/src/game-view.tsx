import type { ArcadeSnapshot } from "@cube-arcade/game-engine";

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
          paused={paused}
          snapshot={snapshot}
        />
      );
    case "snake":
      return (
        <SnakeView connected={connected} paused={paused} snapshot={snapshot} />
      );
    case "tetris":
      return (
        <TetrisView connected={connected} paused={paused} snapshot={snapshot} />
      );
  }
}
