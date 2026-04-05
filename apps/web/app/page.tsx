"use client";

import { ARCADE_GAMES } from "@cube-arcade/game-engine";
import { getBindings, normalizeSmartcubeMac } from "@cube-arcade/smartcube";
import { ControlCube, GameView } from "@cube-arcade/ui";
import { clsx } from "clsx";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useArcadeStore } from "../src/lib/arcade-store";

const SIMULATOR_MOVES = [
  { effect: "Left", move: "U" },
  { effect: "Right", move: "U'" },
  { effect: "Up", move: "R" },
  { effect: "Down", move: "R'" },
  { effect: "Primary", move: "F" },
  { effect: "Secondary", move: "F'" },
  { effect: "Pause", move: "F2" },
] as const;

const GAN_MAC_STORAGE_KEY = "cube-arcade.gan-mac-address";

export default function Page() {
  const searchParams = useSearchParams();
  const isDebugMode = searchParams.get("debug") === "1";

  const bluetoothAvailable = useArcadeStore(
    (state) => state.bluetoothAvailable,
  );
  const connectHardware = useArcadeStore((state) => state.connectHardware);
  const connectGanHardware = useArcadeStore(
    (state) => state.connectGanHardware,
  );
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

  const [hasLoadedStoredMac, setHasLoadedStoredMac] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [manualMacAddress, setManualMacAddress] = useState("");
  const [showMacAddress, setShowMacAddress] = useState(false);
  const [showMacTools, setShowMacTools] = useState(false);

  useEffect(() => {
    refreshBluetoothAvailability();
  }, [refreshBluetoothAvailability]);

  useEffect(() => {
    const savedMac = window.localStorage.getItem(GAN_MAC_STORAGE_KEY);
    if (savedMac) {
      setManualMacAddress(savedMac);
    }
    setHasLoadedStoredMac(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedStoredMac) {
      return;
    }

    if (manualMacAddress) {
      window.localStorage.setItem(GAN_MAC_STORAGE_KEY, manualMacAddress);
    } else {
      window.localStorage.removeItem(GAN_MAC_STORAGE_KEY);
    }
  }, [hasLoadedStoredMac, manualMacAddress]);

  useEffect(() => {
    if (cubeState.connected) {
      setIsConnectModalOpen(false);
    }
  }, [cubeState.connected]);

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

  const simulatorEnabled = Boolean(session && "simulateMove" in session);
  const statusLabel = cubeState.connected
    ? "CUBE CONNECTED"
    : "NO CUBE CONNECTED";

  async function handleStandardConnect() {
    await connectHardware();
    if (useArcadeStore.getState().session) {
      setIsConnectModalOpen(false);
    }
  }

  async function handleGanConnect() {
    await connectGanHardware(manualMacAddress);
    if (useArcadeStore.getState().session) {
      setIsConnectModalOpen(false);
    }
  }

  async function handleSimulatorConnect() {
    await connectSimulator();
    if (useArcadeStore.getState().session) {
      setIsConnectModalOpen(false);
    }
  }

  return (
    <main className="arcade-shell">
      <header className="topbar">
        <div className="topbar__inner">
          <div className="brand-block">
            <p className="brand-block__eyebrow">SMARTCUBE PIXEL ARCADE</p>
            <h1>CUBE ARCADE</h1>
          </div>
          <button
            className={clsx("status-button", {
              "status-button--connected": cubeState.connected,
            })}
            data-testid="status-button"
            onClick={() => {
              setIsConnectModalOpen(true);
            }}
            type="button"
          >
            <span
              className={clsx("status-button__light", {
                "status-button__light--connected": cubeState.connected,
              })}
            />
            <span>{statusLabel}</span>
          </button>
        </div>
      </header>

      <div className="arcade-content">
        <div className="arcade-layout">
          <aside className="pixel-panel game-sidebar">
            <div className="section-label">SELECT GAME</div>
            <div className="game-sidebar__list">
              {ARCADE_GAMES.map((game) => (
                <button
                  className={clsx("game-sidebar__item", {
                    "game-sidebar__item--active": game.meta.id === gameId,
                  })}
                  data-testid={`game-card-${game.meta.id}`}
                  key={game.meta.id}
                  onClick={() => selectGame(game.meta.id)}
                  style={{ "--game-accent": game.meta.accent } as CSSProperties}
                  type="button"
                >
                  <strong>{game.meta.name}</strong>
                  <span>{game.meta.tagline}</span>
                </button>
              ))}
            </div>
          </aside>

          <section
            className="pixel-panel cabinet"
            style={{ "--game-accent": meta.accent } as CSSProperties}
          >
            <div
              className={clsx("cabinet__screen", {
                "cabinet__screen--offline": !cubeState.connected,
              })}
            >
              <div className="cabinet__viewport" data-testid="game-surface">
                <GameView
                  connected={cubeState.connected}
                  onReset={resetGame}
                  paused={paused}
                  snapshot={snapshot}
                />
              </div>
              {!cubeState.connected ? (
                <div className="cabinet__overlay">
                  <p>NO CUBE LINK</p>
                  <button
                    data-testid="connect-cube-button"
                    onClick={() => {
                      setIsConnectModalOpen(true);
                    }}
                    type="button"
                  >
                    CONNECT CUBE
                  </button>
                </div>
              ) : null}
            </div>
          </section>

          <aside className="pixel-panel cube-sidebar">
            <div className="cube-sidebar__orientation">
              <span>ORIENTATION</span>
              <strong>WHITE TOP</strong>
              <strong>GREEN FRONT</strong>
            </div>
            <div className="section-label">CONTROL CUBE</div>
            <div
              className={clsx("cube-sidebar__visual", {
                "cube-sidebar__visual--offline": !cubeState.connected,
              })}
            >
              <ControlCube bindings={bindings} facelets={cubeState.facelets} />
              {!cubeState.connected ? (
                <div className="cube-sidebar__overlay">CUBE OFFLINE</div>
              ) : null}
            </div>

            <div className="signal-strip">
              <div>
                <span>LAST TURN</span>
                <strong data-testid="status-last-move">
                  {cubeState.lastMove ?? "NONE"}
                </strong>
              </div>
              <div>
                <span>INPUT</span>
                <strong data-testid="status-last-command">
                  {cubeState.lastCommand ?? "WAITING"}
                </strong>
              </div>
            </div>

            <div className="section-label cube-sidebar__controls-title">
              CONTROLS
            </div>
            <div className="control-list">
              {bindings.map((binding) => {
                const gameControl = meta.controls.find(
                  (control) => control.command === binding.command,
                );
                return (
                  <div className="control-list__item" key={binding.move}>
                    <div
                      className="control-list__swatch"
                      style={{ backgroundColor: binding.faceColor }}
                    />
                    <div>
                      <strong>{gameControl?.label ?? binding.command}</strong>
                      <p>
                        {binding.move} on {binding.faceLabel.toUpperCase()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {!cubeState.connected ? (
              <button
                className="ghost-button cube-sidebar__connect"
                onClick={() => {
                  setIsConnectModalOpen(true);
                }}
                type="button"
              >
                CONNECT CUBE
              </button>
            ) : null}
          </aside>
        </div>
      </div>

      {isDebugMode ? (
        <DebugSimulatorDock
          enabled={simulatorEnabled}
          onMove={simulateMove}
          onOpenConnect={() => {
            setIsConnectModalOpen(true);
          }}
        />
      ) : null}

      {isConnectModalOpen ? (
        <ConnectModal
          bluetoothAvailable={bluetoothAvailable}
          connected={cubeState.connected}
          cubeName={cubeState.name}
          error={error}
          isDebugMode={isDebugMode}
          manualMacAddress={manualMacAddress}
          onBackdrop={() => {
            setIsConnectModalOpen(false);
          }}
          onConnectGan={handleGanConnect}
          onConnectSimulator={handleSimulatorConnect}
          onConnectStandard={handleStandardConnect}
          onDisconnect={disconnect}
          onManualMacChange={setManualMacAddress}
          onResync={resyncCube}
          onToggleMacAddress={() => {
            setShowMacAddress((current) => !current);
          }}
          onToggleMacTools={() => {
            setShowMacTools((current) => !current);
          }}
          showMacAddress={showMacAddress}
          showMacTools={showMacTools}
        />
      ) : null}
    </main>
  );
}

function ConnectModal({
  bluetoothAvailable,
  connected,
  cubeName,
  error,
  isDebugMode,
  manualMacAddress,
  onBackdrop,
  onConnectGan,
  onConnectSimulator,
  onConnectStandard,
  onDisconnect,
  onManualMacChange,
  onResync,
  onToggleMacAddress,
  onToggleMacTools,
  showMacAddress,
  showMacTools,
}: {
  bluetoothAvailable: boolean | null;
  connected: boolean;
  cubeName: string;
  error: string | null;
  isDebugMode: boolean;
  manualMacAddress: string;
  onBackdrop: () => void;
  onConnectGan: () => Promise<void>;
  onConnectSimulator: () => Promise<void>;
  onConnectStandard: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  onManualMacChange: (value: string) => void;
  onResync: () => void;
  onToggleMacAddress: () => void;
  onToggleMacTools: () => void;
  showMacAddress: boolean;
  showMacTools: boolean;
}) {
  return (
    <dialog
      className="modal-backdrop"
      data-testid="connect-modal"
      onCancel={(event) => {
        event.preventDefault();
        onBackdrop();
      }}
      open
    >
      <button
        aria-label="Close connect modal"
        className="modal-backdrop__scrim"
        onClick={onBackdrop}
        type="button"
      />
      <section className="pixel-panel connect-modal">
        <div className="connect-modal__header">
          <div>
            <div className="section-label">CUBE LINK</div>
            <h2>{connected ? "CONNECTED" : "CONNECT YOUR CUBE"}</h2>
          </div>
          <button className="ghost-button" onClick={onBackdrop} type="button">
            CLOSE
          </button>
        </div>

        {connected ? (
          <div className="connect-modal__panel">
            <p className="connect-modal__lede">
              Active link: <strong>{cubeName}</strong>
            </p>
            <div className="connect-modal__actions">
              <button className="ghost-button" onClick={onResync} type="button">
                <RefreshCw size={16} />
                RESYNC TO SOLVED
              </button>
              <button
                className="ghost-button"
                onClick={onDisconnect}
                type="button"
              >
                DISCONNECT
              </button>
            </div>
          </div>
        ) : (
          <div className="connect-modal__panel">
            <p className="connect-modal__lede">
              Choose the hardware path that matches your cube. The browser will
              open the Bluetooth chooser.
            </p>
            <div className="connect-modal__actions">
              <button
                data-testid="connect-standard-button"
                onClick={() => void onConnectStandard()}
                type="button"
              >
                CONNECT STANDARD
              </button>
              <button
                className="ghost-button"
                data-testid="connect-gan-button"
                onClick={() => void onConnectGan()}
                type="button"
              >
                CONNECT GAN FAMILY
              </button>
            </div>
            {isDebugMode ? (
              <div className="connect-modal__debug">
                <span>DEBUG</span>
                <button
                  className="ghost-button"
                  data-testid="connect-simulator-button"
                  onClick={() => void onConnectSimulator()}
                  type="button"
                >
                  USE SIMULATOR
                </button>
              </div>
            ) : null}
          </div>
        )}

        <div className="connect-modal__panel">
          <button
            className="ghost-button connect-modal__advanced-toggle"
            data-testid="advanced-toggle"
            onClick={onToggleMacTools}
            type="button"
          >
            {showMacTools ? "HIDE ADVANCED" : "SHOW ADVANCED"}
          </button>

          {showMacTools ? (
            <div className="field-stack">
              <label className="field-label" htmlFor="cube-mac-address">
                MANUAL GAN MAC
              </label>
              <div className="input-with-action">
                <input
                  autoComplete="off"
                  className="text-input"
                  data-testid="cube-mac-input"
                  id="cube-mac-address"
                  onBlur={() => {
                    const normalized = normalizeSmartcubeMac(manualMacAddress);
                    if (normalized) {
                      onManualMacChange(normalized);
                    }
                  }}
                  onChange={(event) => {
                    onManualMacChange(event.target.value);
                  }}
                  placeholder="CC:A3:00:12:34:56"
                  spellCheck={false}
                  type={showMacAddress ? "text" : "password"}
                  value={manualMacAddress}
                />
                <button
                  aria-label={
                    showMacAddress ? "Hide MAC address" : "Show MAC address"
                  }
                  className="ghost-button input-with-action__button"
                  data-testid="cube-mac-toggle"
                  onClick={onToggleMacAddress}
                  type="button"
                >
                  {showMacAddress ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showMacAddress ? "HIDE" : "SHOW"}
                </button>
              </div>
              <p className="field-caption">
                Only needed when the browser cannot recover your GAN-family MAC
                from advertisements.
              </p>
            </div>
          ) : null}

          {bluetoothAvailable === false ? (
            <p className="panel__warning">
              WEB BLUETOOTH IS UNAVAILABLE IN THIS BROWSER. USE CHROMIUM OR
              DEBUG SIMULATOR.
            </p>
          ) : null}
          {error ? <p className="panel__warning">{error}</p> : null}
        </div>
      </section>
    </dialog>
  );
}

function DebugSimulatorDock({
  enabled,
  onMove,
  onOpenConnect,
}: {
  enabled: boolean;
  onMove: (move: string) => void;
  onOpenConnect: () => void;
}) {
  return (
    <section className="debug-dock">
      <div className="debug-dock__label">DEBUG SIM</div>
      {!enabled ? (
        <button className="ghost-button" onClick={onOpenConnect} type="button">
          OPEN CONNECT PANEL
        </button>
      ) : (
        <div className="debug-dock__buttons">
          {SIMULATOR_MOVES.map((entry) => (
            <button
              className="ghost-button"
              data-testid={`sim-move-${entry.move.replace("'", "prime")}`}
              key={entry.move}
              onClick={() => onMove(entry.move)}
              type="button"
            >
              <span>{entry.move}</span>
              <span>{entry.effect}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
