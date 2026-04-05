// @ts-nocheck

import {
  GAN_CIC_LIST,
  GAN_ENCRYPTION_KEYS,
  GAN_GEN2_COMMAND_CHARACTERISTIC,
  GAN_GEN2_SERVICE,
  GAN_GEN2_STATE_CHARACTERISTIC,
  GAN_GEN3_COMMAND_CHARACTERISTIC,
  GAN_GEN3_SERVICE,
  GAN_GEN3_STATE_CHARACTERISTIC,
  GAN_GEN4_COMMAND_CHARACTERISTIC,
  GAN_GEN4_SERVICE,
  GAN_GEN4_STATE_CHARACTERISTIC,
} from "./vendor/gan/gan-cube-definitions";
import {
  GanGen2CubeEncrypter,
  GanGen3CubeEncrypter,
  GanGen4CubeEncrypter,
} from "./vendor/gan/gan-cube-encrypter";
import {
  type BluetoothDeviceWithMAC,
  GanCubeClassicConnection,
  type GanCubeConnection,
  GanGen2ProtocolDriver,
  GanGen3ProtocolDriver,
  GanGen4ProtocolDriver,
} from "./vendor/gan/gan-cube-protocol";

type MacAddressProvider = (
  device: BluetoothDevice,
  isFallbackCall?: boolean,
) => Promise<string | null>;

function getManufacturerDataBytes(
  manufacturerData: BluetoothManufacturerData | DataView,
): DataView | undefined {
  if (manufacturerData instanceof DataView) {
    return new DataView(manufacturerData.buffer.slice(2, 11));
  }
  for (const id of GAN_CIC_LIST) {
    if (manufacturerData.has(id)) {
      return new DataView(manufacturerData.get(id)?.buffer.slice(0, 9));
    }
  }
  return undefined;
}

function extractMac(manufacturerData: BluetoothManufacturerData): string {
  const dataView = getManufacturerDataBytes(manufacturerData);
  const mac: string[] = [];
  if (dataView && dataView.byteLength >= 6) {
    for (let index = 1; index <= 6; index += 1) {
      mac.push(
        dataView
          .getUint8(dataView.byteLength - index)
          .toString(16)
          .toUpperCase()
          .padStart(2, "0"),
      );
    }
  }
  return mac.join(":");
}

async function autoRetrieveMacAddress(
  device: BluetoothDevice,
): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    if (typeof device.watchAdvertisements !== "function") {
      resolve(null);
      return;
    }

    const abortController = new AbortController();
    const onAbort = () => {
      device.removeEventListener("advertisementreceived", onAdvertisement);
      abortController.abort();
      resolve(null);
    };
    const onAdvertisement = (event: Event) => {
      device.removeEventListener("advertisementreceived", onAdvertisement);
      abortController.abort();
      const mac = extractMac(
        (event as BluetoothAdvertisingEvent).manufacturerData,
      );
      resolve(mac || null);
    };

    device.addEventListener("advertisementreceived", onAdvertisement);
    device
      .watchAdvertisements({ signal: abortController.signal })
      .catch(onAbort);
    setTimeout(onAbort, 10_000);
  });
}

export async function connectGanCubeWithSelectedDevice(
  device: BluetoothDeviceWithMAC,
  customMacAddressProvider?: MacAddressProvider,
): Promise<GanCubeConnection> {
  const mac =
    (customMacAddressProvider &&
      (await customMacAddressProvider(device, false))) ||
    (await autoRetrieveMacAddress(device)) ||
    (customMacAddressProvider &&
      (await customMacAddressProvider(device, true)));

  if (!mac) {
    throw new Error(
      "Unable to determine cube MAC address, connection is not possible!",
    );
  }
  device.mac = mac;

  const salt = new Uint8Array(
    device.mac
      .split(/[:-\s]+/)
      .map((chunk) => Number.parseInt(chunk, 16))
      .reverse(),
  );

  const gatt = await device.gatt?.connect();
  if (!gatt) {
    throw new Error("Unable to connect to the selected GAN cube.");
  }
  const services = await gatt.getPrimaryServices();

  for (const service of services) {
    const serviceUuid = service.uuid.toLowerCase();
    if (serviceUuid === GAN_GEN2_SERVICE) {
      const commandCharacteristic = await service.getCharacteristic(
        GAN_GEN2_COMMAND_CHARACTERISTIC,
      );
      const stateCharacteristic = await service.getCharacteristic(
        GAN_GEN2_STATE_CHARACTERISTIC,
      );
      const key = device.name?.startsWith("AiCube")
        ? GAN_ENCRYPTION_KEYS[1]
        : GAN_ENCRYPTION_KEYS[0];
      const encrypter = new GanGen2CubeEncrypter(
        new Uint8Array(key.key),
        new Uint8Array(key.iv),
        salt,
      );
      return GanCubeClassicConnection.create(
        device,
        commandCharacteristic,
        stateCharacteristic,
        encrypter,
        new GanGen2ProtocolDriver(),
      );
    }

    if (serviceUuid === GAN_GEN3_SERVICE) {
      const commandCharacteristic = await service.getCharacteristic(
        GAN_GEN3_COMMAND_CHARACTERISTIC,
      );
      const stateCharacteristic = await service.getCharacteristic(
        GAN_GEN3_STATE_CHARACTERISTIC,
      );
      const key = GAN_ENCRYPTION_KEYS[0];
      const encrypter = new GanGen3CubeEncrypter(
        new Uint8Array(key.key),
        new Uint8Array(key.iv),
        salt,
      );
      return GanCubeClassicConnection.create(
        device,
        commandCharacteristic,
        stateCharacteristic,
        encrypter,
        new GanGen3ProtocolDriver(),
      );
    }

    if (serviceUuid === GAN_GEN4_SERVICE) {
      const commandCharacteristic = await service.getCharacteristic(
        GAN_GEN4_COMMAND_CHARACTERISTIC,
      );
      const stateCharacteristic = await service.getCharacteristic(
        GAN_GEN4_STATE_CHARACTERISTIC,
      );
      const key = GAN_ENCRYPTION_KEYS[0];
      const encrypter = new GanGen4CubeEncrypter(
        new Uint8Array(key.key),
        new Uint8Array(key.iv),
        salt,
      );
      return GanCubeClassicConnection.create(
        device,
        commandCharacteristic,
        stateCharacteristic,
        encrypter,
        new GanGen4ProtocolDriver(),
      );
    }
  }

  throw new Error(
    "Can't find target BLE services - wrong or unsupported cube device model",
  );
}
