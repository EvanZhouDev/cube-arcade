import { SessionCore } from "./session";
import type { Quaternion, SmartcubeMove, SmartcubeSession } from "./types";

function isSmartcubeMove(value: string): value is SmartcubeMove {
  return /^(U|R|F|D|L|B)(2|')?$/.test(value);
}

function guidanceForConnectionError(error: unknown): Error {
  if (!(error instanceof Error)) {
    return new Error("Unknown smartcube connection error.");
  }

  if (error.message.includes("0000fff0-0000-1000-8000-00805f9b34fb")) {
    return new Error(
      "The selected device did not expose the legacy FFF0 cube service. If this is a GAN, Monster Go, or AiCube model, use Connect GAN Family. QiYi / Tornado cubes still need a dedicated CSTimer-style adapter.",
    );
  }

  return error;
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

  try {
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
  } catch (error) {
    throw guidanceForConnectionError(error);
  }
}

export async function connectGanBrowserSmartcube(): Promise<SmartcubeSession> {
  if (typeof navigator === "undefined" || !("bluetooth" in navigator)) {
    throw new Error(
      "Web Bluetooth is unavailable in this browser. Use Chromium or the simulator.",
    );
  }

  const { connectGanCube } = await import("gan-web-bluetooth");
  const connection = await connectGanCube();
  const session = new SessionCore({
    disconnectImpl: async () => {
      subscription.unsubscribe();
      await connection.disconnect();
    },
    features: {
      battery: true,
      hardwareBluetooth: true,
      orientation: true,
      solvedResync: true,
    },
    mode: "hardware",
    name: connection.deviceName || "GAN Smartcube",
  });

  const subscription = connection.events$.subscribe((event) => {
    switch (event.type) {
      case "BATTERY":
        session.setBatteryLevel(event.batteryLevel);
        break;
      case "DISCONNECT":
        session.markDisconnected();
        break;
      case "FACELETS":
        session.setFacelets(event.facelets);
        break;
      case "GYRO":
        session.setOrientation(event.quaternion);
        break;
      case "HARDWARE":
        session.setName(event.hardwareName ?? connection.deviceName);
        break;
      case "MOVE":
        if (isSmartcubeMove(event.move)) {
          session.applyMove(
            event.move,
            event.localTimestamp ?? event.timestamp ?? Date.now(),
          );
        }
        break;
      default:
        break;
    }
  });

  // Prime facelets and battery so the virtual cube can match the hardware baseline.
  await Promise.allSettled([
    connection.sendCubeCommand({ type: "REQUEST_FACELETS" }),
    connection.sendCubeCommand({ type: "REQUEST_BATTERY" }),
    connection.sendCubeCommand({ type: "REQUEST_HARDWARE" }),
  ]);

  return session;
}

export function canUseBrowserBluetooth(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}
