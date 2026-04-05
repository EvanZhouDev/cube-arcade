import {
  type CommandBinding,
  type FaceName,
  faceletsForFace,
} from "@cube-arcade/smartcube";
import { clsx } from "clsx";
import { useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

const FACE_TRANSFORMS: Record<FaceName, string> = {
  B: "rotateY(180deg) translateZ(var(--cube-half))",
  D: "rotateX(-90deg) translateZ(var(--cube-half))",
  F: "translateZ(var(--cube-half))",
  L: "rotateY(-90deg) translateZ(var(--cube-half))",
  R: "rotateY(90deg) translateZ(var(--cube-half))",
  U: "rotateX(90deg) translateZ(var(--cube-half))",
};

const TURN_SYMBOL: Record<CommandBinding["turn"], string> = {
  clockwise: "↻",
  counterclockwise: "↺",
  double: "⟲2",
};

const VISIBLE_FACES: FaceName[] = ["U", "F", "R", "L", "B", "D"];
const STICKER_KEYS = ["tl", "tm", "tr", "ml", "mm", "mr", "bl", "bm", "br"];
const DEFAULT_ROTATION = { x: -24, y: -34 };
const ROTATION_SENSITIVITY = 0.35;

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
}

interface ControlCubeProps {
  bindings: CommandBinding[];
  facelets: string;
}

function overlayPalette(sticker: string): CSSProperties {
  const isLightSurface = sticker === "U" || sticker === "D";

  return {
    "--overlay-panel": isLightSurface
      ? "rgba(0, 0, 0, 0.62)"
      : "rgba(255, 255, 255, 0.76)",
    "--overlay-shadow": isLightSurface
      ? "rgba(0, 0, 0, 0.16)"
      : "rgba(255, 255, 255, 0.12)",
    "--overlay-text": isLightSurface
      ? "rgba(255, 255, 255, 0.96)"
      : "rgba(5, 7, 11, 0.94)",
  } as CSSProperties;
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
  const palette = overlayPalette(stickers[4] ?? face);
  return (
    <div
      className={clsx("control-cube__face", `control-cube__face--${face}`)}
      style={{
        ...palette,
        transform: FACE_TRANSFORMS[face],
      }}
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
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState(DEFAULT_ROTATION);
  const dragStateRef = useRef<DragState | null>(null);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: rotation.x,
      y: rotation.y,
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    setRotation({
      x: Math.max(
        -82,
        Math.min(82, dragState.x - deltaY * ROTATION_SENSITIVITY),
      ),
      y: dragState.y + deltaX * ROTATION_SENSITIVITY,
    });
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current?.pointerId !== event.pointerId) {
      return;
    }

    dragStateRef.current = null;
    setIsDragging(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  return (
    <div className="control-cube">
      <div
        className={clsx("control-cube__stage", {
          "control-cube__stage--dragging": isDragging,
        })}
        onPointerCancel={handlePointerEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
      >
        <div
          className="control-cube__body"
          data-testid="control-cube-body"
          style={{
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          }}
        >
          <div className="control-cube__core" />
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
