import { useRef } from 'react';

export default function Track({ track, safeRevealed, gameStatus }) {
  const barRef = useRef(null);

  const scroll = (dir) => {
    barRef.current?.scrollBy({ left: dir * 140, behavior: 'smooth' });
  };

  return (
    <div className="track">
      <button type="button" className="track__nav" onClick={() => scroll(-1)} aria-label="Scroll left">
        ‹
      </button>

      <div className="track__bar" ref={barRef}>
        {track.map((node, i) => {
          let cls = 'track-pill';
          if (safeRevealed > node.reveals) cls += ' track-pill--passed';
          if (gameStatus === 'playing' && safeRevealed === node.reveals) cls += ' track-pill--on';

          return (
            <span className="track__item" key={node.reveals}>
              {i > 0 && <span className="track__sep">›</span>}
              <span className={cls}>{node.mult.toFixed(2)}x</span>
            </span>
          );
        })}
      </div>

      <button type="button" className="track__nav" onClick={() => scroll(1)} aria-label="Scroll right">
        ›
      </button>
    </div>
  );
}
