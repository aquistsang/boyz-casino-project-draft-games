import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getLayout } from './config.js';
import { clickSound, safeSound, explosionSound, winSound } from './audio.js';
import { useGame, calcMult } from './hooks/useGame.js';
import OledBar from './components/OledBar.jsx';
import StatsBar from './components/StatsBar.jsx';
import Keyboard from './components/Keyboard.jsx';
import Track from './components/Track.jsx';
import Actions from './components/Actions.jsx';
import FairPanel from './components/FairPanel.jsx';
import InstructionsModal from './components/InstructionsModal.jsx';
import { useIsMobile, useLowPower } from './hooks/useMedia.js';
import { Confetti, CenterPops, Banner, DiamondCounter, FlyingDiamonds } from './components/Effects.jsx';

let effectId = 0;

export default function App() {
  const isMobile = useIsMobile();
  const layout = useMemo(() => getLayout(isMobile), [isMobile]);
  const game = useGame(layout);
  const chassisRef = useRef(null);
  const stageRef = useRef(null);
  const keyPositionsRef = useRef({});
  const lowPower = useLowPower();
  const [showInstructions, setShowInstructions] = useState(true);
  const [confetti, setConfetti] = useState([]);
  const [shaking, setShaking] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [pops, setPops] = useState([]);
  const [banner, setBanner] = useState(null);
  const [pressed, setPressed] = useState(null);
  const [diamondFlights, setDiamondFlights] = useState([]);
  const [diamondCount, setDiamondCount] = useState(0);

  const closeInstructions = () => {
    setShowInstructions(false);
  };

  const spawnPop = (text) => {
    const pop = { id: ++effectId, text };
    setPops((p) => [...p, pop]);
    setTimeout(() => setPops((p) => p.filter((x) => x.id !== pop.id)), 850);
  };

  const showBanner = (text, kind) => {
    setBanner({ id: ++effectId, text, kind });
    setTimeout(() => setBanner((b) => (b?.text === text ? null : b)), 1800);
  };

  const burstConfetti = () => {
    const r = chassisRef.current?.getBoundingClientRect();
    if (!r) return;
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const pieces = Array.from({ length: lowPower ? 10 : 20 }, () => ({
      id: ++effectId,
      x: cx + (Math.random() - 0.5) * 80,
      y: cy,
    }));
    setConfetti((c) => [...c, ...pieces]);
    setTimeout(() => {
      setConfetti((c) => c.filter((p) => !pieces.includes(p)));
    }, 900);
  };

  const spawnDiamond = (keyId) => {
    const stage = stageRef.current?.getBoundingClientRect();
    const from = keyPositionsRef.current?.projectKey?.(keyId);
    if (!stage) return;

    const sx = from ? from.x - stage.left : stage.width * 0.5;
    const sy = from ? from.y - stage.top : stage.height * 0.55;
    const ex = 28;
    const ey = 28;

    const flight = {
      id: ++effectId,
      sx,
      sy,
      dx: ex - sx,
      dy: ey - sy,
    };
    setDiamondFlights((f) => [...f, flight]);
  };

  const onDiamondLand = useCallback((id) => {
    setDiamondFlights((f) => f.filter((x) => x.id !== id));
    setDiamondCount((n) => n + 1);
  }, []);

  const handlePress = useCallback((keyId) => {
    const pressId = ++effectId;
    setPressed({ keyId, id: pressId });
    setTimeout(() => {
      setPressed((p) => (p?.id === pressId ? null : p));
    }, 180);

    if (game.gameStatus !== 'playing') {
      clickSound();
      return;
    }

    const outcome = game.reveal(keyId);
    if (outcome === 'safe') {
      safeSound();
      spawnDiamond(keyId);
      spawnPop(`${calcMult(game.safeRevealed + 1, game.minesCount, layout.totalKeys).toFixed(2)}×`);
    } else if (outcome === 'mine') {
      explosionSound();
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    } else {
      clickSound();
    }
  }, [game, layout.totalKeys]);

  /* --- physical keyboard (desktop layout only) --- */
  useEffect(() => {
    if (isMobile) return undefined;

    const onKeyDown = (e) => {
      if (e.repeat) return;
      if (document.activeElement?.tagName === 'INPUT') return;
      if ((e.ctrlKey || e.metaKey || e.altKey) && !(e.key in layout.physMap)) return;

      let label = layout.physMap[e.key];
      if (!label && e.key.length === 1) label = e.key.toUpperCase();
      if (!label || !layout.allLabels.has(label)) return;

      e.preventDefault();

      const candidates = layout.boardKeys
        .map((k, i) => ({ label: k.l, keyId: i }))
        .filter((k) => k.label === label);
      const target =
        candidates.find((k) => !game.grid[k.keyId]?.isRevealed) ?? candidates[0];
      if (target) handlePress(target.keyId);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [handlePress, game.grid, isMobile, layout]);

  const prevStatus = useRef(game.gameStatus);
  useEffect(() => {
    const prev = prevStatus.current;
    prevStatus.current = game.gameStatus;

    if (game.gameStatus === 'cashedout' && prev !== 'cashedout') {
      burstConfetti();
      winSound();
      showBanner('💎 CASHED OUT', 'win');
    }

    if (game.gameStatus === 'gameover' && prev !== 'gameover') {
      showBanner('💥 BOOM!', 'lose');
      const t = setTimeout(() => {
        setExploded(true);
        setShaking(true);
        setTimeout(() => setShaking(false), 500);
      }, 600);
      return () => clearTimeout(t);
    }

    if (game.gameStatus === 'idle' || game.gameStatus === 'playing') {
      setExploded(false);
    }

    if (game.gameStatus === 'idle' || (game.gameStatus === 'playing' && prev !== 'playing')) {
      setDiamondCount(0);
      setDiamondFlights([]);
    }
  }, [game.gameStatus]);

  const profit =
    game.gameStatus === 'playing' || game.gameStatus === 'cashedout' || game.gameStatus === 'gameover'
      ? game.bet * game.multiplier - game.bet
      : 0;

  return (
    <>
      <div
        className={`chassis${shaking ? ' chassis--shake' : ''}${isMobile ? ' chassis--mobile' : ''}`}
        ref={chassisRef}
        data-state={game.gameStatus}
        data-layout={layout.id}
      >
        <OledBar
          mode={game.mode}
          setMode={game.setMode}
          minesCount={game.minesCount}
          totalKeys={layout.totalKeys}
          gameStatus={game.gameStatus}
          safeRevealed={game.safeRevealed}
          onShowInstructions={() => setShowInstructions(true)}
        />

        <Track track={game.track} safeRevealed={game.safeRevealed} gameStatus={game.gameStatus} />

        <div className="kb-stage" ref={stageRef}>
          <DiamondCounter count={diamondCount} />
          <FlyingDiamonds flights={diamondFlights} onLand={onDiamondLand} />
          <div className="kb-pop-zone">
            <CenterPops pops={pops} />
            <Banner banner={banner} />
          </div>
          <Keyboard
            rows={layout.rows}
            variant={layout.id}
            grid={game.grid}
            gameStatus={game.gameStatus}
            pressed={pressed}
            onPress={handlePress}
            keyPositionsRef={keyPositionsRef}
          />
        </div>

        <p className={`msg${game.message.type ? ` msg--${game.message.type}` : ''}`}>
          {game.message.text}
        </p>

        <Actions
          gameStatus={game.gameStatus}
          safeRevealed={game.safeRevealed}
          onStart={() => { clickSound(); game.startGame(); }}
          onRandom={() => {
            clickSound();
            const keyId = game.randomGameId();
            if (keyId !== null) handlePress(keyId);
          }}
          onCashOut={() => { clickSound(); game.cashOut(); }}
          onNewRound={() => { clickSound(); game.newRound(); }}
        />

        <StatsBar
          bet={game.bet}
          setBet={game.setBet}
          minesCount={game.minesCount}
          setMines={game.setMines}
          totalKeys={layout.totalKeys}
          balance={game.balance}
          multiplier={game.multiplier}
          profit={profit}
          gameStatus={game.gameStatus}
        />
        <div className="rgb" />
        <FairPanel game={game} />
      </div>

      <Confetti pieces={confetti} />
      {showInstructions && createPortal(
        <InstructionsModal onClose={closeInstructions} layoutId={layout.id} />,
        document.body
      )}
    </>
  );
}
