import { CONFIG } from '../config.js';

const fmt = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });

const BET_PRESETS = [5, 10, 15];
const MINE_PRESETS = [1, 3, 5, 7];

/** Bottom stats strip — bet, mines, balance, multiplier, profit. */
export default function StatsBar({
  bet, setBet, minesCount, setMines, totalKeys,
  balance, multiplier, profit, gameStatus,
}) {
  const playing = gameStatus === 'playing';
  const customBet = !BET_PRESETS.includes(bet);
  const customMines = !MINE_PRESETS.includes(minesCount);

  return (
    <div className="stats-bar">
      <div className="stats-bar__controls">
        <div className="pill-row">
          <span className="pill-row__lbl">BET</span>
          <div className="pill-row__pills">
            {BET_PRESETS.map((v) => (
              <button
                key={v}
                type="button"
                className={`pill${bet === v ? ' on' : ''}`}
                disabled={playing}
                onClick={() => setBet(v)}
              >
                {v}
              </button>
            ))}
            <button
              type="button"
              className={`pill${customBet ? ' on' : ''}`}
              disabled={playing}
              onClick={() => {
                if (!customBet) setBet(CONFIG.minBet);
              }}
            >
              Custom
            </button>
            {customBet && (
              <input
                className="pill-custom"
                type="number"
                value={bet}
                min={CONFIG.minBet}
                step="0.01"
                disabled={playing}
                onChange={(e) => setBet(+e.target.value)}
              />
            )}
          </div>
        </div>

        <div className="pill-row">
          <span className="pill-row__lbl">MINES</span>
          <div className="pill-row__pills">
            {MINE_PRESETS.map((v) => (
              <button
                key={v}
                type="button"
                className={`pill${minesCount === v ? ' on' : ''}`}
                disabled={playing}
                onClick={() => setMines(v)}
              >
                {v}
              </button>
            ))}
            <button
              type="button"
              className={`pill${customMines ? ' on' : ''}`}
              disabled={playing}
              onClick={() => {
                if (!customMines) setMines(2);
              }}
            >
              Custom
            </button>
            {customMines && (
              <input
                className="pill-custom"
                type="number"
                value={minesCount}
                min={1}
                max={totalKeys - 1}
                disabled={playing}
                onChange={(e) => setMines(+e.target.value)}
              />
            )}
          </div>
        </div>
      </div>

      <div className="stats-bar__readouts">
        <div className="stat">
          <span className="stat__lbl">BALANCE</span>
          <span className="stat__val stat__val--bal">{fmt(balance)}</span>
        </div>
        <div className="stat">
          <span className="stat__lbl">MULT</span>
          <span className="stat__val stat__val--mult">{multiplier.toFixed(2)}×</span>
        </div>
        <div className="stat">
          <span className="stat__lbl">PROFIT</span>
          <span className="stat__val stat__val--profit">{(profit >= 0 ? '+' : '') + fmt(profit)}</span>
        </div>
      </div>
    </div>
  );
}
