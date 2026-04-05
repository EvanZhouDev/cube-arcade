import {
  type CommandBinding,
  type FaceName,
  faceletsForFace,
} from "@cube-arcade/smartcube";
import { clsx } from "clsx";
import type { CSSProperties } from "react";

const FACE_TRANSFORMS: Record<FaceName, string> = {
  B: "rotateY(180deg) translateZ(6.4rem)",
  D: "rotateX(-90deg) translateZ(6.4rem)",
  F: "translateZ(6.4rem)",
  L: "rotateY(-90deg) translateZ(6.4rem)",
  R: "rotateY(90deg) translateZ(6.4rem)",
  U: "rotateX(90deg) translateZ(6.4rem)",
};

const TURN_SYMBOL: Record<CommandBinding["turn"], string> = {
  clockwise: "↻",
  counterclockwise: "↺",
  double: "⟲2",
};

const VISIBLE_FACES: FaceName[] = ["U", "F", "R", "L", "B", "D"];
const STICKER_KEYS = ["tl", "tm", "tr", "ml", "mm", "mr", "bl", "bm", "br"];

interface ControlCubeProps {
  bindings: CommandBinding[];
  facelets: string;
}

function StickerFace({
  bindings,
  face,
  facelets,
}: {
  bindings: CommandBinding[];
  face: FaceName;
  facelets: string;
}) {
  const stickers = faceletsForFace(facelets, face);
  return (
    <div
      className={clsx("control-cube__face", `control-cube__face--${face}`)}
      style={{ transform: FACE_TRANSFORMS[face] }}
    >
      <div className="control-cube__face-grid">
        {stickers.map((sticker, index) => (
          <div
            className="control-cube__sticker"
            key={`${face}-${STICKER_KEYS[index] ?? index}`}
            style={
              {
                "--sticker-color": mapStickerColor(sticker),
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="control-cube__face-badge">{face}</div>
      {bindings.length > 0 ? (
        <div className="control-cube__hints">
          {bindings.map((binding) => (
            <div className="control-cube__hint" key={`${face}-${binding.move}`}>
              <span className="control-cube__hint-symbol">
                {TURN_SYMBOL[binding.turn]}
              </span>
              <span className="control-cube__hint-label">
                {binding.command.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function mapStickerColor(sticker: string): string {
  switch (sticker) {
    case "B":
      return "#2957c4";
    case "D":
      return "#f0d43a";
    case "F":
      return "#2f9b46";
    case "L":
      return "#f08a24";
    case "R":
      return "#d6443f";
    case "U":
      return "#f3f5f8";
    default:
      return "#1e1d26";
  }
}

export function ControlCube({ bindings, facelets }: ControlCubeProps) {
  return (
    <div className="control-cube">
      <div className="control-cube__stage">
        <div className="control-cube__body">
          {VISIBLE_FACES.map((face) => (
            <StickerFace
              bindings={bindings.filter((binding) => binding.face === face)}
              face={face}
              facelets={facelets}
              key={face}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
