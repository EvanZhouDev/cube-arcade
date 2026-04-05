# Game SDK

`@cube-arcade/game-sdk` is the shared contribution surface for arcade games.

Each game should live in its own module and export a `defineGame(...)`
definition with:

- `meta`: cabinet name, description, accent color, and control hints
- `create(seed?)`: returns a fresh isolated controller instance
- `getSnapshot()`: returns serializable render state
- `tick(deltaMs)`: advances time-based logic
- `handleCommand(command)`: receives normalized cube commands
- `handleInput(input)` optional: receives the full smartcube event, including
  move source and current cube state

Minimal shape:

```ts
import {
  defineGame,
  type GameController,
  type GameMeta,
  type GameSnapshotBase,
} from "@cube-arcade/game-sdk";

interface MySnapshot extends GameSnapshotBase<"my-game"> {
  id: "my-game";
}

const META: GameMeta<"my-game"> = {
  accent: "#00f0ff",
  controls: [{ command: "primary", effect: "Do the thing", label: "Action" }],
  description: "Describe the cabinet.",
  id: "my-game",
  name: "My Game",
  tagline: "One-line pitch.",
};

export const myGame = defineGame({
  create(): GameController<MySnapshot> {
    return {
      getSnapshot() {
        return {
          gameOver: false,
          id: "my-game",
          name: META.name,
          score: 0,
          won: false,
        };
      },
      handleCommand(command) {
        void command;
      },
      meta: META,
      reset() {},
      tick() {},
    };
  },
  meta: META,
});
```

To register built-in games together, use `createGameRegistry(...)`:

```ts
import { createGameRegistry } from "@cube-arcade/game-sdk";

const registry = createGameRegistry({
  "my-game": myGame,
});

registry.create("my-game");
registry.getMeta("my-game");
registry.ids;
```
