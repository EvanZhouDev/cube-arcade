import { describe, expect, it, vi } from "vitest";

import {
  type GameController,
  type GameInput,
  createGameRegistry,
  defineGame,
  dispatchGameInput,
} from "./index";

const input: GameInput = {
  command: "left",
  cube: {
    batteryLevel: null,
    connected: true,
    facelets: "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB",
    features: {
      battery: false,
      hardwareBluetooth: false,
      orientation: false,
      solvedResync: true,
    },
    lastCommand: "left",
    lastEventAt: 42,
    lastMove: "U",
    mode: "simulator",
    moveHistory: ["U"],
    name: "Test Cube",
    orientation: null,
  },
  receivedAt: 42,
  sourceMove: "U",
};

describe("game sdk", () => {
  it("returns game definitions unchanged", () => {
    const definition = defineGame({
      create: () => ({
        getSnapshot: () => ({
          gameOver: false,
          id: "demo",
          name: "Demo",
          score: 0,
          won: false,
        }),
        handleCommand: vi.fn(),
        meta: {
          accent: "#fff",
          controls: [],
          description: "demo",
          id: "demo",
          name: "Demo",
          tagline: "demo",
        },
        reset: vi.fn(),
        tick: vi.fn(),
      }),
      meta: {
        accent: "#fff",
        controls: [],
        description: "demo",
        id: "demo",
        name: "Demo",
        tagline: "demo",
      },
    });

    expect(definition.meta.id).toBe("demo");
    expect(definition.create().getSnapshot().id).toBe("demo");
  });

  it("creates game registries from isolated definitions", () => {
    const demoGame = defineGame({
      create(seed = 0): GameController {
        let score = seed;
        return {
          getSnapshot() {
            return {
              gameOver: false,
              id: "demo",
              name: "Demo",
              score,
              won: false,
            };
          },
          handleCommand() {},
          meta: {
            accent: "#fff",
            controls: [],
            description: "demo",
            id: "demo",
            name: "Demo",
            tagline: "demo",
          },
          reset(nextSeed = 0) {
            score = nextSeed;
          },
          tick(deltaMs: number) {
            score += deltaMs;
          },
        };
      },
      meta: {
        accent: "#fff",
        controls: [],
        description: "demo",
        id: "demo",
        name: "Demo",
        tagline: "demo",
      },
    });
    const registry = createGameRegistry({ demo: demoGame });
    const controller = registry.create("demo", 3);

    controller.tick(2);

    expect(registry.ids).toEqual(["demo"]);
    expect(registry.assertId("demo")).toBe("demo");
    expect(registry.getMeta("demo").name).toBe("Demo");
    expect(controller.getSnapshot().score).toBe(5);
    expect(() => registry.assertId("missing")).toThrow("Unknown game id");
  });

  it("falls back to handleCommand for simple games", () => {
    const handleCommand = vi.fn();
    const controller: GameController = {
      getSnapshot: () => ({
        gameOver: false,
        id: "test",
        name: "Test",
        score: 0,
        won: false,
      }),
      handleCommand,
      meta: {
        accent: "#fff",
        controls: [],
        description: "test",
        id: "test",
        name: "Test",
        tagline: "test",
      },
      reset: vi.fn(),
      tick: vi.fn(),
    };

    dispatchGameInput(controller, input);
    expect(handleCommand).toHaveBeenCalledWith("left");
  });

  it("passes full smartcube context to handleInput when provided", () => {
    const handleCommand = vi.fn();
    const handleInput = vi.fn();
    const controller: GameController = {
      getSnapshot: () => ({
        gameOver: false,
        id: "test",
        name: "Test",
        score: 0,
        won: false,
      }),
      handleCommand,
      handleInput,
      meta: {
        accent: "#fff",
        controls: [],
        description: "test",
        id: "test",
        name: "Test",
        tagline: "test",
      },
      reset: vi.fn(),
      tick: vi.fn(),
    };

    dispatchGameInput(controller, input);
    expect(handleInput).toHaveBeenCalledWith(input);
    expect(handleCommand).not.toHaveBeenCalled();
  });
});
