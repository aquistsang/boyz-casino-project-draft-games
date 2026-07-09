import { useEffect, useMemo, useRef } from 'react';

/** Mini particle burst on a mine key. */
function MineBurst({ active }) {
  const particles = useMemo(
    () => Array.from({ length: 10 }, (_, i) => {
      const angle = (i / 10) * Math.PI * 2 + 0.3;
      const dist = 10 + (i % 3) * 6;
      return {
        bx: Math.cos(angle) * dist,
        by: Math.sin(angle) * dist,
        hue: i % 2 ? '#f43f5e' : '#facc15',
      };
    }),
    []
  );

  if (!active) return null;

  return (
    <span className="mine-burst" aria-hidden="true">
      {particles.map((p, i) => (
        <span
          key={i}
          className="mine-burst__p"
          style={{ '--bx': `${p.bx}px`, '--by': `${p.by}px`, background: p.hue }}
        />
      ))}
    </span>
  );
}

/** Flat top-down keyboard — bird's-eye view, no Three.js. */
export default function Keyboard({
  rows, variant = 'keyboard', grid, gameStatus, pressed, onPress, keyPositionsRef,
}) {
  const keyRefs = useRef({});
  const ended = gameStatus === 'gameover' || gameStatus === 'cashedout';
  const showMineFx = gameStatus === 'gameover';

  const rowsWithIds = useMemo(() => {
    let keyId = 0;
    return rows.map((row) =>
      row.map((def) => ({ def, keyId: keyId++ }))
    );
  }, [rows]);

  useEffect(() => {
    if (!keyPositionsRef) return;
    keyPositionsRef.current = {
      projectKey: (keyId) => {
        const el = keyRefs.current[keyId];
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      },
    };
  }, [keyPositionsRef, grid]);

  return (
    <div className={`kb-wrap kb-wrap--${variant}`}>
      <div className={`kb kb--${variant}`}>
        {rowsWithIds.map((row, ri) => (
          <div className="kb-row" key={ri}>
            {row.map(({ def, keyId }) => {
              const slot = grid[keyId] ?? null;
              const isDeco = def.deco ?? def.l.length > 1;
              const isPressed = pressed?.keyId === keyId;
              const isMine = !!slot?.isMine;

              let cls = 'key';
              if (isDeco) cls += ' key--deco';

              if (slot?.isRevealed) {
                if (slot.isMine) cls += ' key--mine';
                else cls += ' key--diamond';
              } else if (ended && slot?.isMine) {
                cls += ' key--mine-ghost';
              }

              if (isPressed) cls += ' key--down';

              const showDiamond = slot?.isRevealed && !slot.isMine;
              const showBomb = !!slot?.isMine && (slot.isRevealed || ended);

              return (
                <button
                  key={keyId}
                  type="button"
                  ref={(el) => { keyRefs.current[keyId] = el; }}
                  className={cls}
                  style={{
                    width: `calc(var(--u) * ${def.w} + var(--key-gap) * ${Math.max(0, def.w - 1)})`,
                  }}
                  onClick={() => onPress(keyId)}
                >
                  {showDiamond ? (
                    <span className="key__gem" aria-label="Diamond">💎</span>
                  ) : showBomb ? (
                    <span className="key__bomb" aria-label="Mine">💣</span>
                  ) : (
                    <span className="key__lbl">{def.l}</span>
                  )}
                  {showMineFx && isMine && slot?.isRevealed && (
                    <MineBurst active />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}