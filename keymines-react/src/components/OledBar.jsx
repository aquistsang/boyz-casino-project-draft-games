import { CONFIG } from '../config.js';

export default function OledBar({ mode, setMode, minesCount, gameStatus, safeRevealed, onShowInstructions }) {
  const playing = gameStatus === 'playing';
  const safe = CONFIG.totalKeys - minesCount;
  const hint = playing
    ? `${minesCount} mines · ${safe - safeRevealed}/${safe} keys left`
    : `${minesCount} mines · ${safe} play keys`;

  return (
    <div className="oled-bar oled-bar--compact">
      <div className="brand">
        <h1>KeyMines 65%</h1>
        <p>Mechanical Edition</p>
      </div>

      <span className="hint hint--center">{hint}</span>

      <div className="oled-bar__right">
        <div className="mode-pill">
          {['demo', 'real'].map((m) => (
            <button
              key={m}
              className={mode === m ? 'on' : ''}
              onClick={() => !playing && setMode(m)}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="info-btn"
          onClick={onShowInstructions}
          title="How to play"
          aria-label="How to play"
        >
          ?
        </button>
      </div>
    </div>
  );
}
