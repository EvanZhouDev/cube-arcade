import { describe, expect, it } from "vitest";

import { normalizeSmartcubeMac } from "./browser";

describe("smartcube browser helpers", () => {
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
});
