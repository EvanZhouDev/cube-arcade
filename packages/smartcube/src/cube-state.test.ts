import { describe, expect, it } from "vitest";

import {
  SOLVED_FACELETS,
  applyMoveSequence,
  applyMoveToFacelets,
  faceletsForFace,
} from "./cube-state";

describe("cube-state", () => {
  it("returns to solved after a move and its inverse", () => {
    const scrambled = applyMoveToFacelets(SOLVED_FACELETS, "R");
    expect(applyMoveToFacelets(scrambled, "R'")).toBe(SOLVED_FACELETS);
  });

  it("returns to solved after four quarter turns", () => {
    const scrambled = applyMoveSequence(SOLVED_FACELETS, ["U", "U", "U", "U"]);
    expect(scrambled).toBe(SOLVED_FACELETS);
  });

  it("moves the front bottom middle sticker to the right face on F", () => {
    const scrambled = applyMoveToFacelets(SOLVED_FACELETS, "F");
    expect(faceletsForFace(scrambled, "R")[3]).toBe("U");
  });

  it("moves the top front middle sticker to the right face on U", () => {
    const scrambled = applyMoveToFacelets(SOLVED_FACELETS, "U");
    expect(faceletsForFace(scrambled, "R")[1]).toBe("F");
  });
});
