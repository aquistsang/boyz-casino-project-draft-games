import { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';
import { KB_ROWS } from '../config.js';

/* ---- layout constants (1 unit = 1u keycap) ---- */
const U = 1;
const GAP = 0.14;
const KEY_H = 0.5;
const KEY_D = 0.92;
const ROW_ADV = KEY_D + GAP + 0.06;
const GRAVITY = 14;
const DESK_Y = -0.7;

/* ---- palette ---- */
const COL = {
  alphaFace: '#d8d2c4',
  alphaLegend: '#3a342a',
  decoFace: '#55565a',
  decoLegend: '#c8c9cd',
  used: '#c8c4b8',
  usedDeco: '#4a4b4f',
  mine: '#c62828',
  mineEmissive: '#ff1744',
  ghost: '#4a1515',
};

const _rgb = new THREE.Color();

/* Blue-only wave — hue locked to cyan→navy, brightness sweeps diagonally. */
const WAVELEN = 16;
const WAVE_SPEED = 1.6;

function sampleWave(x, z, t, offset = 0) {
  const u = (x * 0.55 + z * 0.48 + offset - t * WAVE_SPEED) / WAVELEN;
  const phase = ((u % 1) + 1) % 1;
  const crest = (Math.cos(u * Math.PI * 2) + 1) * 0.5;
  return { phase, crest };
}

function rgbWave(x, z, t, offset = 0) {
  const { phase, crest } = sampleWave(x, z, t, offset);
  const hue = 0.54 + phase * 0.1; // cyan → deep blue only
  const sat = 0.6 + crest * 0.35;
  const lit = 0.14 + phase * 0.22 + crest * 0.38;
  _rgb.setHSL(hue, sat, lit);
  return _rgb;
}

function waveIntensity(x, z, t, offset = 0) {
  return 0.4 + sampleWave(x, z, t, offset).crest * 1.2;
}

/** Flatten KB_ROWS into positioned key descriptors (index matches BOARD_KEYS order). */
function useLayout() {
  return useMemo(() => {
    const keys = [];
    const rowWidths = KB_ROWS.map((row) =>
      row.reduce((acc, k) => acc + k.w * U + (k.w - 1) * GAP + GAP, -GAP)
    );
    const maxW = Math.max(...rowWidths);
    const totalD = KB_ROWS.length * ROW_ADV - GAP;

    let flatIndex = 0;
    KB_ROWS.forEach((row, ri) => {
      let x = -maxW / 2;
      row.forEach((def) => {
        const w = def.w * U + (def.w - 1) * GAP;
        keys.push({
          id: flatIndex,
          keyId: flatIndex,
          def,
          w,
          x: x + w / 2,
          z: ri * ROW_ADV - totalD / 2 + KEY_D / 2,
          ri,
        });
        flatIndex += 1;
        x += w + GAP;
      });
    });
    return { keys, maxW, totalD };
  }, []);
}

/** Fiery debris burst where a mine detonates. */
function MineBurst() {
  const COUNT = 16;
  const parts = useMemo(() =>
    Array.from({ length: COUNT }, () => ({
      v: new THREE.Vector3((Math.random() - 0.5) * 7, 3 + Math.random() * 5, (Math.random() - 0.5) * 7),
      r: new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6),
    })), []);
  const refs = useRef([]);
  const t0 = useRef(null);

  useFrame(({ clock }, dt) => {
    if (t0.current === null) t0.current = clock.elapsedTime;
    const t = clock.elapsedTime - t0.current;
    parts.forEach((p, i) => {
      const m = refs.current[i];
      if (!m) return;
      p.v.y -= GRAVITY * dt;
      m.position.addScaledVector(p.v, dt);
      m.rotation.x += p.r.x * dt;
      m.rotation.y += p.r.y * dt;
      m.material.opacity = Math.max(0, 1 - t / 0.9);
    });
  });

  return parts.map((_, i) => (
    <mesh key={i} ref={(el) => (refs.current[i] = el)}>
      <boxGeometry args={[0.12, 0.12, 0.12]} />
      <meshStandardMaterial
        color={i % 2 ? '#ff7043' : '#ffca28'}
        emissive={i % 2 ? '#ff3d00' : '#ffab00'}
        emissiveIntensity={2}
        transparent
      />
    </mesh>
  ));
}

/**
 * One 3D keycap with RGB underglow wave, press dip, reveal colours,
 * and free-flight physics when the board explodes.
 */
function Keycap({ k, slot, gameStatus, exploded, pressed, onPress }) {
  const group = useRef();
  const capMat = useRef();
  const glowMat = useRef();
  const isAlphaLook = k.def.l.length === 1;
  const ended = gameStatus === 'gameover' || gameStatus === 'cashedout';

  const [burstKey, setBurstKey] = useState(0);
  const prevRevealed = useRef(false);

  const phys = useRef({ active: false, v: new THREE.Vector3(), av: new THREE.Vector3() });
  const pressT = useRef(-1);

  useEffect(() => {
    if (pressed && pressed.keyId === k.keyId) pressT.current = performance.now();
  }, [pressed, k.keyId]);

  useEffect(() => {
    const rev = !!slot?.isRevealed;
    if (rev && !prevRevealed.current && slot.isMine) {
      setBurstKey((n) => n + 1);
    }
    prevRevealed.current = rev;
  }, [slot?.isRevealed, slot?.isMine]);

  useFrame(({ clock }, rawDt) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(rawDt, 0.05);
    const p = phys.current;
    const t = clock.elapsedTime;

    if (exploded) {
      if (!p.active) {
        p.active = true;
        p.v.set((Math.random() - 0.5) * 8, 4 + Math.random() * 6, (Math.random() - 0.5) * 8);
        p.av.set((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12);
      }
      p.v.y -= GRAVITY * dt;
      g.position.addScaledVector(p.v, dt);
      g.rotation.x += p.av.x * dt;
      g.rotation.y += p.av.y * dt;
      g.rotation.z += p.av.z * dt;

      if (g.position.y < DESK_Y + KEY_H / 2 && p.v.y < 0) {
        g.position.y = DESK_Y + KEY_H / 2;
        if (Math.abs(p.v.y) > 1) {
          p.v.y *= -0.35;
          p.v.x *= 0.7;
          p.v.z *= 0.7;
          p.av.multiplyScalar(0.5);
        } else {
          p.v.set(0, 0, 0);
          p.av.set(0, 0, 0);
        }
      }
      return;
    }

    if (p.active) {
      p.active = false;
      g.position.set(k.x, KEY_H / 2, k.z);
      g.rotation.set(0, 0, 0);
    }

    const since = pressT.current < 0 ? Infinity : (performance.now() - pressT.current) / 1000;
    const targetY = since < 0.12 ? KEY_H / 2 - 0.16 : KEY_H / 2;
    g.position.y += (targetY - g.position.y) * Math.min(1, dt * 30);

    /* RGB wave on unrevealed keys */
    if (!slot?.isRevealed && capMat.current && glowMat.current) {
      const c = rgbWave(k.x, k.z, t);
      const glow = waveIntensity(k.x, k.z, t);
      glowMat.current.emissive.copy(c);
      glowMat.current.emissiveIntensity = glow;
      glowMat.current.color.copy(c).multiplyScalar(0.3);

      const base = new THREE.Color(isAlphaLook ? COL.alphaFace : COL.decoFace);
      capMat.current.color.copy(base).lerp(c, 0.18);
      capMat.current.emissive.copy(c);
      capMat.current.emissiveIntensity = 0.15 + glow * 0.22;
    }
  });

  /* static face colours for revealed / ended states */
  let face = isAlphaLook ? COL.alphaFace : COL.decoFace;
  let legend = isAlphaLook ? COL.alphaLegend : COL.decoLegend;
  let emissive = '#000000';
  let emissiveIntensity = 0;
  const label = k.def.l;

  if (slot) {
    if (slot.isRevealed) {
      if (slot.isMine) {
        face = COL.mine; emissive = COL.mineEmissive; emissiveIntensity = 0.6; legend = '#ffdddd';
      } else {
        /* Safe: muted used key — diamond flies to HUD instead of green glow */
        face = isAlphaLook ? COL.used : COL.usedDeco;
        legend = isAlphaLook ? '#6a645a' : '#9a9b9f';
      }
    } else if (ended && slot.isMine) {
      face = COL.ghost; legend = '#c98080';
    }
  }

  const clickProps = {
    onClick: (e) => { e.stopPropagation(); onPress(k.keyId); },
    onPointerOver: () => (document.body.style.cursor = 'pointer'),
    onPointerOut: () => (document.body.style.cursor = 'default'),
  };

  return (
    <group ref={group} position={[k.x, KEY_H / 2, k.z]}>
      {/* per-key RGB underglow pad */}
      {!slot?.isRevealed && (
        <mesh position={[0, -KEY_H / 2 - 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[k.w * 0.88, KEY_D * 0.88]} />
          <meshStandardMaterial
            ref={glowMat}
            transparent
            opacity={0.92}
            roughness={0.2}
            metalness={0.1}
          />
        </mesh>
      )}

      <RoundedBox
        args={[k.w, KEY_H, KEY_D]}
        radius={0.07}
        smoothness={3}
        castShadow
        receiveShadow
        {...clickProps}
      >
        <meshStandardMaterial
          ref={capMat}
          color={face}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          roughness={0.45}
          metalness={0.08}
        />
      </RoundedBox>

      <Text
        position={[0, KEY_H / 2 + 0.011, 0.06]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={k.def.l.length > 1 ? 0.22 : 0.34}
        color={legend}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>

      {burstKey > 0 && <MineBurst key={burstKey} />}
    </group>
  );
}

/** Project each key’s world position into viewport pixels for HUD diamond flights. */
function KeyProjector({ keys, positionsRef }) {
  const { camera, gl } = useThree();
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const rect = gl.domElement.getBoundingClientRect();
    const map = {};
    keys.forEach((k) => {
      tmp.set(k.x, KEY_H * 0.9, k.z).project(camera);
      map[k.keyId] = {
        x: (tmp.x * 0.5 + 0.5) * rect.width + rect.left,
        y: (-tmp.y * 0.5 + 0.5) * rect.height + rect.top,
      };
    });
    positionsRef.current = map;
  });

  return null;
}

/** Keyboard chassis — top-down visible bezel ring + side walls + blue underglow strip. */
function KeyboardFrame({ maxW, totalD }) {
  const stripFront = useRef();
  const stripBack = useRef();
  const stripLeft = useRef();
  const stripRight = useRef();

  const bezelW = 0.58;          // visible mat width around keys (bird's-eye)
  const outerW = maxW + bezelW * 2 + 0.5;
  const outerD = totalD + bezelW * 2 + 0.5;
  const innerW = maxW + 0.28;
  const innerD = totalD + 0.28;
  const deckY = 0.06;           // top of frame deck (just below keycap bases)
  const deckH = 0.22;
  const wallH = 0.75;
  const baseH = 0.45;

  const stripPos = useMemo(() => ([
    { x: 0, z: outerD / 2 },
    { x: 0, z: -outerD / 2 },
    { x: -outerW / 2, z: 0 },
    { x: outerW / 2, z: 0 },
  ]), [outerW, outerD]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    [stripFront, stripBack, stripLeft, stripRight].forEach((ref, i) => {
      if (!ref.current) return;
      const { x, z } = stripPos[i];
      const c = rgbWave(x, z, t);
      ref.current.emissive.copy(c);
      ref.current.color.copy(c).multiplyScalar(0.3);
      ref.current.emissiveIntensity = waveIntensity(x, z, t);
    });
  });

  const frameMat = <meshStandardMaterial color="#3d4a5c" roughness={0.32} metalness={0.55} />;
  const shellMat = <meshStandardMaterial color="#252c38" roughness={0.28} metalness={0.65} />;
  const recessMat = <meshStandardMaterial color="#0a0d12" roughness={0.85} metalness={0.15} />;

  const zFront = innerD / 2 + bezelW / 2;
  const zBack = -innerD / 2 - bezelW / 2;
  const xLeft = -innerW / 2 - bezelW / 2;
  const xRight = innerW / 2 + bezelW / 2;

  return (
    <group>
      {/* bottom chassis block */}
      <mesh position={[0, -baseH / 2 - 0.32, 0]} castShadow receiveShadow>
        <boxGeometry args={[outerW + 0.4, baseH, outerD + 0.4]} />
        {shellMat}
      </mesh>

      {/* === TOP-VISIBLE BEZEL RING (picture-frame mat around keys) === */}
      {/* front rail */}
      <mesh position={[0, deckY, zFront]} castShadow receiveShadow>
        <boxGeometry args={[outerW, deckH, bezelW]} />
        {frameMat}
      </mesh>
      {/* back rail */}
      <mesh position={[0, deckY, zBack]} castShadow receiveShadow>
        <boxGeometry args={[outerW, deckH, bezelW]} />
        {frameMat}
      </mesh>
      {/* left rail */}
      <mesh position={[xLeft, deckY, 0]} castShadow receiveShadow>
        <boxGeometry args={[bezelW, deckH, innerD]} />
        {frameMat}
      </mesh>
      {/* right rail */}
      <mesh position={[xRight, deckY, 0]} castShadow receiveShadow>
        <boxGeometry args={[bezelW, deckH, innerD]} />
        {frameMat}
      </mesh>

      {/* brass outer trim — visible gold edge from above */}
      <mesh position={[0, deckY + deckH / 2 + 0.018, 0]}>
        <boxGeometry args={[outerW + 0.1, 0.035, outerD + 0.1]} />
        <meshStandardMaterial color="#c9a020" roughness={0.18} metalness={0.95} />
      </mesh>

      {/* recessed switch well where keys sit */}
      <mesh position={[0, deckY - deckH / 2 - 0.04, 0]} receiveShadow>
        <boxGeometry args={[innerW, 0.1, innerD]} />
        {recessMat}
      </mesh>

      {/* === SIDE WALLS (visible with slight camera tilt) === */}
      <mesh position={[0, deckY - wallH / 2 + 0.04, outerD / 2 + 0.06]} castShadow>
        <boxGeometry args={[outerW + 0.08, wallH, 0.14]} />
        {shellMat}
      </mesh>
      <mesh position={[0, deckY - wallH / 2 + 0.04, -outerD / 2 - 0.06]} castShadow>
        <boxGeometry args={[outerW + 0.08, wallH, 0.14]} />
        {shellMat}
      </mesh>
      <mesh position={[-outerW / 2 - 0.06, deckY - wallH / 2 + 0.04, 0]} castShadow>
        <boxGeometry args={[0.14, wallH, outerD + 0.08]} />
        {shellMat}
      </mesh>
      <mesh position={[outerW / 2 + 0.06, deckY - wallH / 2 + 0.04, 0]} castShadow>
        <boxGeometry args={[0.14, wallH, outerD + 0.08]} />
        {shellMat}
      </mesh>

      {/* corner screw posts on bezel */}
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz], i) => (
        <mesh
          key={i}
          position={[sx * (outerW / 2 - 0.22), deckY + 0.02, sz * (outerD / 2 - 0.22)]}
        >
          <cylinderGeometry args={[0.07, 0.07, 0.05, 12]} />
          <meshStandardMaterial color="#1a2030" roughness={0.25} metalness={0.85} />
        </mesh>
      ))}

      {/* blue underglow strips on frame underside */}
      <mesh position={[0, deckY - deckH / 2 - 0.06, outerD / 2 + 0.04]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[outerW * 0.94, 0.09]} />
        <meshStandardMaterial ref={stripFront} transparent opacity={0.95} />
      </mesh>
      <mesh position={[0, deckY - deckH / 2 - 0.06, -outerD / 2 - 0.04]} rotation={[-Math.PI / 2, 0, Math.PI]}>
        <planeGeometry args={[outerW * 0.94, 0.09]} />
        <meshStandardMaterial ref={stripBack} transparent opacity={0.95} />
      </mesh>
      <mesh position={[-outerW / 2 - 0.04, deckY - deckH / 2 - 0.06, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[outerD * 0.94, 0.09]} />
        <meshStandardMaterial ref={stripLeft} transparent opacity={0.95} />
      </mesh>
      <mesh position={[outerW / 2 + 0.04, deckY - deckH / 2 - 0.06, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
        <planeGeometry args={[outerD * 0.94, 0.09]} />
        <meshStandardMaterial ref={stripRight} transparent opacity={0.95} />
      </mesh>

      {/* desk */}
      <mesh position={[0, DESK_Y, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[90, 90]} />
        <meshStandardMaterial color="#e4e6ec" roughness={0.85} />
      </mesh>
    </group>
  );
}

function Rig({ maxW, totalD }) {
  return (
    <>
      <ambientLight intensity={0.65} color="#ffffff" />
      <directionalLight
        position={[6, 14, 5]}
        intensity={1.15}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
      />
      <pointLight position={[0, 8, 4]} intensity={0.25} color="#ffffff" />
      <KeyboardFrame maxW={maxW} totalD={totalD} />
    </>
  );
}

/** Auto-fit camera so the full keyboard + frame is visible (desk-wide shot). */
function FitCamera({ maxW, totalD }) {
  const { camera } = useThree();
  useEffect(() => {
    const halfW = maxW / 2 + 1.05;
    const halfD = totalD / 2 + 1.25;
    const span = Math.max(halfW, halfD);
    const zoom = 0.85; // 15% closer
    // Higher Y, lower Z → flatter bird's-eye (not straight down)
    camera.position.set(0, span * 2.2 * zoom, span * 0.38 * zoom);
    camera.lookAt(0, 0, 0);
    if (camera.isPerspectiveCamera) {
      camera.fov = 36;
      camera.updateProjectionMatrix();
    }
  }, [camera, maxW, totalD]);
  return null;
}

export default function KeyboardScene({
  grid, gameStatus, exploded, pressed, onPress, keyPositionsRef,
}) {
  const { keys, maxW, totalD } = useLayout();

  return (
    <div className="kb3d">
      <Canvas shadows camera={{ fov: 36, near: 0.1, far: 120 }} dpr={[1, 2]}>
        <color attach="background" args={['#f0f1f5']} />
        <fog attach="fog" args={['#f0f1f5', 35, 75]} />
        <FitCamera maxW={maxW} totalD={totalD} />
        <Rig maxW={maxW} totalD={totalD} />
        {keyPositionsRef && <KeyProjector keys={keys} positionsRef={keyPositionsRef} />}
        {keys.map((k) => (
          <Keycap
            key={k.id}
            k={k}
            slot={grid[k.keyId] ?? null}
            gameStatus={gameStatus}
            exploded={exploded}
            pressed={pressed}
            onPress={onPress}
          />
        ))}
      </Canvas>
    </div>
  );
}
