import { moveToCommand } from "./controls";
import { SOLVED_FACELETS, applyMoveToFacelets } from "./cube-state";
import type {
  CubeCommand,
  Quaternion,
  SmartcubeFeatures,
  SmartcubeMode,
  SmartcubeMove,
  SmartcubeSession,
  SmartcubeState,
  SmartcubeStateListener,
} from "./types";

interface SessionCoreOptions {
  disconnectImpl: () => Promise<void>;
  features: SmartcubeFeatures;
  mode: SmartcubeMode;
  name: string;
}

export class SessionCore implements SmartcubeSession {
  private listeners = new Set<SmartcubeStateListener>();

  private state: SmartcubeState;

  private disconnectImpl: () => Promise<void>;

  constructor(options: SessionCoreOptions) {
    this.disconnectImpl = options.disconnectImpl;
    this.state = {
      batteryLevel: null,
      connected: true,
      facelets: SOLVED_FACELETS,
      features: options.features,
      lastCommand: null,
      lastEventAt: null,
      lastMove: null,
      mode: options.mode,
      moveHistory: [],
      name: options.name,
      orientation: null,
    };
  }

  disconnect = async (): Promise<void> => {
    await this.disconnectImpl();
    this.state = {
      ...this.state,
      connected: false,
    };
    this.emit();
  };

  getState = (): SmartcubeState => this.state;

  resyncToSolved = (): void => {
    this.state = {
      ...this.state,
      facelets: SOLVED_FACELETS,
      lastCommand: null,
      lastMove: null,
      moveHistory: [],
    };
    this.emit();
  };

  subscribe = (listener: SmartcubeStateListener): (() => void) => {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  };

  applyMove(move: SmartcubeMove, eventAt = Date.now()): CubeCommand | null {
    const lastCommand = moveToCommand(move);
    this.state = {
      ...this.state,
      facelets: applyMoveToFacelets(this.state.facelets, move),
      lastCommand,
      lastEventAt: eventAt,
      lastMove: move,
      moveHistory: [...this.state.moveHistory, move].slice(-24),
    };
    this.emit();
    return lastCommand;
  }

  setBatteryLevel(level: number | null): void {
    this.state = {
      ...this.state,
      batteryLevel: level,
    };
    this.emit();
  }

  setName(name: string): void {
    this.state = {
      ...this.state,
      name,
    };
    this.emit();
  }

  setOrientation(orientation: Quaternion | null): void {
    this.state = {
      ...this.state,
      orientation,
    };
    this.emit();
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
