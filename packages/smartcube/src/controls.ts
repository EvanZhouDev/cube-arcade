import type {
  CommandBinding,
  CubeCommand,
  FaceName,
  SmartcubeMove,
} from "./types";

export const FACE_LABELS: Record<FaceName, string> = {
  B: "Blue / back",
  D: "Yellow / bottom",
  F: "Green / front",
  L: "Orange / left",
  R: "Red / right",
  U: "White / top",
};

export const FACE_COLORS: Record<FaceName, string> = {
  B: "#2957c4",
  D: "#f0d43a",
  F: "#2f9b46",
  L: "#f08a24",
  R: "#d6443f",
  U: "#f3f5f8",
};

const DEFAULT_BINDINGS: Record<SmartcubeMove, CubeCommand | null> = {
  B: null,
  "B'": null,
  B2: null,
  D: "right",
  "D'": "left",
  D2: null,
  F: "primary",
  "F'": "secondary",
  F2: "pause",
  L: "down",
  "L'": "up",
  L2: null,
  R: "up",
  "R'": "down",
  R2: null,
  U: "left",
  "U'": "right",
  U2: null,
};

const BINDING_DETAILS: Record<CubeCommand, Omit<CommandBinding, "command">> = {
  down: {
    description: "Turn the red face counterclockwise to move downward.",
    face: "R",
    faceColor: FACE_COLORS.R,
    faceLabel: FACE_LABELS.R,
    move: "R'",
    turn: "counterclockwise",
  },
  left: {
    description: "Turn the white face clockwise to move left.",
    face: "U",
    faceColor: FACE_COLORS.U,
    faceLabel: FACE_LABELS.U,
    move: "U",
    turn: "clockwise",
  },
  pause: {
    description: "Double turn the green face to pause the arcade.",
    face: "F",
    faceColor: FACE_COLORS.F,
    faceLabel: FACE_LABELS.F,
    move: "F2",
    turn: "double",
  },
  primary: {
    description: "Turn the green face clockwise for the main action.",
    face: "F",
    faceColor: FACE_COLORS.F,
    faceLabel: FACE_LABELS.F,
    move: "F",
    turn: "clockwise",
  },
  right: {
    description: "Turn the white face counterclockwise to move right.",
    face: "U",
    faceColor: FACE_COLORS.U,
    faceLabel: FACE_LABELS.U,
    move: "U'",
    turn: "counterclockwise",
  },
  secondary: {
    description:
      "Turn the green face counterclockwise for the alternate action.",
    face: "F",
    faceColor: FACE_COLORS.F,
    faceLabel: FACE_LABELS.F,
    move: "F'",
    turn: "counterclockwise",
  },
  up: {
    description: "Turn the red face clockwise to move upward.",
    face: "R",
    faceColor: FACE_COLORS.R,
    faceLabel: FACE_LABELS.R,
    move: "R",
    turn: "clockwise",
  },
};

export function moveToCommand(move: SmartcubeMove): CubeCommand | null {
  return DEFAULT_BINDINGS[move];
}

export function getBinding(command: CubeCommand): CommandBinding {
  return {
    command,
    ...BINDING_DETAILS[command],
  };
}

export function getBindings(commands: CubeCommand[]): CommandBinding[] {
  return commands.map(getBinding);
}
