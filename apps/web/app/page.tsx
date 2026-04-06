"use client";

import { ARCADE_GAMES } from "@cube-arcade/game-engine";
import {
  clearPendingBrowserSmartcubeDevice,
  getBindings,
  normalizeSmartcubeMac,
} from "@cube-arcade/smartcube";
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
import {
  manualMacAddressForAttempt,
  shouldOpenMacAddressModal,
} from "../src/lib/mac-flow";

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
const BLUETOOTH_INTERNALS_URL = "chrome://bluetooth-internals/#devices";
const TURN_SYMBOL = {
  clockwise: "↻",
  counterclockwise: "↺",
  double: "⟲",
} as const;
const DEV_KEYBOARD_MOVE_MAP: Record<
  string,
  (typeof SIMULATOR_MOVES)[number]["move"]
> = {
  ArrowDown: "R'",
  ArrowLeft: "U",
  ArrowRight: "U'",
  ArrowUp: "R",
  Enter: "F",
  KeyA: "U",
  KeyD: "U'",
  KeyP: "F2",
  KeyS: "R'",
  KeyW: "R",
  ShiftLeft: "F'",
  ShiftRight: "F'",
  Space: "F",
  KeyX: "F'",
  KeyZ: "F",
};

export default function Page() {
  const searchParams = useSearchParams();
  const isDebugMode = searchParams.get("debug") === "1";
  const isDevOverride = searchParams.get("dev") === "1";

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
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnectionPanelOpen, setIsConnectionPanelOpen] = useState(false);
  const [isHoldGuideOpen, setIsHoldGuideOpen] = useState(false);
  const [isMacModalOpen, setIsMacModalOpen] = useState(false);
  const [savedMacAddresses, setSavedMacAddresses] = useState<
    Record<string, string>
  >({});
  const [manualMacAddress, setManualMacAddress] = useState("");
  const [showMacAddress, setShowMacAddress] = useState(false);
  const simulatorEnabled = Boolean(session && "simulateMove" in session);
  const statusLabel = cubeState.connected ? "CUBE CONNECTED" : "DISCONNECTED";

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
      return;
    }
    setIsConnectionPanelOpen(false);
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

  useEffect(() => {
    if (!isDevOverride || cubeState.connected || session || isConnecting) {
      return;
    }

    void handleSimulatorConnect();
  }, [cubeState.connected, isConnecting, isDevOverride, session]);

  useEffect(() => {
    if (!isDevOverride || !simulatorEnabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const move = DEV_KEYBOARD_MOVE_MAP[event.code];
      if (!move || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      simulateMove(move);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDevOverride, simulateMove, simulatorEnabled]);

  async function handleConnectCube() {
    if (isConnecting) {
      return;
    }
    const isMacRetry = isMacModalOpen;
    setIsConnecting(true);
    setIsMacModalOpen(false);
    try {
      await connectHardware({
        knownMacAddressesByDeviceName: savedMacAddresses,
        manualMacAddress: manualMacAddressForAttempt(
          isMacRetry,
          manualMacAddress,
        ),
      });

      if (useArcadeStore.getState().session) {
        setIsMacModalOpen(false);
        return;
      }

      const state = useArcadeStore.getState();
      if (
        shouldOpenMacAddressModal(
          state.error,
          state.selectedDeviceName,
          savedMacAddresses,
        )
      ) {
        setIsMacModalOpen(true);
      }
    } finally {
      setIsConnecting(false);
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

  function removeSavedMacAddress(deviceName: string) {
    setSavedMacAddresses((current) => {
      const next = { ...current };
      delete next[deviceName];
      return next;
    });
    if (selectedDeviceName === deviceName) {
      setManualMacAddress("");
    }
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
                  {isConnecting ? (
                    <div
                      className="cabinet__overlay-button cabinet__overlay-button--loading"
                      data-testid="connect-cube-loading"
                    >
                      CONNECTING...
                    </div>
                  ) : (
                    <button
                      className="cabinet__overlay-button"
                      data-testid="connect-cube-button"
                      onClick={() => void handleConnectCube()}
                      type="button"
                    >
                      CONNECT CUBE
                    </button>
                  )}
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
                if (cubeState.connected) {
                  setIsConnectionPanelOpen(true);
                } else if (!isConnecting) {
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
          isConnecting={isConnecting}
          manualMacAddress={manualMacAddress}
          onBackdrop={() => {
            clearPendingBrowserSmartcubeDevice();
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

      {isConnectionPanelOpen ? (
        <ConnectionPanelModal
          cubeName={cubeState.name}
          onBackdrop={() => {
            setIsConnectionPanelOpen(false);
          }}
          onDisconnect={async () => {
            setIsConnectionPanelOpen(false);
            await disconnect();
          }}
          onRemoveSavedMacAddress={removeSavedMacAddress}
          savedMacAddresses={savedMacAddresses}
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
  isConnecting,
  manualMacAddress,
  onBackdrop,
  onConnectCube,
  onManualMacChange,
  onRememberMacAddress,
  onToggleMacAddress,
  showMacAddress,
}: {
  deviceName: string | null;
  isConnecting: boolean;
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
              href={BLUETOOTH_INTERNALS_URL}
              onClick={(event) => {
                event.preventDefault();
                if (typeof window === "undefined") {
                  return;
                }
                const opened = window.open(
                  BLUETOOTH_INTERNALS_URL,
                  "_blank",
                  "noopener,noreferrer",
                );
                if (!opened) {
                  window.location.assign(BLUETOOTH_INTERNALS_URL);
                }
              }}
              target="_blank"
              rel="noreferrer"
            >
              {BLUETOOTH_INTERNALS_URL}
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
            {isConnecting ? (
              <div
                className="connect-modal__primary-action connect-modal__primary-action--loading"
                data-testid="connect-cube-modal-loading"
              >
                CONNECTING...
              </div>
            ) : (
              <button
                className="connect-modal__primary-action"
                data-testid="connect-cube-modal-button"
                onClick={() => void onConnectCube()}
                type="button"
              >
                TRY AGAIN
              </button>
            )}
          </div>
        </div>
      </section>
    </dialog>
  );
}

function ConnectionPanelModal({
  cubeName,
  onBackdrop,
  onDisconnect,
  onRemoveSavedMacAddress,
  savedMacAddresses,
}: {
  cubeName: string;
  onBackdrop: () => void;
  onDisconnect: () => Promise<void>;
  onRemoveSavedMacAddress: (deviceName: string) => void;
  savedMacAddresses: Record<string, string>;
}) {
  const savedEntries = Object.entries(savedMacAddresses).sort(
    ([left], [right]) => left.localeCompare(right),
  );

  return (
    <dialog
      className="modal-backdrop"
      data-testid="connection-panel"
      onCancel={(event) => {
        event.preventDefault();
        onBackdrop();
      }}
      open
    >
      <button
        aria-label="Close cube connection panel"
        className="modal-backdrop__scrim"
        onClick={onBackdrop}
        type="button"
      />
      <section className="pixel-panel connect-modal">
        <div className="connect-modal__header">
          <h2>CUBE CONNECTED</h2>
          <button className="ghost-button" onClick={onBackdrop} type="button">
            CLOSE
          </button>
        </div>

        <div className="connect-modal__body">
          <p className="connect-modal__lede">
            Active cube: <strong>{cubeName}</strong>
          </p>
          <div className="connect-modal__hero connect-modal__hero--compact">
            <button
              className="connect-modal__primary-action connect-modal__primary-action--compact connect-modal__primary-action--danger"
              onClick={() => void onDisconnect()}
              type="button"
            >
              DISCONNECT
            </button>
          </div>

          <div className="connect-modal__saved-header">
            <h3>SAVED MAC ADDRESSES</h3>
          </div>

          {savedEntries.length > 0 ? (
            <div className="saved-mac-list">
              {savedEntries.map(([deviceName, macAddress]) => (
                <div className="saved-mac-list__item" key={deviceName}>
                  <div>
                    <strong>{deviceName}</strong>
                    <p>{macAddress}</p>
                  </div>
                  <button
                    className="ghost-button saved-mac-list__remove"
                    onClick={() => {
                      onRemoveSavedMacAddress(deviceName);
                    }}
                    type="button"
                  >
                    REMOVE
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="connect-modal__lede">No saved MAC addresses yet.</p>
          )}
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
    <dialog
      className="modal-backdrop"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      open
    >
      <button
        aria-label="Close hold guide modal"
        className="modal-backdrop__scrim"
        onClick={onClose}
        type="button"
      />
      <section className="pixel-panel connect-modal hold-guide-modal">
        <div className="connect-modal__header">
          <h2>HOW TO HOLD THE CUBE</h2>
          <button className="ghost-button" onClick={onClose} type="button">
            CLOSE
          </button>
        </div>

        <div className="connect-modal__body">
          <p className="connect-modal__lede">
            We denote faces by the color of its center piece (the piece in the
            middle of each face). It&apos;s recommended you hold the cube with
            the white face on top and green face towards you.
          </p>
        </div>
      </section>
    </dialog>
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
