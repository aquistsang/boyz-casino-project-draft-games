/** Screen-level overlays: multiplier pops, outcome banners, confetti, diamond flights. */
const CONFETTI_COLORS = ['#00e676', '#d4af37', '#00bcd4', '#e8e0d5'];

/** Big multiplier pop in the middle of the screen after each safe reveal. */
export function CenterPops({ pops }) {
  return pops.map((p) => (
    <span key={p.id} className="center-pop">{p.text}</span>
  ));
}

/** Full-width outcome banner (BOOM / CASHED OUT). */
export function Banner({ banner }) {
  if (!banner) return null;
  return (
    <div key={banner.id} className={`banner banner--${banner.kind}`}>
      {banner.text}
    </div>
  );
}

export function Confetti({ pieces }) {
  return pieces.map((p) => (
    <div
      key={p.id}
      className="confetti"
      style={{ left: p.x, top: p.y, background: CONFETTI_COLORS[p.id % CONFETTI_COLORS.length] }}
    />
  ));
}

/** Top-left diamond counter on the grey keyboard stage. */
export function DiamondCounter({ count }) {
  const visible = count > 0;
  return (
    <div className={`diamond-counter${visible ? ' diamond-counter--on' : ''}`} aria-live="polite">
      <span className="diamond-counter__gem" aria-hidden="true">💎</span>
      <span className="diamond-counter__n">{count}</span>
    </div>
  );
}

/** Diamonds that pop from a key and fly into the counter. */
export function FlyingDiamonds({ flights, onLand }) {
  return flights.map((f) => (
    <span
      key={f.id}
      className="diamond-fly"
      style={{
        '--dx': `${f.dx}px`,
        '--dy': `${f.dy}px`,
        left: f.sx,
        top: f.sy,
      }}
      onAnimationEnd={() => onLand(f.id)}
    >
      💎
    </span>
  ));
}
