import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CONFIG } from '../config.js';
import { genSeed, sha256, placeMines } from '../fair.js';

/** Multiplier after n safe reveals (standard mines odds + house edge). */
export function calcMult(n, mines, total) {
  if (!n || !total) return 1;
  let m = 1;
  for (let i = 0; i < n; i++) m *= (total - i) / (total - mines - i);
  return m * Math.pow(1 - CONFIG.houseEdge, n);
}

/**
 * All game state + actions. Pure logic — no sounds or DOM effects;
 * the caller reacts to the returned reveal outcome.
 */
export function useGame(layout) {
  const { totalKeys, boardKeys } = layout;
  const [grid, setGrid] = useState([]);
  const [minesCount, setMinesCount] = useState(3);
  const [bet, setBetState] = useState(10);
  const [mode, setMode] = useState('demo');
  const [balances, setBalances] = useState({
    demo: CONFIG.demoBalance,
    real: CONFIG.realBalance,
  });
  const [gameStatus, setGameStatus] = useState('idle');
  const [safeRevealed, setSafeRevealed] = useState(0);
  const [message, setMessage] = useState({
    text: layout.id === 'numpad'
      ? 'Press START — then tap numpad keys'
      : 'Press START — then click keys or type on your real keyboard',
    type: 'info',
  });
  const nonceRef = useRef(0);

  const [clientSeed, setClientSeedState] = useState(() => genSeed().slice(0, 20));
  const [serverSeed, setServerSeed] = useState(null);
  const [serverSeedHash, setServerSeedHash] = useState(null);
  const [entropyHash, setEntropyHash] = useState(null);
  const [roundId, setRoundId] = useState(0);

  const balance = balances[mode];
  const multiplier = calcMult(safeRevealed, minesCount, totalKeys);

  useEffect(() => {
    setMinesCount((m) => Math.max(1, Math.min(totalKeys - 1, m)));
    setGrid([]);
    setSafeRevealed(0);
    setGameStatus('idle');
    setMessage({
      text: layout.id === 'numpad'
        ? 'Press START — then tap numpad keys'
        : 'Press START — then click keys or type on your real keyboard',
      type: 'info',
    });
  }, [layout.id, totalKeys]);

  const setBalance = useCallback((v) => {
    setBalances((b) => ({ ...b, [mode]: v }));
  }, [mode]);

  const setBet = useCallback((v) => {
    const clamped = Math.max(CONFIG.minBet, Math.min(CONFIG.maxBet, Math.round(v * 10000) / 10000));
    setBetState(Number.isFinite(clamped) ? clamped : CONFIG.minBet);
  }, []);

  const setMines = useCallback((v) => {
    setMinesCount(Math.max(1, Math.min(totalKeys - 1, Math.round(v) || 1)));
  }, [totalKeys]);

  const startGame = useCallback(async () => {
    if (gameStatus === 'playing') return false;
    if (bet > balance) {
      setMessage({ text: 'Insufficient balance', type: 'lose' });
      return false;
    }

    setBalance(balance - bet);
    nonceRef.current += 1;
    const nonce = nonceRef.current;

    const seed = genSeed();
    const commitHash = await sha256(seed);
    const combined = await sha256(`${seed}:${clientSeed}:${nonce}`);
    const mineIds = await placeMines(totalKeys, minesCount, seed, clientSeed, nonce);

    setServerSeed(seed);
    setServerSeedHash(commitHash);
    setEntropyHash(combined);
    setRoundId(nonce);

    setGrid(boardKeys.map((k, i) => ({
      label: k.l,
      keyId: i,
      isMine: mineIds.has(i),
      isRevealed: false,
    })));
    setSafeRevealed(0);
    setGameStatus('playing');
    setMessage({
      text: layout.id === 'numpad'
        ? 'Tap any numpad key — or use RANDOM KEY'
        : 'Click any key — or press it on your real keyboard',
      type: 'info',
    });
    return true;
  }, [gameStatus, bet, balance, minesCount, clientSeed, setBalance, totalKeys, boardKeys, layout.id]);

  const cashOut = useCallback((auto = false, revealedCount = safeRevealed) => {
    if (gameStatus !== 'playing') return;
    if (!auto && !revealedCount) {
      setMessage({ text: 'Reveal a key first', type: 'info' });
      return;
    }

    const mult = calcMult(revealedCount, minesCount, totalKeys);
    const win = bet * mult;
    setBalance(balance + win);
    setGameStatus('cashedout');
    const profit = win - bet;
    setMessage({
      text: auto
        ? `🎉 Cleared! +${profit.toFixed(4)}`
        : `✅ ${mult.toFixed(2)}× +${profit.toFixed(4)}`,
      type: 'win',
    });
  }, [gameStatus, safeRevealed, minesCount, bet, balance, setBalance, totalKeys]);

  const reveal = useCallback((keyId) => {
    if (gameStatus !== 'playing') return null;
    const slot = grid[keyId];
    if (!slot || slot.isRevealed) return null;

    if (slot.isMine) {
      setGrid((g) => g.map((s) => (s.isMine ? { ...s, isRevealed: true } : s)));
      setGameStatus('gameover');
      setMessage({ text: '💀 MINE — game over', type: 'lose' });
      return 'mine';
    }

    const newCount = safeRevealed + 1;
    setGrid((g) => g.map((s) => (s.keyId === keyId ? { ...s, isRevealed: true } : s)));
    setSafeRevealed(newCount);

    if (newCount >= totalKeys - minesCount) {
      cashOut(true, newCount);
    }
    return 'safe';
  }, [gameStatus, grid, safeRevealed, minesCount, cashOut, totalKeys]);

  const randomGameId = useCallback(() => {
    if (gameStatus !== 'playing') return null;
    const hidden = grid.filter((s) => !s.isRevealed);
    if (!hidden.length) return null;
    return hidden[Math.floor(Math.random() * hidden.length)].keyId;
  }, [gameStatus, grid]);

  const setClientSeed = useCallback((v) => {
    if (gameStatus === 'playing') return;
    setClientSeedState(v.slice(0, 64));
  }, [gameStatus]);

  const regenClientSeed = useCallback(() => {
    if (gameStatus === 'playing') return;
    setClientSeedState(genSeed().slice(0, 20));
  }, [gameStatus]);

  const verifyRound = useCallback(async () => {
    if (!serverSeed || !grid.length) return null;
    const ids = await placeMines(totalKeys, minesCount, serverSeed, clientSeed, roundId);
    const boardMines = new Set(grid.filter((s) => s.isMine).map((s) => s.keyId));
    return ids.size === boardMines.size && [...ids].every((i) => boardMines.has(i));
  }, [serverSeed, clientSeed, roundId, minesCount, grid, totalKeys]);

  const newRound = useCallback(() => {
    setGrid([]);
    setSafeRevealed(0);
    setGameStatus('idle');
    setMessage({
      text: layout.id === 'numpad' ? 'Press START to arm the numpad' : 'Press START to arm switches',
      type: 'info',
    });
  }, [layout.id]);

  const track = useMemo(() => {
    return Array.from({ length: CONFIG.trackSteps }, (_, i) => ({
      reveals: i,
      mult: calcMult(i, minesCount, totalKeys),
    }));
  }, [minesCount, totalKeys]);

  const ended = gameStatus === 'gameover' || gameStatus === 'cashedout';

  return {
    grid, minesCount, bet, mode, balance, gameStatus, safeRevealed,
    multiplier, message, track, layout,
    setBet, setMines, setMode, startGame, reveal, randomGameId, cashOut, newRound,
    roundId, serverSeedHash, entropyHash: ended ? entropyHash : null,
    revealedServerSeed: ended ? serverSeed : null,
    clientSeed, setClientSeed, regenClientSeed, verifyRound,
  };
}
