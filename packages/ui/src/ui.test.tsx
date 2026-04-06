import type { SnakeSnapshot } from "@cube-arcade/game-engine";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SOLVED_FACELETS, getBindings } from "@cube-arcade/smartcube";

import { ControlCube } from "./control-cube";
import { GameView } from "./game-view";

const snakeSnapshot: SnakeSnapshot = {
  awaitingStart: false,
  food: { x: 1, y: 1 },
  gameOver: false,
  grid: Array.from({ length: 14 }, (_, row) =>
    Array.from({ length: 14 }, (_, column) => {
      if (row === 1 && column === 1) return "food";
      if (row === 7 && column === 6) return "head";
      if (row === 7 && column === 5) return "body";
      return "empty";
    }),
  ),
  id: "snake",
  moveBudgetMs: 150,
  name: "Snake",
  score: 12,
  won: false,
};

describe("ui package", () => {
  it("renders control hints for visible cube faces", () => {
    const { container } = render(
      <ControlCube
        bindings={getBindings(["left", "right", "primary"])}
        facelets={SOLVED_FACELETS}
      />,
    );

    expect(screen.getByText("LEFT")).toBeTruthy();
    expect(screen.getByText("RIGHT")).toBeTruthy();
    expect(screen.getByText("PRIMARY")).toBeTruthy();

    const upFace = container.querySelector(".control-cube__face--U");
    const frontFace = container.querySelector(".control-cube__face--F");

    expect(upFace?.getAttribute("style")).toContain(
      "--face-label-color: rgba(5, 7, 11, 0.84)",
    );
    expect(frontFace?.getAttribute("style")).toContain("--face-label-color:");
  });

  it("renders a snake board snapshot", () => {
    const { container } = render(
      <GameView
        connected
        onReset={() => {}}
        paused={false}
        snapshot={snakeSnapshot}
      />,
    );
    expect(container.querySelectorAll(".board__cell--head")).toHaveLength(1);
    expect(container.querySelectorAll(".board__cell--food")).toHaveLength(1);
  });

  it("shows the snake start prompt before the first turn", () => {
    render(
      <GameView
        connected
        paused={false}
        snapshot={{
          ...snakeSnapshot,
          awaitingStart: true,
          score: 0,
        }}
      />,
    );

    expect(screen.getByText("TURN ANY FACE TO START")).toBeTruthy();
  });

  it("rotates the control cube when dragged", () => {
    const { getByTestId } = render(
      <ControlCube
        bindings={getBindings(["left", "right", "primary"])}
        facelets={SOLVED_FACELETS}
      />,
    );

    const cube = getByTestId("control-cube-body");
    const stage = cube.parentElement;

    expect(cube.getAttribute("style")).toContain("rotateX(-24deg)");
    expect(cube.getAttribute("style")).toContain("rotateY(-34deg)");
    expect(stage).toBeTruthy();

    if (!stage) {
      return;
    }

    fireEvent.pointerDown(stage, {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    fireEvent.pointerMove(stage, {
      clientX: 160,
      clientY: 80,
      pointerId: 1,
    });
    fireEvent.pointerUp(stage, {
      clientX: 160,
      clientY: 80,
      pointerId: 1,
    });

    expect(cube.getAttribute("style")).toContain("rotateX(-17deg)");
    expect(cube.getAttribute("style")).toContain("rotateY(-13deg)");
  });
});
