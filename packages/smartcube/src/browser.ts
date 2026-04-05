import { SessionCore } from "./session";
import type { Quaternion, SmartcubeMove, SmartcubeSession } from "./types";

interface BrowserBluetoothDevice {
  name?: string | null;
}

interface BrowserBluetooth {
  requestDevice: (
    options: Record<string, unknown>,
  ) => Promise<BrowserBluetoothDevice>;
}

interface SmartcubeConnectionError extends Error {
  code?: string;
  deviceName?: string;
}

function browserBluetooth(): BrowserBluetooth {
  return (navigator as unknown as { bluetooth: BrowserBluetooth }).bluetooth;
}

const GAN_GEN2_SERVICE = "6e400001-b5a3-f393-e0a9-e50e24dc4179";
const GAN_GEN3_SERVICE = "8653000a-43e6-47b7-9cb0-5fc21d4ae340";
const GAN_GEN4_SERVICE = "00000010-0000-fff7-fff6-fff5fff4fff0";
const GOCUBE_SERVICE = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const HEYKUBE_SERVICE = "b46a791a-8273-4fc1-9e67-94d3dc2aac1c";
const GIIKER_SERVICE = "0000aadb-0000-1000-8000-00805f9b34fb";
const XIAOMI_MIFIT_SERVICE = "0000fe95-0000-1000-8000-00805f9b34fb";
const QY_SERVICE = "0000aaaa-0000-1000-8000-00805f9b34fb";
const GAN_CIC_LIST = Array.from({ length: 256 }, (_value, index) => {
  return (index << 8) | 0x01;
});
const SMARTCUBE_REQUEST_OPTIONS = {
  filters: [
    { namePrefix: "GAN" },
    { namePrefix: "MG" },
    { namePrefix: "AiCube" },
    { namePrefix: "GoCube" },
    { namePrefix: "Rubik" },
    { namePrefix: "HEYKUBE" },
    { namePrefix: "Gi" },
    { namePrefix: "Mi" },
    { namePrefix: "Hi-" },
    { services: [GIIKER_SERVICE] },
    { services: [QY_SERVICE] },
    { services: [XIAOMI_MIFIT_SERVICE] },
  ],
  optionalManufacturerData: GAN_CIC_LIST,
  optionalServices: [
    GAN_GEN2_SERVICE,
    GAN_GEN3_SERVICE,
    GAN_GEN4_SERVICE,
    GOCUBE_SERVICE,
    HEYKUBE_SERVICE,
    GIIKER_SERVICE,
  ],
} as const;

function isSmartcubeMove(value: string): value is SmartcubeMove {
  return /^(U|R|F|D|L|B)(2|')?$/.test(value);
}

function isGanFamilyDeviceName(name: string | null | undefined): boolean {
  return (
    typeof name === "string" &&
    (name.startsWith("GAN") ||
      name.startsWith("MG") ||
      name.startsWith("AiCube"))
  );
}

export function normalizeSmartcubeMac(value: string): string | null {
  const trimmed = value.trim().toUpperCase();
  if (!trimmed) {
    return null;
  }

  const hex = trimmed.replace(/[^0-9A-F]/g, "");
  if (hex.length !== 12) {
    return null;
  }

  return hex.match(/.{1,2}/g)?.join(":") ?? null;
}

function decorateConnectionError(
  error: unknown,
  deviceName?: string | null,
): SmartcubeConnectionError {
  const resolved =
    error instanceof Error
      ? error
      : new Error("Unknown smartcube connection error.");

  const decorated = resolved as SmartcubeConnectionError;
  if (deviceName) {
    decorated.deviceName = deviceName;
  }
  if (resolved.message.includes("Unable to determine cube MAC address")) {
    decorated.code = "mac_required";
  }
  return decorated;
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

async function requestSmartcubeDevice(): Promise<BrowserBluetoothDevice> {
  return browserBluetooth().requestDevice(SMARTCUBE_REQUEST_OPTIONS);
}

async function withSelectedDevice<T>(
  device: BrowserBluetoothDevice,
  connect: () => Promise<T>,
): Promise<T> {
  const bluetooth = browserBluetooth();
  const originalRequestDevice = bluetooth.requestDevice.bind(bluetooth);
  bluetooth.requestDevice = (async () =>
    device) as typeof bluetooth.requestDevice;

  try {
    return await connect();
  } finally {
    bluetooth.requestDevice = originalRequestDevice;
  }
}

async function connectStandardBrowserSmartcube(
  selectedDevice?: BrowserBluetoothDevice,
): Promise<SmartcubeSession> {
  const { connectSmartPuzzle } = await import("cubing/bluetooth");
  const puzzle = selectedDevice
    ? await withSelectedDevice(selectedDevice, () => connectSmartPuzzle())
    : await connectSmartPuzzle();
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

export async function connectBrowserSmartcube(
  manualMacAddress?: string,
): Promise<SmartcubeSession> {
  if (typeof navigator === "undefined" || !("bluetooth" in navigator)) {
    throw new Error(
      "Web Bluetooth is unavailable in this browser. Use Chromium or the simulator.",
    );
  }

  try {
    const device = await requestSmartcubeDevice();

    if (isGanFamilyDeviceName(device.name)) {
      try {
        return await connectGanBrowserSmartcube(manualMacAddress, device);
      } catch (error) {
        throw decorateConnectionError(error, device.name);
      }
    }

    try {
      return await connectStandardBrowserSmartcube(device);
    } catch (error) {
      throw decorateConnectionError(error, device.name);
    }
  } catch (error) {
    throw guidanceForConnectionError(error);
  }
}

export async function connectGanBrowserSmartcube(
  manualMacAddress?: string,
  selectedDevice?: BrowserBluetoothDevice,
): Promise<SmartcubeSession> {
  if (typeof navigator === "undefined" || !("bluetooth" in navigator)) {
    throw new Error(
      "Web Bluetooth is unavailable in this browser. Use Chromium or the simulator.",
    );
  }

  const { connectGanCube } = await import("gan-web-bluetooth");
  const normalizedMac =
    typeof manualMacAddress === "string"
      ? normalizeSmartcubeMac(manualMacAddress)
      : null;

  if (manualMacAddress?.trim() && !normalizedMac) {
    throw new Error(
      "Enter a valid cube MAC address using 12 hex digits, for example CC:A3:00:12:34:56.",
    );
  }

  const connection = selectedDevice
    ? await withSelectedDevice(selectedDevice, () =>
        connectGanCube(normalizedMac ? async () => normalizedMac : undefined),
      )
    : await connectGanCube(
        normalizedMac ? async () => normalizedMac : undefined,
      );
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
