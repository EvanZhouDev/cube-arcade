"use client";

import { ARCADE_GAMES } from "@cube-arcade/game-engine";
import { getBindings, normalizeSmartcubeMac } from "@cube-arcade/smartcube";
import { ControlCube, GameView } from "@cube-arcade/ui";
import { clsx } from "clsx";
import { Eye, EyeOff } from "lucide-react";
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

const GAN_MAC_STORAGE_KEY = "cube-arcade.gan-mac-addresses";
const TURN_SYMBOL = {
  clockwise: "↻",
  counterclockwise: "↺",
  double: "⟲",
} as const;

export default function Page() {
  const searchParams = useSearchParams();
  const isDebugMode = searchParams.get("debug") === "1";

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
  const selectedDeviceName = useArcadeStore(
    (state) => state.selectedDeviceName,
  );
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
  const [isHoldGuideOpen, setIsHoldGuideOpen] = useState(false);
  const [isMacModalOpen, setIsMacModalOpen] = useState(false);
  const [savedMacAddresses, setSavedMacAddresses] = useState<
    Record<string, string>
  >({});
  const [manualMacAddress, setManualMacAddress] = useState("");
  const [showMacAddress, setShowMacAddress] = useState(false);

  useEffect(() => {
    refreshBluetoothAvailability();
  }, [refreshBluetoothAvailability]);

  useEffect(() => {
    const savedMacs = window.localStorage.getItem(GAN_MAC_STORAGE_KEY);
    if (savedMacs) {
      try {
        const parsed = JSON.parse(savedMacs) as Record<string, string>;
        setSavedMacAddresses(parsed);
      } catch {
        window.localStorage.removeItem(GAN_MAC_STORAGE_KEY);
      }
    }
    setHasLoadedStoredMac(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedStoredMac) {
      return;
    }

    if (Object.keys(savedMacAddresses).length > 0) {
      window.localStorage.setItem(
        GAN_MAC_STORAGE_KEY,
        JSON.stringify(savedMacAddresses),
      );
    } else {
      window.localStorage.removeItem(GAN_MAC_STORAGE_KEY);
    }
  }, [hasLoadedStoredMac, savedMacAddresses]);

  useEffect(() => {
    if (!selectedDeviceName) {
      return;
    }
    setManualMacAddress(savedMacAddresses[selectedDeviceName] ?? "");
  }, [savedMacAddresses, selectedDeviceName]);

  useEffect(() => {
    if (cubeState.connected) {
      setIsMacModalOpen(false);
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
  const statusLabel = cubeState.connected ? "CUBE CONNECTED" : "DISCONNECTED";

  async function handleConnectCube() {
    setIsMacModalOpen(false);
    await connectHardware(manualMacAddress);

    if (useArcadeStore.getState().session) {
      setIsMacModalOpen(false);
      return;
    }

    const errorMessage = useArcadeStore.getState().error ?? "";
    if (
      errorMessage.includes("MAC address") ||
      errorMessage.includes("Unable to determine cube MAC address")
    ) {
      setIsMacModalOpen(true);
    }
  }

  async function handleSimulatorConnect() {
    await connectSimulator();
    if (useArcadeStore.getState().session) {
      setIsMacModalOpen(false);
    }
  }

  function rememberMacAddress(value: string) {
    if (!selectedDeviceName) {
      return;
    }
    setSavedMacAddresses((current) => ({
      ...current,
      [selectedDeviceName]: value,
    }));
  }

  return (
    <main
      className="arcade-shell"
      style={{ "--game-accent": meta.accent } as CSSProperties}
    >
      <div className="arcade-content">
        <div className="arcade-layout">
          <aside
            className={clsx("game-sidebar", {
              "game-sidebar--offline": !cubeState.connected,
            })}
          >
            <h1 className="brand-block game-sidebar__brand">CUBE ARCADE</h1>
            <div className="game-sidebar__list">
              {ARCADE_GAMES.map((game) => (
                <button
                  className={clsx("game-sidebar__item", {
                    "game-sidebar__item--active": game.meta.id === gameId,
                  })}
                  data-testid={`game-card-${game.meta.id}`}
                  key={game.meta.id}
                  onClick={() => selectGame(game.meta.id)}
                  type="button"
                >
                  <strong>{game.meta.name}</strong>
                </button>
              ))}
            </div>
          </aside>

          <section className="cabinet">
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
                    className="cabinet__overlay-button"
                    data-testid="connect-cube-button"
                    onClick={() => void handleConnectCube()}
                    type="button"
                  >
                    CONNECT CUBE
                  </button>
                  <output className="cabinet__overlay-feedback">
                    {!cubeState.connected && error && !isMacModalOpen
                      ? "Connection Failed. Please try again."
                      : null}
                  </output>
                </div>
              ) : null}
            </div>
          </section>

          <aside
            className={clsx("cube-sidebar", {
              "cube-sidebar--offline": !cubeState.connected,
            })}
          >
            <button
              className={clsx("status-button", {
                "status-button--connected": cubeState.connected,
              })}
              data-testid="status-button"
              onClick={() => {
                if (!cubeState.connected) {
                  void handleConnectCube();
                }
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
            <div
              className={clsx("cube-sidebar__visual", {
                "cube-sidebar__visual--offline": !cubeState.connected,
              })}
            >
              <ControlCube bindings={bindings} facelets={cubeState.facelets} />
            </div>

            <div className="section-label cube-sidebar__controls-title">
              CONTROLS
            </div>
            <div className="control-list">
              {bindings.map((binding) => {
                return (
                  <div className="control-list__item" key={binding.move}>
                    <div
                      className="control-list__swatch"
                      style={{ backgroundColor: binding.faceColor }}
                    >
                      <span>{TURN_SYMBOL[binding.turn]}</span>
                    </div>
                    <div>
                      <strong>{describeAction(binding.command)}</strong>
                      <p>{describeBinding(binding.face, binding.turn)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              className="ghost-button hold-guide-button"
              onClick={() => {
                setIsHoldGuideOpen(true);
              }}
              type="button"
            >
              HOW TO HOLD THE CUBE
            </button>
          </aside>
        </div>
      </div>

      {isDebugMode ? (
        <DebugSimulatorDock
          enabled={simulatorEnabled}
          onMove={simulateMove}
          onEnableSimulator={() => {
            void handleSimulatorConnect();
          }}
        />
      ) : null}

      {isMacModalOpen ? (
        <MacAddressModal
          deviceName={selectedDeviceName}
          manualMacAddress={manualMacAddress}
          onBackdrop={() => {
            setIsMacModalOpen(false);
          }}
          onConnectCube={handleConnectCube}
          onManualMacChange={setManualMacAddress}
          onRememberMacAddress={rememberMacAddress}
          onToggleMacAddress={() => {
            setShowMacAddress((current) => !current);
          }}
          showMacAddress={showMacAddress}
        />
      ) : null}

      {isHoldGuideOpen ? (
        <HoldGuideModal
          onClose={() => {
            setIsHoldGuideOpen(false);
          }}
        />
      ) : null}
    </main>
  );
}

function describeBinding(
  face: "B" | "D" | "F" | "L" | "R" | "U",
  turn: "clockwise" | "counterclockwise" | "double",
) {
  const faceNames = {
    B: "BLUE FACE",
    D: "YELLOW FACE",
    F: "GREEN FACE",
    L: "ORANGE FACE",
    R: "RED FACE",
    U: "WHITE FACE",
  } as const;

  const turnNames = {
    clockwise: "CW",
    counterclockwise: "CCW",
    double: "DOUBLE TURN",
  } as const;

  return `${faceNames[face]} ${turnNames[turn]}`;
}

function describeAction(command: string) {
  switch (command) {
    case "left":
      return "MOVE LEFT";
    case "right":
      return "MOVE RIGHT";
    case "up":
      return "MOVE UP";
    case "down":
      return "MOVE DOWN";
    case "primary":
      return "PRIMARY";
    case "secondary":
      return "SECONDARY";
    case "pause":
      return "PAUSE";
    default:
      return command.toUpperCase();
  }
}

function MacAddressModal({
  deviceName,
  manualMacAddress,
  onBackdrop,
  onConnectCube,
  onManualMacChange,
  onRememberMacAddress,
  onToggleMacAddress,
  showMacAddress,
}: {
  deviceName: string | null;
  manualMacAddress: string;
  onBackdrop: () => void;
  onConnectCube: () => Promise<void>;
  onManualMacChange: (value: string) => void;
  onRememberMacAddress: (value: string) => void;
  onToggleMacAddress: () => void;
  showMacAddress: boolean;
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
        aria-label="Close MAC address modal"
        className="modal-backdrop__scrim"
        onClick={onBackdrop}
        type="button"
      />
      <section className="pixel-panel connect-modal connect-modal--mac">
        <div className="connect-modal__header">
          <h2>MAC ADDRESS</h2>
          <button className="ghost-button" onClick={onBackdrop} type="button">
            CLOSE
          </button>
        </div>
        <div className="connect-modal__body">
          <p className="connect-modal__lede connect-modal__lede--mac">
            Go to{" "}
            <a
              className="connect-modal__link"
              href="chrome://bluetooth-internals/#devices"
              target="_blank"
              rel="noreferrer"
            >
              chrome://bluetooth-internals/#devices
            </a>{" "}
            to copy the MAC Address of your device
            {deviceName ? ` (${deviceName})` : ""}. Then, paste it here and try
            again.
          </p>

          <div className="field-stack connect-modal__mac-block">
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
                    onRememberMacAddress(normalized);
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
          </div>

          <div className="connect-modal__hero">
            <button
              className="connect-modal__primary-action"
              data-testid="connect-cube-modal-button"
              onClick={() => void onConnectCube()}
              type="button"
            >
              TRY AGAIN
            </button>
          </div>
        </div>
      </section>
    </dialog>
  );
}

function HoldGuideModal({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose} role="presentation">
      <section
        className="pixel-panel connect-modal hold-guide-modal"
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        <div className="connect-modal__header">
          <h2>HOW TO HOLD THE CUBE</h2>
          <button className="ghost-button" onClick={onClose} type="button">
            CLOSE
          </button>
        </div>

        <div className="connect-modal__panel hold-guide-modal__panel">
          <p className="connect-modal__lede">
            Hold the cube with the white face on top and the green face pointing
            toward you.
          </p>
          <div className="hold-guide-modal__grid">
            <div>
              <span>TOP</span>
              <strong>WHITE FACE</strong>
            </div>
            <div>
              <span>FRONT</span>
              <strong>GREEN FACE</strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function DebugSimulatorDock({
  enabled,
  onMove,
  onEnableSimulator,
}: {
  enabled: boolean;
  onMove: (move: string) => void;
  onEnableSimulator: () => void;
}) {
  return (
    <section className="debug-dock">
      <div className="debug-dock__label">DEBUG SIM</div>
      {!enabled ? (
        <button
          className="ghost-button"
          onClick={onEnableSimulator}
          type="button"
        >
          USE SIMULATOR
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
