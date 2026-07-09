/**
 * Game configuration & board layouts.
 * Widths (w) are in "u" units — 1u = one standard key width.
 */

/** ANSI 65% layout (F-row removed). */
export const KB_ROWS = [
  [
    { l: '`', w: 1 }, { l: '1', w: 1 }, { l: '2', w: 1 }, { l: '3', w: 1 }, { l: '4', w: 1 },
    { l: '5', w: 1 }, { l: '6', w: 1 }, { l: '7', w: 1 }, { l: '8', w: 1 }, { l: '9', w: 1 },
    { l: '0', w: 1 }, { l: '-', w: 1 }, { l: '=', w: 1 }, { l: 'Bksp', w: 2 }, { l: 'Del', w: 1 },
  ],
  [
    { l: 'Tab', w: 1.5 }, { l: 'Q', w: 1 }, { l: 'W', w: 1 }, { l: 'E', w: 1 }, { l: 'R', w: 1 },
    { l: 'T', w: 1 }, { l: 'Y', w: 1 }, { l: 'U', w: 1 }, { l: 'I', w: 1 }, { l: 'O', w: 1 },
    { l: 'P', w: 1 }, { l: '[', w: 1 }, { l: ']', w: 1 }, { l: '\\', w: 1.5 }, { l: 'PgUp', w: 1 },
  ],
  [
    { l: 'Caps', w: 1.75 }, { l: 'A', w: 1 }, { l: 'S', w: 1 }, { l: 'D', w: 1 }, { l: 'F', w: 1 },
    { l: 'G', w: 1 }, { l: 'H', w: 1 }, { l: 'J', w: 1 }, { l: 'K', w: 1 }, { l: 'L', w: 1 },
    { l: ';', w: 1 }, { l: "'", w: 1 }, { l: 'Enter', w: 2.25 }, { l: 'PgDn', w: 1 },
  ],
  [
    { l: 'Shift', w: 2.25 }, { l: 'Z', w: 1 }, { l: 'X', w: 1 }, { l: 'C', w: 1 }, { l: 'V', w: 1 },
    { l: 'B', w: 1 }, { l: 'N', w: 1 }, { l: 'M', w: 1 }, { l: ',', w: 1 }, { l: '.', w: 1 },
    { l: '/', w: 1 }, { l: 'Shift', w: 2.75 }, { l: 'End', w: 1 },
  ],
  [
    { l: 'Ctrl', w: 1.25 }, { l: 'Win', w: 1.25 }, { l: 'Alt', w: 1.25 },
    { l: 'Space', w: 11.25 },
  ],
];

/** Mobile numpad — 4×4 calculator layout, portrait-friendly. */
export const NUMPAD_ROWS = [
  [
    { l: '7', w: 1 }, { l: '8', w: 1 }, { l: '9', w: 1 }, { l: '÷', w: 1, deco: true },
  ],
  [
    { l: '4', w: 1 }, { l: '5', w: 1 }, { l: '6', w: 1 }, { l: '×', w: 1, deco: true },
  ],
  [
    { l: '1', w: 1 }, { l: '2', w: 1 }, { l: '3', w: 1 }, { l: '−', w: 1, deco: true },
  ],
  [
    { l: 'C', w: 1, deco: true }, { l: '0', w: 1 }, { l: '.', w: 1 }, { l: '+', w: 1, deco: true },
  ],
];

const KEYBOARD_PHYS_MAP = {
  Tab: 'Tab', CapsLock: 'Caps', Shift: 'Shift', Enter: 'Enter',
  Backspace: 'Bksp', Delete: 'Del', PageUp: 'PgUp', PageDown: 'PgDn',
  End: 'End', Control: 'Ctrl', Meta: 'Win', Alt: 'Alt', ' ': 'Space',
};

function buildLayout(id, rows, physMap = {}) {
  const boardKeys = rows.flat();
  return {
    id,
    rows,
    boardKeys,
    totalKeys: boardKeys.length,
    physMap,
    allLabels: new Set(boardKeys.map((k) => k.l)),
  };
}

export const LAYOUTS = {
  keyboard: buildLayout('keyboard', KB_ROWS, KEYBOARD_PHYS_MAP),
  numpad: buildLayout('numpad', NUMPAD_ROWS),
};

/** Pick board layout from viewport — mobile gets numpad, desktop gets full keyboard. */
export function getLayout(isMobile) {
  return isMobile ? LAYOUTS.numpad : LAYOUTS.keyboard;
}

/** @deprecated use LAYOUTS.keyboard.boardKeys */
export const BOARD_KEYS = LAYOUTS.keyboard.boardKeys;

export const CONFIG = {
  minBet: 0.01,
  maxBet: 10000,
  betStep: 1,
  houseEdge: 0.02, // 98% RTP
  demoBalance: 2985,
  realBalance: 0,
  trackSteps: 13,
};

/** @deprecated use LAYOUTS.keyboard */
export const PHYS_MAP = KEYBOARD_PHYS_MAP;

/** @deprecated use LAYOUTS.keyboard.allLabels */
export const ALL_LABELS = LAYOUTS.keyboard.allLabels;
