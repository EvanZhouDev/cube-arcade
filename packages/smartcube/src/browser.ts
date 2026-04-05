import { SessionCore } from "./session";
import type { Quaternion, SmartcubeMove, SmartcubeSession } from "./types";

function isSmartcubeMove(value: string): value is SmartcubeMove {
  return /^(U|R|F|D|L|B)(2|')?$/.test(value);
}

function coerceOrientation(value: unknown): Quaternion | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const maybeOrientation = value as Record<string, unknown>;
  const entries = ["x", "y", "z", "w"] as const;
  for (const key of entries) {
    if (typeof maybeOrientation[key] !== "number") {
      return null;
    }
  }

  return {
    w: maybeOrientation.w as number,
    x: maybeOrientation.x as number,
    y: maybeOrientation.y as number,
    z: maybeOrientation.z as number,
  };
}

export async function connectBrowserSmartcube(): Promise<SmartcubeSession> {
  if (typeof navigator === "undefined" || !("bluetooth" in navigator)) {
    throw new Error(
      "Web Bluetooth is unavailable in this browser. Use Chromium or the simulator.",
    );
  }

  const { connectSmartPuzzle } = await import("cubing/bluetooth");
  const puzzle = await connectSmartPuzzle();
  const session = new SessionCore({
    disconnectImpl: async () => {
      puzzle.disconnect();
    },
    features: {
      battery: false,
      hardwareBluetooth: true,
      orientation: true,
      solvedResync: true,
    },
    mode: "hardware",
    name: puzzle.name() ?? "Smartcube",
  });

  puzzle.addAlgLeafListener((event) => {
    const rawMove = `${event.latestAlgLeaf}`;
    if (!isSmartcubeMove(rawMove)) {
      return;
    }
    session.applyMove(rawMove, event.timeStamp || Date.now());
  });

  puzzle.addOrientationListener((event) => {
    session.setOrientation(coerceOrientation(event.quaternion));
  });

  return session;
}

export function canUseBrowserBluetooth(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}
