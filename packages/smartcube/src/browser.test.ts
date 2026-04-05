import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("gan-web-bluetooth", () => ({
  connectGanCube: vi.fn(),
}));

vi.mock("cubing/bluetooth", () => ({
  connectSmartPuzzle: vi.fn(),
}));

vi.mock("./gan-selected-device", () => ({
  connectGanCubeWithSelectedDevice: vi.fn(),
}));

import { connectSmartPuzzle } from "cubing/bluetooth";
import { connectGanCube } from "gan-web-bluetooth";
import {
  clearPendingBrowserSmartcubeDevice,
  connectBrowserSmartcube,
  normalizeSmartcubeMac,
} from "./browser";
import { connectGanCubeWithSelectedDevice } from "./gan-selected-device";

function createMockGanConnection(deviceName = "GAN356 i Carry 2") {
  return {
    deviceName,
    disconnect: vi.fn(async () => {}),
    events$: {
      subscribe: vi.fn(() => ({
        unsubscribe: vi.fn(),
      })),
    },
    sendCubeCommand: vi.fn(async () => {}),
  };
}

describe("smartcube browser helpers", () => {
  const requestDevice = vi.fn();
  const originalNavigator = globalThis.navigator;
  const connectGanCubeMock = vi.mocked(connectGanCube);
  const connectSmartPuzzleMock = vi.mocked(connectSmartPuzzle);
  const connectGanCubeWithSelectedDeviceMock = vi.mocked(
    connectGanCubeWithSelectedDevice,
  );

  beforeEach(() => {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {
        bluetooth: {
          requestDevice,
        },
      },
    });
  });

  afterEach(() => {
    clearPendingBrowserSmartcubeDevice();
    requestDevice.mockReset();
    connectGanCubeMock.mockReset();
    connectGanCubeWithSelectedDeviceMock.mockReset();
    connectSmartPuzzleMock.mockReset();
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: originalNavigator,
    });
  });

  it("normalizes compact and separated MAC formats", () => {
    expect(normalizeSmartcubeMac("cca300123456")).toBe("CC:A3:00:12:34:56");
    expect(normalizeSmartcubeMac("cc-a3-00-12-34-56")).toBe(
      "CC:A3:00:12:34:56",
    );
    expect(normalizeSmartcubeMac("CC A3 00 12 34 56")).toBe(
      "CC:A3:00:12:34:56",
    );
  });

  it("rejects invalid MAC input", () => {
    expect(normalizeSmartcubeMac("")).toBeNull();
    expect(normalizeSmartcubeMac("12:34:56")).toBeNull();
    expect(normalizeSmartcubeMac("GG:A3:00:12:34:56")).toBeNull();
  });

  it("uses a remembered MAC as soon as the selected GAN cube is identified", async () => {
    requestDevice.mockResolvedValue({
      name: "GAN356 i Carry 2",
    });
    connectGanCubeWithSelectedDeviceMock.mockImplementation(
      async (_device: unknown, macProvider?: () => Promise<string>) => {
        expect(await macProvider?.()).toBe("CC:A3:00:12:34:56");
        return createMockGanConnection();
      },
    );

    await connectBrowserSmartcube({
      knownMacAddressesByDeviceName: {
        "GAN356 i Carry 2": "CC:A3:00:12:34:56",
      },
    });

    expect(requestDevice).toHaveBeenCalledTimes(1);
    expect(connectGanCubeWithSelectedDeviceMock).toHaveBeenCalledTimes(1);
  });

  it("reuses the selected GAN cube for MAC retry without reopening the chooser", async () => {
    requestDevice.mockResolvedValue({
      name: "GAN356 i Carry 2",
    });
    connectGanCubeWithSelectedDeviceMock
      .mockRejectedValueOnce(new Error("Unable to determine cube MAC address."))
      .mockImplementationOnce(
        async (_device: unknown, macProvider?: () => Promise<string>) => {
          expect(await macProvider?.()).toBe("CC:A3:00:12:34:56");
          return createMockGanConnection();
        },
      );

    await expect(connectBrowserSmartcube()).rejects.toMatchObject({
      code: "mac_required",
      deviceName: "GAN356 i Carry 2",
    });
    await connectBrowserSmartcube({
      manualMacAddress: "cc-a3-00-12-34-56",
    });

    expect(requestDevice).toHaveBeenCalledTimes(1);
    expect(connectGanCubeWithSelectedDeviceMock).toHaveBeenCalledTimes(2);
  });
});
