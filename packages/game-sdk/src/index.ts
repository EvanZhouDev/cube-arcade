export * from "./types";

import type {
  CubeCommand,
  DirectionalCubeCommand,
  GameController,
  GameDefinition,
  GameInput,
  GameSnapshotBase,
} from "./types";

export function dispatchGameInput(
  controller: GameController,
  input: GameInput,
): void {
  if (controller.handleInput) {
    controller.handleInput(input);
    return;
  }

  controller.handleCommand(input.command);
}

type GameDictionary = Record<string, GameDefinition<string, GameSnapshotBase>>;
type GameIdOf<TGames extends GameDictionary> = Extract<keyof TGames, string>;

export function createGameRegistry<const TGames extends GameDictionary>(
  games: TGames,
) {
  const ids = Object.freeze(Object.keys(games) as GameIdOf<TGames>[]);

  return {
    assertId(value: string): GameIdOf<TGames> {
      if (value in games) {
        return value as GameIdOf<TGames>;
      }
      throw new Error(`Unknown game id: ${value}`);
    },
    create<TId extends GameIdOf<TGames>>(
      id: TId,
      seed?: number,
    ): ReturnType<TGames[TId]["create"]> {
      const game = games[id];
      if (!game) {
        throw new Error(`Unknown game id: ${String(id)}`);
      }

      return game.create(seed) as ReturnType<TGames[TId]["create"]>;
    },
    getDefinition<TId extends GameIdOf<TGames>>(id: TId): TGames[TId] {
      const game = games[id];
      if (!game) {
        throw new Error(`Unknown game id: ${String(id)}`);
      }

      return game;
    },
    getMeta<TId extends GameIdOf<TGames>>(id: TId): TGames[TId]["meta"] {
      const game = games[id];
      if (!game) {
        throw new Error(`Unknown game id: ${String(id)}`);
      }

      return game.meta;
    },
    has(value: string): value is GameIdOf<TGames> {
      return value in games;
    },
    ids,
  } as const;
}

export function isDirectionalCommand(
  command: CubeCommand,
): command is DirectionalCubeCommand {
  return (
    command === "left" ||
    command === "right" ||
    command === "up" ||
    command === "down"
  );
}
