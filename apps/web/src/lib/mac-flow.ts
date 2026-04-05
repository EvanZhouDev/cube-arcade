export function manualMacAddressForAttempt(
  isMacRetry: boolean,
  manualMacAddress: string,
): string | undefined {
  return isMacRetry ? manualMacAddress : undefined;
}

export function shouldOpenMacAddressModal(
  errorMessage: string | null,
  selectedDeviceName: string | null,
  savedMacAddresses: Record<string, string>,
): boolean {
  if (!errorMessage) {
    return false;
  }

  const needsMacAddress =
    errorMessage.includes("MAC address") ||
    errorMessage.includes("Unable to determine cube MAC address");

  if (!needsMacAddress) {
    return false;
  }

  if (selectedDeviceName && savedMacAddresses[selectedDeviceName]) {
    return false;
  }

  return true;
}
