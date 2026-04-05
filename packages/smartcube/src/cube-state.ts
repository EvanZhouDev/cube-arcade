import type { FaceName, SmartcubeMove } from "./types";

export const SOLVED_FACELETS =
  "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";

type Axis = "x" | "y" | "z";

interface Sticker {
  index: number;
  normal: [number, number, number];
  position: [number, number, number];
}

const FACE_ORDER: FaceName[] = ["U", "R", "F", "D", "L", "B"];

const FACE_VECTORS: Record<
  FaceName,
  {
    normal: [number, number, number];
    horizontal: [number, number, number];
    vertical: [number, number, number];
  }
> = {
  B: {
    horizontal: [-1, 0, 0],
    normal: [0, 0, -1],
    vertical: [0, -1, 0],
  },
  D: {
    horizontal: [1, 0, 0],
    normal: [0, -1, 0],
    vertical: [0, 0, -1],
  },
  F: {
    horizontal: [1, 0, 0],
    normal: [0, 0, 1],
    vertical: [0, -1, 0],
  },
  L: {
    horizontal: [0, 0, 1],
    normal: [-1, 0, 0],
    vertical: [0, -1, 0],
  },
  R: {
    horizontal: [0, 0, -1],
    normal: [1, 0, 0],
    vertical: [0, -1, 0],
  },
  U: {
    horizontal: [1, 0, 0],
    normal: [0, 1, 0],
    vertical: [0, 0, 1],
  },
};

const BASE_ROTATIONS: Record<
  FaceName,
  {
    axis: Axis;
    layer: number;
    turns: number;
  }
> = {
  B: { axis: "z", layer: -1, turns: 1 },
  D: { axis: "y", layer: -1, turns: -1 },
  F: { axis: "z", layer: 1, turns: -1 },
  L: { axis: "x", layer: -1, turns: -1 },
  R: { axis: "x", layer: 1, turns: 1 },
  U: { axis: "y", layer: 1, turns: 1 },
};

const STICKERS = buildStickers();
const STICKER_INDEX_BY_KEY = new Map(
  STICKERS.map((sticker) => [
    toStickerKey(sticker.position, sticker.normal),
    sticker.index,
  ]),
);

function buildStickers(): Sticker[] {
  const stickers: Sticker[] = [];
  let index = 0;
  for (const face of FACE_ORDER) {
    const definition = FACE_VECTORS[face];
    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < 3; column += 1) {
        const horizontalOffset = column - 1;
        const verticalOffset = row - 1;
        stickers.push({
          index,
          normal: definition.normal,
          position: [
            definition.normal[0] +
              definition.horizontal[0] * horizontalOffset +
              definition.vertical[0] * verticalOffset,
            definition.normal[1] +
              definition.horizontal[1] * horizontalOffset +
              definition.vertical[1] * verticalOffset,
            definition.normal[2] +
              definition.horizontal[2] * horizontalOffset +
              definition.vertical[2] * verticalOffset,
          ],
        });
        index += 1;
      }
    }
  }
  return stickers;
}

function toStickerKey(
  position: [number, number, number],
  normal: [number, number, number],
): string {
  return `${position.join(",")}|${normal.join(",")}`;
}

function rotateVector(
  vector: [number, number, number],
  axis: Axis,
  quarterTurns: number,
): [number, number, number] {
  let turns = ((quarterTurns % 4) + 4) % 4;
  let [x, y, z] = vector;
  while (turns > 0) {
    if (axis === "x") {
      const nextY = -z;
      const nextZ = y;
      y = nextY;
      z = nextZ;
    } else if (axis === "y") {
      const nextX = z;
      const nextZ = -x;
      x = nextX;
      z = nextZ;
    } else {
      const nextX = -y;
      const nextY = x;
      x = nextX;
      y = nextY;
    }
    turns -= 1;
  }
  return [x, y, z];
}

function parseMove(move: SmartcubeMove): {
  axis: Axis;
  layer: number;
  turns: number;
} {
  const face = move[0] as FaceName;
  const base = BASE_ROTATIONS[face];
  const suffix = move.slice(1);
  const modifier = suffix === "'" ? -1 : suffix === "2" ? 2 : 1;
  return {
    axis: base.axis,
    layer: base.layer,
    turns: base.turns * modifier,
  };
}

export function isValidFacelets(facelets: string): boolean {
  return /^[URFDLB]{54}$/.test(facelets);
}

export function applyMoveToFacelets(
  facelets: string,
  move: SmartcubeMove,
): string {
  if (!isValidFacelets(facelets)) {
    throw new Error("Facelets must be a 54-character URFDLB string.");
  }
  const next = facelets.split("");
  const { axis, layer, turns } = parseMove(move);

  for (const sticker of STICKERS) {
    const coordinate =
      axis === "x"
        ? sticker.position[0]
        : axis === "y"
          ? sticker.position[1]
          : sticker.position[2];
    if (coordinate !== layer) {
      next[sticker.index] = facelets[sticker.index] ?? "";
      continue;
    }

    const rotatedPosition = rotateVector(sticker.position, axis, turns);
    const rotatedNormal = rotateVector(sticker.normal, axis, turns);
    const newIndex = STICKER_INDEX_BY_KEY.get(
      toStickerKey(rotatedPosition, rotatedNormal),
    );
    if (typeof newIndex !== "number") {
      throw new Error(`Unable to map rotated sticker for move ${move}.`);
    }
    next[newIndex] = facelets[sticker.index] ?? "";
  }

  return next.join("");
}

export function applyMoveSequence(
  facelets: string,
  moves: SmartcubeMove[],
): string {
  return moves.reduce(
    (current, move) => applyMoveToFacelets(current, move),
    facelets,
  );
}

export function faceletsForFace(facelets: string, face: FaceName): string[] {
  const offset = FACE_ORDER.indexOf(face) * 9;
  return facelets.slice(offset, offset + 9).split("");
}
