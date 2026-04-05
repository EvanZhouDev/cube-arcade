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

function badgePalette(sticker: string): CSSProperties {
  const background = mapStickerColor(sticker);
  const darkLabel = "rgba(5, 7, 11, 0.84)";
  const lightLabel = "rgba(255, 255, 255, 0.94)";
  const darkShadow = "rgba(255, 255, 255, 0.22)";
  const lightShadow = "rgba(0, 0, 0, 0.55)";

  const darkContrast = contrastRatio(background, "#05070b");
  const lightContrast = contrastRatio(background, "#ffffff");
  const useDarkLabel = darkContrast >= lightContrast;

  return {
    "--face-label-color": useDarkLabel ? darkLabel : lightLabel,
    "--face-label-shadow": useDarkLabel ? darkShadow : lightShadow,
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
  const palette = badgePalette(stickers[2] ?? stickers[4] ?? face);
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

function contrastRatio(background: string, foreground: string): number {
  const backgroundLuminance = relativeLuminance(hexToRgb(background));
  const foregroundLuminance = relativeLuminance(hexToRgb(foreground));
  const lighter = Math.max(backgroundLuminance, foregroundLuminance);
  const darker = Math.min(backgroundLuminance, foregroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((segment) => `${segment}${segment}`)
          .join("")
      : normalized;

  return {
    b: Number.parseInt(value.slice(4, 6), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    r: Number.parseInt(value.slice(0, 2), 16),
  };
}

function relativeLuminance({
  b,
  g,
  r,
}: {
  b: number;
  g: number;
  r: number;
}) {
  return (
    0.2126 * luminanceChannel(r) +
    0.7152 * luminanceChannel(g) +
    0.0722 * luminanceChannel(b)
  );
}

function luminanceChannel(channel: number) {
  const normalized = channel / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
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
