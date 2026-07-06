# The Boys Casino — Mines

A provably fair Mines gambling game built with vanilla HTML, CSS, and JavaScript. Pick tiles on a 5×5 grid, avoid mines, and cash out before you hit one.

## Quick Start

Open `index.html` in any modern browser — no build step or server required.

```bash
# Optional: serve locally
npx serve .
# or just double-click index.html
```

## How to Play

1. Set your **bet amount** and **number of mines** (1–24 on a 5×5 grid).
2. Click **START GAME** — your bet is deducted from your balance.
3. Click tiles to reveal them:
   - **💎 Safe tile** → multiplier increases
   - **💣 Mine** → game over, bet lost
4. Click **CASH OUT** at any time to collect `bet × multiplier`.
5. Use **PICK RANDOM TILE** to auto-select an unrevealed tile.
6. Toggle **FUN MODE** (demo balance) vs **REAL** (real balance).

## Customizing the Theme

All visual styling is controlled by CSS custom properties in `css/styles.css`. Edit the `:root` block:

```css
:root {
  --bg-app: #0d1117;           /* Page background */
  --bg-panel: #161b22;         /* Panel backgrounds */
  --accent-primary: #58a6ff;   /* Primary buttons, highlights */
  --accent-success: #3fb950;   /* Win / cash out */
  --accent-danger: #f85149;    /* Mine / loss */
  --accent-warning: #d29922;   /* Multiplier display */
  --accent-gem: #39d353;       /* Safe tile glow */
  --text-primary: #e6edf3;     /* Main text */
  --font-family: 'Inter', ...; /* Font stack */
  --tile-size: 72px;           /* Tile dimensions */
  --border-radius: 8px;        /* Corner rounding */
}
```

Change a few variables to completely restyle the game. For a light theme, invert the background and text colors.

## Changing Game Parameters

Edit `GAME_CONFIG` at the top of `js/game.js`:

```js
const GAME_CONFIG = {
  gridSize: 5,           // 5 = 5×5. Change to 6 for 6×6.
  defaultMines: 3,
  minMines: 1,
  maxMines: null,        // null = totalTiles - 1
  defaultBet: 10,
  minBet: 0.01,
  maxBet: 10000,
  houseEdge: 0.01,       // 1% edge per reveal
  demoBalance: 2985.0,
  realBalance: 0.0,
  multiplierTrackSteps: 12,
};
```

Also update the CSS variable when changing grid size:

```css
:root {
  --grid-size: 5;  /* Must match GAME_CONFIG.gridSize */
}
```

## Multiplier Curve

Multipliers use the standard mines probability formula with house edge:

```
multiplier = ∏(remainingTiles / remainingSafeTiles) × (1 - houseEdge)^reveals
```

| Safe Reveals | Multiplier (3 mines, 5×5, 1% edge) |
|---|---|
| 0 | 1.00× |
| 1 | 1.12× |
| 2 | 1.28× |
| 3 | 1.48× |
| 5 | 2.00× |
| 10 | 4.52× |
| 22 (all) | 323× |

## Provably Fair (Placeholder)

The game includes a simulated provably fair system:

- **Server Seed** — generated randomly, only the SHA-256 hash is shown before play
- **Client Seed** — user can set a custom value
- **Nonce** — increments each round
- Mine positions are derived deterministically from `SHA-256(serverSeed:clientSeed:nonce)`

Expand the "Provably Fair" panel in-game to view seeds. Click "Rotate Server Seed" between sessions.

> **Note:** This is a demo implementation. For production, integrate server-side seed management and reveal the server seed after each round.

## File Structure

```
the boys casino/
├── index.html       # Game layout
├── css/
│   └── styles.css   # Theme variables + all styles
├── js/
│   └── game.js      # Game logic + UI controller
└── README.md
```

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge). Uses `crypto.subtle` for hashing — requires HTTPS or localhost in some browsers.
