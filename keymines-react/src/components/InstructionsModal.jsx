import { useMemo } from 'react';

const STEPS_DESKTOP = [
  {
    title: 'BET',
    text: 'Set your bet and mine count in the bar below, then press START GAME.',
    visual: 'bet',
  },
  {
    title: 'PICK',
    text: 'Press keys on your real keyboard or click keycaps. Diamonds are safe — mines end the round!',
    visual: 'pick',
  },
  {
    title: 'CASH OUT',
    text: 'Cash out any time to lock in your multiplier before you hit a mine.',
    visual: 'cash',
  },
];

const STEPS_NUMPAD = [
  {
    title: 'BET',
    text: 'Set your bet and mine count in the bar below, then press START GAME.',
    visual: 'bet',
  },
  {
    title: 'PICK',
    text: 'Tap numpad keys on screen — or use RANDOM KEY. Diamonds are safe, mines end the round!',
    visual: 'pick',
  },
  {
    title: 'CASH OUT',
    text: 'Cash out any time to lock in your multiplier before you hit a mine.',
    visual: 'cash',
  },
];

export default function InstructionsModal({ onClose, layoutId = 'keyboard' }) {
  const steps = useMemo(
    () => (layoutId === 'numpad' ? STEPS_NUMPAD : STEPS_DESKTOP),
    [layoutId]
  );
  const isNumpad = layoutId === 'numpad';

  return (
    <div className="instr-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="How to play">
      <div className="instr-modal" onClick={(e) => e.stopPropagation()}>
        <header className="instr-header">
          <h1 className="instr-title">KEYMINES</h1>
          {isNumpad && <p className="instr-sub">NUMPAD EDITION</p>}
        </header>

        <div className="instr-panels">
          {steps.map((step) => (
            <article className="instr-panel" key={step.title}>
              <div className={`instr-visual instr-visual--${step.visual}`}>
                {step.visual === 'bet' && (
                  <div className="instr-mock instr-mock--bet">
                    <div className="pill-row">
                      <span className="pill-row__lbl">BET</span>
                      <div className="pill-row__pills">
                        <span className="pill">5</span>
                        <span className="pill on">10</span>
                        <span className="pill">15</span>
                        <span className="pill">Custom</span>
                      </div>
                    </div>
                    <div className="pill-row">
                      <span className="pill-row__lbl">MINES</span>
                      <div className="pill-row__pills">
                        <span className="pill">1</span>
                        <span className="pill on">3</span>
                        <span className="pill">5</span>
                        <span className="pill">7</span>
                        <span className="pill">Custom</span>
                      </div>
                    </div>
                    <button type="button" className="instr-mock__start" tabIndex={-1}>START GAME</button>
                  </div>
                )}
                {step.visual === 'pick' && (
                  <div className={`instr-mock instr-mock--pick${isNumpad ? ' instr-mock--numpad' : ''}`}>
                    <div className="instr-keys">
                      {isNumpad ? (
                        <>
                          <span className="instr-key">7</span>
                          <span className="instr-key instr-key--safe">💎</span>
                          <span className="instr-key">9</span>
                          <span className="instr-key instr-key--deco">÷</span>
                          <span className="instr-key">4</span>
                          <span className="instr-key instr-key--mine">💣</span>
                          <span className="instr-key">6</span>
                          <span className="instr-key instr-key--deco">×</span>
                        </>
                      ) : (
                        <>
                          <span className="instr-key instr-key--safe">💎</span>
                          <span className="instr-key instr-key--safe">Q</span>
                          <span className="instr-key instr-key--mine">💣</span>
                          <span className="instr-key">W</span>
                          <span className="instr-key instr-key--safe">E</span>
                          <span className="instr-key">R</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
                {step.visual === 'cash' && (
                  <div className="instr-mock instr-mock--cash">
                    <div className="instr-mock__mult">2.08×</div>
                    <div className="instr-mock__profit">+1.08</div>
                    <button type="button" className="instr-mock__cash">CASH OUT</button>
                  </div>
                )}
              </div>
              <h2 className="instr-panel__title">{step.title}</h2>
              <p className="instr-panel__text">{step.text}</p>
            </article>
          ))}
        </div>

        <button type="button" className="instr-continue" onClick={onClose}>
          CLICK TO CONTINUE
        </button>
      </div>
    </div>
  );
}
