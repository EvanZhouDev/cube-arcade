import { describe, expect, it } from "vitest";

import {
  manualMacAddressForAttempt,
  shouldOpenMacAddressModal,
} from "./mac-flow";

describe("mac flow helpers", () => {
  it("only sends the manual MAC address during modal retry", () => {
    expect(manualMacAddressForAttempt(false, "CC:A3:00:12:34:56")).toBe(
      undefined,
    );
    expect(manualMacAddressForAttempt(true, "CC:A3:00:12:34:56")).toBe(
      "CC:A3:00:12:34:56",
    );
  });

  it("skips the MAC modal when the selected cube already has a saved MAC", () => {
    expect(
      shouldOpenMacAddressModal(
        "Unable to determine cube MAC address.",
        "GAN356 i Carry 2",
        {
          "GAN356 i Carry 2": "CC:A3:00:12:34:56",
        },
      ),
    ).toBe(false);
  });

  it("opens the MAC modal when the selected cube still needs a MAC", () => {
    expect(
      shouldOpenMacAddressModal(
        "Unable to determine cube MAC address.",
        "GAN356 i Carry 2",
        {},
      ),
    ).toBe(true);
  });
});
