"use client";

import { ARCADE_GAME_IDS } from "@cube-arcade/game-engine";
import { getBindings } from "@cube-arcade/smartcube";
import { ControlCube, GameView } from "@cube-arcade/ui";
import { useCompletion } from "ai/react";
import { Gamepad2, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

import { useArcadeStore } from "../src/lib/arcade-store";

const SIMULATOR_MOVES = [
  { effect: "Right", move: "U" },
  { effect: "Left", move: "U'" },
  { effect: "Down", move: "R" },
  { effect: "Up", move: "R'" },
  { effect: "Primary", move: "F" },
  { effect: "Secondary", move: "F'" },
  { effect: "Pause", move: "F2" },
] as const;

export default function Page() {
  const bluetoothAvailable = useArcadeStore(
    (state) => state.bluetoothAvailable,
  );
  const connectHardware = useArcadeStore((state) => state.connectHardware);
  const connectSimulator = useArcadeStore((state) => state.connectSimulator);
  const cubeState = useArcadeStore((state) => state.cubeState);
  const disconnect = useArcadeStore((state) => state.disconnect);
  const error = useArcadeStore((state) => state.error);
  const gameId = useArcadeStore((state) => state.gameId);
  const meta = useArcadeStore((state) => state.meta);
  const paused = useArcadeStore((state) => state.paused);
  const refreshBluetoothAvailability = useArcadeStore(
    (state) => state.refreshBluetoothAvailability,
  );
  const resetGame = useArcadeStore((state) => state.resetGame);
  const resyncCube = useArcadeStore((state) => state.resyncCube);
  const selectGame = useArcadeStore((state) => state.selectGame);
  const session = useArcadeStore((state) => state.session);
  const simulateMove = useArcadeStore((state) => state.simulateMove);
  const snapshot = useArcadeStore((state) => state.snapshot);
  const tick = useArcadeStore((state) => state.tick);

  const bindings = useMemo(
    () => getBindings(meta.controls.map((control) => control.command)),
    [meta.controls],
  );

  const animationRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);

  const {
    complete,
    completion,
    error: coachError,
    isLoading,
  } = useCompletion({
    api: "/api/coach",
  });

  useEffect(() => {
    refreshBluetoothAvailability();
  }, [refreshBluetoothAvailability]);

  useEffect(() => {
    const frame = (timestamp: number) => {
      const lastFrame = lastFrameRef.current ?? timestamp;
      lastFrameRef.current = timestamp;
      tick(timestamp - lastFrame);
      animationRef.current = window.requestAnimationFrame(frame);
    };

    animationRef.current = window.requestAnimationFrame(frame);
    return () => {
      if (animationRef.current !== null) {
        window.cancelAnimationFrame(animationRef.current);
      }
    };
  }, [tick]);

  const coachPayload = useMemo(
    () =>
      JSON.stringify({
        controls: bindings.map((binding) => ({
          effect:
            meta.controls.find((control) => control.command === binding.command)
              ?.effect ?? binding.description,
          move: binding.move,
        })),
        game: meta.name,
        lastMove: cubeState.lastMove,
        lastScore: snapshot.score,
        mode: cubeState.mode,
      }),
    [
      bindings,
      cubeState.lastMove,
      cubeState.mode,
      meta.controls,
      meta.name,
      snapshot.score,
    ],
  );

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="hero__eyebrow">Smartcube-first online arcade</p>
          <h1>Cube Arcade</h1>
          <p className="hero__copy">
            Connect a smartcube, keep white on top with green facing you, and
            turn physical faces to drive classic arcade games.
          </p>
        </div>
        <div className="hero__stats">
          <span>{cubeState.connected ? cubeState.name : "Disconnected"}</span>
          <span>{paused ? "Paused" : "Live"}</span>
          <span>{snapshot.name}</span>
        </div>
      </section>

      <section className="dashboard">
        <aside className="panel stack">
          <div className="panel__header">
            <h2>Connect</h2>
            <button className="ghost-button" onClick={disconnect} type="button">
              Disconnect
            </button>
          </div>
          <p className="panel__copy">
            Hardware flow: click connect, approve the browser Bluetooth chooser,
            pick your device, then keep the cube oriented with white on top and
            green facing you.
          </p>
          <div className="button-row">
            <button onClick={() => void connectHardware()} type="button">
              Connect Smartcube
            </button>
            <button
              className="secondary"
              onClick={() => void connectSimulator()}
              type="button"
            >
              Use Simulator
            </button>
          </div>
          {bluetoothAvailable === false ? (
            <p className="panel__warning">
              Web Bluetooth is unavailable in this browser. Use a Chromium build
              or the simulator.
            </p>
          ) : null}
          {error ? <p className="panel__warning">{error}</p> : null}
          <div className="button-row">
            <button className="secondary" onClick={resyncCube} type="button">
              <RefreshCw size={16} />
              Resync To Solved
            </button>
            <button className="secondary" onClick={resetGame} type="button">
              Reset Game
            </button>
          </div>
          <div className="status-grid">
            <div>
              <span className="status-grid__label">Last turn</span>
              <strong data-testid="status-last-move">
                {cubeState.lastMove ?? "None yet"}
              </strong>
            </div>
            <div>
              <span className="status-grid__label">Translated input</span>
              <strong data-testid="status-last-command">
                {cubeState.lastCommand ?? "Waiting"}
              </strong>
            </div>
            <div>
              <span className="status-grid__label">Move history</span>
              <strong>
                {cubeState.moveHistory.slice(-6).join(" ") || "Empty"}
              </strong>
            </div>
          </div>
          <SimulatorDeck
            enabled={Boolean(session && "simulateMove" in session)}
            onMove={simulateMove}
          />
        </aside>

        <section className="panel panel--wide stack">
          <div className="panel__header">
            <div>
              <h2>Games</h2>
              <p className="panel__copy">{meta.description}</p>
            </div>
            <span className="pill">
              <Gamepad2 size={16} />
              Score {snapshot.score}
            </span>
          </div>
          <div className="game-picker">
            {ARCADE_GAME_IDS.map((id) => (
              <button
                className={
                  id === gameId ? "game-card game-card--active" : "game-card"
                }
                data-testid={`game-card-${id}`}
                key={id}
                onClick={() => selectGame(id)}
                type="button"
              >
                <strong>{prettyGameName(id)}</strong>
                <span>{gameTagline(id)}</span>
              </button>
            ))}
          </div>
          <div className="arcade-stage">
            <div data-testid="game-surface">
              <GameView snapshot={snapshot} />
            </div>
            <div className="arcade-stage__footer">
              <span>
                {snapshot.gameOver
                  ? "Game over"
                  : snapshot.won
                    ? "You won"
                    : "Running"}
              </span>
              <span>{paused ? "Ticker paused" : "Ticker active"}</span>
            </div>
          </div>
        </section>

        <aside className="panel stack">
          <div className="panel__header">
            <div>
              <h2>Control Guide</h2>
              <p className="panel__copy">
                The virtual cube mirrors every accepted turn. Use quarter turns
                for clean inputs and keep the visible guide orientation stable.
              </p>
            </div>
          </div>
          <ControlCube bindings={bindings} facelets={cubeState.facelets} />
          <div className="hint-list">
            {bindings.map((binding) => {
              const gameControl = meta.controls.find(
                (control) => control.command === binding.command,
              );
              return (
                <div className="hint-list__item" key={binding.move}>
                  <div
                    className="hint-list__swatch"
                    style={{ backgroundColor: binding.faceColor }}
                  />
                  <div>
                    <strong>{gameControl?.label ?? binding.command}</strong>
                    <p>
                      {binding.move} on the {binding.faceLabel.toLowerCase()}{" "}
                      face. {gameControl?.effect ?? binding.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <section className="panel panel--wide stack">
          <div className="panel__header">
            <div>
              <h2>AI Coach</h2>
              <p className="panel__copy">
                Uses the Vercel AI SDK route. Without an API key, it falls back
                to a deterministic local coach message.
              </p>
            </div>
            <button
              className="secondary"
              onClick={() => complete(coachPayload)}
              type="button"
            >
              <Sparkles size={16} />
              Generate Briefing
            </button>
          </div>
          <div className="coach-output">
            {isLoading
              ? "Streaming coach response..."
              : completion || "No coaching text yet."}
          </div>
          {coachError ? (
            <p className="panel__warning">{coachError.message}</p>
          ) : null}
        </section>
      </section>
    </main>
  );
}

function prettyGameName(id: string): string {
  switch (id) {
    case "2048":
      return "2048";
    case "breakout":
      return "Breakout";
    case "snake":
      return "Snake";
    case "tetris":
      return "Tetris";
    default:
      return id;
  }
}

function gameTagline(id: string): string {
  switch (id) {
    case "2048":
      return "Directional swipes via white and red turns.";
    case "breakout":
      return "Launch and guide the paddle with cube twists.";
    case "snake":
      return "Four-direction movement mapped straight to cube faces.";
    case "tetris":
      return "A full move set including both rotations and hard drop.";
    default:
      return "";
  }
}

function SimulatorDeck({
  enabled,
  onMove,
}: {
  enabled: boolean;
  onMove: (move: string) => void;
}) {
  return (
    <div className="simulator-deck">
      <div className="panel__header">
        <h3>Simulator</h3>
        <span className="pill">{enabled ? "Ready" : "Enable simulator"}</span>
      </div>
      <p className="panel__copy">
        Use these scripted turns for manual testing, demos, and Playwright E2E
        coverage.
      </p>
      <div className="simulator-deck__buttons">
        {SIMULATOR_MOVES.map((entry) => (
          <button
            className="secondary"
            disabled={!enabled}
            key={entry.move}
            data-testid={`sim-move-${entry.move.replace("'", "prime")}`}
            onClick={() => onMove(entry.move)}
            type="button"
          >
            {entry.move}
            <span>{entry.effect}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
