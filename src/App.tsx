import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  DifficultyLevel,
  FloatingText,
  FloorHazard,
  Forklift,
  GamePhase,
  HandlingLabel,
  HudSnapshot,
  Order,
  Particle,
  RectZone,
  ShiftStats,
} from './game/types';
import { soundEngine } from './game/audio';
import {
  createForkliftsForLevel,
  generateOrder,
  LEVEL_CONFIGS,
  WAREHOUSE_ZONES,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './game/warehouseData';
import { renderWarehouseScene } from './game/renderer';
import { TitleScreen } from './components/TitleScreen';
import { PickingSlipPanel } from './components/PickingSlipPanel';
import { PackingModal } from './components/PackingModal';
import { TouchControls } from './components/TouchControls';
import { KpiReportModal } from './components/KpiReportModal';
import { Pause, Play, RotateCcw, Volume2, VolumeX, Home } from 'lucide-react';

interface EngineState {
  phase: GamePhase;
  level: DifficultyLevel;
  time: number;
  timeRemaining: number;
  elapsedShift: number;
  score: number;
  packagePoints: number;
  penaltyPoints: number;
  packagesDelivered: number;
  nextOrderIndex: number;
  correctActions: number;
  totalActions: number;
  wrongRackCount: number;
  wrongLabelCount: number;
  hazardHits: number;
  blindCountsResolved: number;
  cycleTimes: number[];
  player: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    angle: number;
    walkPhase: number;
    stunTimer: number;
    slowTimer: number;
    invulnTimer: number;
    flashTimer: number;
  };
  activeOrders: Order[];
  forklifts: Forklift[];
  hazards: FloorHazard[];
  hazardSpawnTimer: number;
  particles: Particle[];
  floatingTexts: FloatingText[];
  shakeTimer: number;
  shakeIntensity: number;
  nearbyZone: RectZone | null;
  statusBanner: { text: string; tone: 'info' | 'success' | 'warning' | 'error'; ttl: number } | null;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function resolveCircleRect(
  cx: number,
  cy: number,
  r: number,
  rect: { x: number; y: number; w: number; h: number }
): { x: number; y: number } {
  const closestX = clamp(cx, rect.x, rect.x + rect.w);
  const closestY = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - closestX;
  const dy = cy - closestY;
  const distSq = dx * dx + dy * dy;

  if (distSq < r * r) {
    const dist = Math.sqrt(distSq);
    if (dist > 0.0001) {
      const overlap = r - dist;
      return { x: cx + (dx / dist) * overlap, y: cy + (dy / dist) * overlap };
    }
    // Fallback push out vertically
    const topPen = Math.abs(cy - rect.y);
    const botPen = Math.abs(rect.y + rect.h - cy);
    return topPen < botPen ? { x: cx, y: rect.y - r } : { x: cx, y: rect.y + rect.h + r };
  }
  return { x: cx, y: cy };
}

function distanceToRect(
  px: number,
  py: number,
  rect: { x: number; y: number; w: number; h: number }
): number {
  const dx = Math.max(rect.x - px, 0, px - (rect.x + rect.w));
  const dy = Math.max(rect.y - py, 0, py - (rect.y + rect.h));
  return Math.hypot(dx, dy);
}

function createInitialEngine(level: DifficultyLevel, phase: GamePhase): EngineState {
  const cfg = LEVEL_CONFIGS[level];
  const initialOrders: Order[] = [];
  for (let i = 0; i < cfg.concurrentOrders; i++) {
    initialOrders.push(generateOrder(i, cfg, 0));
  }

  return {
    phase,
    level,
    time: 0,
    timeRemaining: cfg.durationSeconds,
    elapsedShift: 0,
    score: 0,
    packagePoints: 0,
    penaltyPoints: 0,
    packagesDelivered: 0,
    nextOrderIndex: cfg.concurrentOrders,
    correctActions: 0,
    totalActions: 0,
    wrongRackCount: 0,
    wrongLabelCount: 0,
    hazardHits: 0,
    blindCountsResolved: 0,
    cycleTimes: [],
    player: {
      x: 480,
      y: 445,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      walkPhase: 0,
      stunTimer: 0,
      slowTimer: 0,
      invulnTimer: 0,
      flashTimer: 0,
    },
    activeOrders: initialOrders,
    forklifts: createForkliftsForLevel(cfg),
    hazards: [],
    hazardSpawnTimer: 4.5,
    particles: [],
    floatingTexts: [],
    shakeTimer: 0,
    shakeIntensity: 0,
    nearbyZone: null,
    statusBanner: null,
  };
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<EngineState>(createInitialEngine(1, 'TITLE'));
  const heldKeysRef = useRef<Set<string>>(new Set());
  const touchDirRef = useRef<{ up: boolean; down: boolean; left: boolean; right: boolean }>({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  const [selectedLevel, setSelectedLevel] = useState<DifficultyLevel>(1);
  const [phase, setPhase] = useState<GamePhase>('TITLE');
  const [muted, setMuted] = useState(false);
  const [packingOrder, setPackingOrder] = useState<Order | null>(null);
  const [finalStats, setFinalStats] = useState<ShiftStats | null>(null);
  const [hud, setHud] = useState<HudSnapshot>({
    score: 0,
    timeRemaining: 60,
    packagesDelivered: 0,
    targetPackages: 3,
    correctActions: 0,
    totalActions: 0,
    activeOrders: [],
    nearbyPrompt: null,
    statusBanner: null,
  });

  const syncHudFromEngine = useCallback(() => {
    const st = engineRef.current;
    const cfg = LEVEL_CONFIGS[st.level];
    let prompt: string | null = null;
    if (st.nearbyZone) {
      if (st.nearbyZone.type === 'RACK') prompt = `Ambil di ${st.nearbyZone.label}`;
      else if (st.nearbyZone.type === 'BUFFER') prompt = 'Ambil Stok Cadangan';
      else if (st.nearbyZone.type === 'PACKING') prompt = 'Proses Meja Packing';
      else if (st.nearbyZone.type === 'DOCK') prompt = 'Kirim di Loading Dock';
    }

    setHud({
      score: st.score,
      timeRemaining: Math.ceil(st.timeRemaining),
      packagesDelivered: st.packagesDelivered,
      targetPackages: cfg.totalShiftOrders,
      correctActions: st.correctActions,
      totalActions: st.totalActions,
      activeOrders: st.activeOrders.map((o) => ({
        ...o,
        items: o.items.map((it) => ({ ...it })),
      })),
      nearbyPrompt: prompt,
      statusBanner: st.statusBanner
        ? { text: st.statusBanner.text, tone: st.statusBanner.tone }
        : null,
    });
  }, []);

  const spawnParticles = (x: number, y: number, color: string, count = 14) => {
    const st = engineRef.current;
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 45 + Math.random() * 115;
      st.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.45 + Math.random() * 0.25,
        maxLife: 0.7,
        size: 2.5 + Math.random() * 2.5,
        color,
      });
    }
  };

  const addFloatingText = (x: number, y: number, text: string, color: string) => {
    engineRef.current.floatingTexts.push({
      x,
      y,
      text,
      color,
      life: 1.5,
      maxLife: 1.5,
    });
  };

  const setBanner = (
    text: string,
    tone: 'info' | 'success' | 'warning' | 'error',
    ttl = 3.2
  ) => {
    engineRef.current.statusBanner = { text, tone, ttl };
  };

  const finishShift = useCallback(
    (completedAllEarly: boolean) => {
      const st = engineRef.current;
      if (st.phase === 'GAME_OVER') return;
      st.phase = 'GAME_OVER';
      setPhase('GAME_OVER');
      setPackingOrder(null);

      const cfg = LEVEL_CONFIGS[st.level];
      const remainingInt = Math.max(0, Math.ceil(st.timeRemaining));
      const timeBonus = completedAllEarly ? remainingInt * 10 : 0;
      const totalScore = Math.max(0, st.score + timeBonus);
      st.score = totalScore;

      const accuracy =
        st.totalActions > 0 ? Math.round((st.correctActions / st.totalActions) * 100) : 100;
      const avgCycle =
        st.cycleTimes.length > 0
          ? st.cycleTimes.reduce((a, b) => a + b, 0) / st.cycleTimes.length
          : 0;

      let competencyGrade: ShiftStats['competencyGrade'] = 'Perlu Latihan';
      if (accuracy >= 90 && st.packagesDelivered >= cfg.totalShiftOrders) {
        competencyGrade = 'Sangat Kompeten';
      } else if (accuracy >= 70 && st.packagesDelivered >= Math.max(2, cfg.totalShiftOrders - 1)) {
        competencyGrade = 'Kompeten';
      }

      const lessons: string[] = [];
      if (st.wrongRackCount > 0) {
        lessons.push(
          `Terjadi ${st.wrongRackCount}x kesalahan rak picking. Biasakan memindai kode lokasi rak di Picking Slip sebelum mengambil barang.`
        );
      } else {
        lessons.push('Akurasi lokasi rak sangat baik: seluruh barang diambil sesuai kode rak pada Picking Slip.');
      }

      if (st.wrongLabelCount > 0) {
        lessons.push(
          `Terdapat ${st.wrongLabelCount}x kesalahan pemasangan Handling Label. Ingat: Elektronik/Kaca = FRAGILE, Cairan = THIS WAY UP, Tekstil/Kertas = KEEP DRY.`
        );
      } else {
        lessons.push('Klasifikasi Handling Label ISO tepat 100% sesuai karakteristik muatan.');
      }

      if (cfg.hasBlindCount) {
        lessons.push(
          `Penanganan selisih stok (Blind Count): ${st.blindCountsResolved} kasus berhasil dialihkan dan dipenuhi melalui Zona Cadangan.`
        );
      }

      if (st.hazardHits > 0) {
        lessons.push(
          `Keselamatan kerja (K3 Gudang): terjadi ${st.hazardHits}x insiden rintangan/forklift. Perhatikan marka jalur forklift dan tumpahan oli.`
        );
      }

      soundEngine.playShiftComplete();

      setFinalStats({
        level: st.level,
        score: totalScore,
        packagePoints: st.packagePoints,
        timeBonus,
        penaltyPoints: st.penaltyPoints,
        packagesDelivered: st.packagesDelivered,
        targetPackages: cfg.totalShiftOrders,
        correctActions: st.correctActions,
        totalActions: st.totalActions,
        accuracyPercent: accuracy,
        wrongRackCount: st.wrongRackCount,
        wrongLabelCount: st.wrongLabelCount,
        hazardHits: st.hazardHits,
        blindCountsResolved: st.blindCountsResolved,
        timeRemaining: remainingInt,
        durationSeconds: cfg.durationSeconds,
        avgCycleSeconds: avgCycle,
        competencyGrade,
        lessons,
      });

      syncHudFromEngine();
    },
    [syncHudFromEngine]
  );

  const startShift = useCallback(
    (levelToStart: DifficultyLevel) => {
      soundEngine.unlock();
      heldKeysRef.current.clear();
      touchDirRef.current = { up: false, down: false, left: false, right: false };
      engineRef.current = createInitialEngine(levelToStart, 'PLAYING');
      setSelectedLevel(levelToStart);
      setFinalStats(null);
      setPackingOrder(null);
      setPhase('PLAYING');
      setBanner(
        `Shift ${LEVEL_CONFIGS[levelToStart].title} dimulai! Ambil SKU sesuai Picking Slip.`,
        'info',
        3.5
      );
      syncHudFromEngine();
    },
    [syncHudFromEngine]
  );

  const handleInteraction = useCallback(() => {
    const st = engineRef.current;
    if (st.phase !== 'PLAYING') return;
    const zone = st.nearbyZone;
    if (!zone) return;

    const cfg = LEVEL_CONFIGS[st.level];

    // 1. RACK PICKING
    if (zone.type === 'RACK' && zone.rackId) {
      let matchedOrder: Order | null = null;
      let matchedItemIdx = -1;

      for (const order of st.activeOrders) {
        if (order.stage !== 'PICKING') continue;
        const idx = order.items.findIndex(
          (it) =>
            it.sku.rackId === zone.rackId &&
            it.pickedQty < it.qty &&
            !(it.blindCountMissing && it.blindCountReported)
        );
        if (idx !== -1) {
          matchedOrder = order;
          matchedItemIdx = idx;
          break;
        }
      }

      if (matchedOrder && matchedItemIdx !== -1) {
        const item = matchedOrder.items[matchedItemIdx];

        // Check Blind Count / Stock Discrepancy (Level 3)
        if (item.blindCountMissing && !item.blindCountReported) {
          item.blindCountReported = true;
          st.correctActions += 1;
          st.totalActions += 1;
          st.blindCountsResolved += 1;
          soundEngine.playBlindCountAlert();
          spawnParticles(st.player.x, st.player.y, '#FBBF24', 14);
          addFloatingText(st.player.x, st.player.y - 26, 'STOK KOSONG → KE ZONA CADANGAN!', '#FBBF24');
          setBanner(
            `Selisih Stok (Blind Count) di ${zone.label}! Ambil ${item.sku.name} di ZONA CADANGAN.`,
            'warning',
            4.2
          );
          syncHudFromEngine();
          return;
        }

        // Standard Successful Pick
        item.pickedQty = item.qty;
        st.correctActions += 1;
        st.totalActions += 1;
        soundEngine.playBarcodeScan();
        setTimeout(() => soundEngine.playPickSuccess(), 70);
        spawnParticles(st.player.x, st.player.y, item.sku.color, 14);
        addFloatingText(
          st.player.x,
          st.player.y - 24,
          `✓ ${item.qty}x ${item.sku.name}`,
          '#38BDF8'
        );

        const allPicked = matchedOrder.items.every((it) => it.pickedQty >= it.qty);
        if (allPicked) {
          matchedOrder.stage = 'READY_TO_PACK';
          setBanner(
            `Semua SKU ${matchedOrder.id} terambil! Bawa ke MEJA PACKING.`,
            'success',
            3.5
          );
        } else {
          setBanner(`Terambil: ${item.qty}x ${item.sku.name} (${zone.label})`, 'info', 2.2);
        }

        syncHudFromEngine();
        return;
      }

      // Wrong Rack Penalty (-30)
      st.score = Math.max(0, st.score - 30);
      st.penaltyPoints += 30;
      st.wrongRackCount += 1;
      st.totalActions += 1;
      st.shakeTimer = 0.22;
      st.shakeIntensity = 6;
      st.player.flashTimer = 0.2;
      soundEngine.playError();
      spawnParticles(st.player.x, st.player.y, '#EF4444', 12);
      addFloatingText(st.player.x, st.player.y - 24, '-30 SALAH RAK!', '#F87171');
      setBanner(
        `Salah Rak (-30 poin)! ${zone.label} tidak ada pada Picking Slip aktif saat ini.`,
        'error',
        3.5
      );
      syncHudFromEngine();
      return;
    }

    // 2. BUFFER / ZONA CADANGAN
    if (zone.type === 'BUFFER') {
      let resolved = false;
      for (const order of st.activeOrders) {
        if (order.stage !== 'PICKING') continue;
        const item = order.items.find(
          (it) => it.blindCountMissing && it.blindCountReported && it.pickedQty < it.qty
        );
        if (item) {
          item.pickedQty = item.qty;
          st.correctActions += 1;
          st.totalActions += 1;
          resolved = true;
          soundEngine.playPickSuccess();
          spawnParticles(st.player.x, st.player.y, '#FBBF24', 16);
          addFloatingText(
            st.player.x,
            st.player.y - 24,
            `✓ Cadangan: ${item.qty}x ${item.sku.name}`,
            '#FBBF24'
          );

          if (order.items.every((it) => it.pickedQty >= it.qty)) {
            order.stage = 'READY_TO_PACK';
            setBanner(
              `Stok cadangan lengkap! Bawa ${order.id} ke MEJA PACKING.`,
              'success',
              3.5
            );
          } else {
            setBanner(`Stok cadangan ${item.sku.name} berhasil diambil.`, 'success', 2.5);
          }
          break;
        }
      }

      if (!resolved) {
        setBanner('Zona Cadangan hanya digunakan saat terjadi Selisih Stok (Blind Count).', 'info', 2.5);
      }
      syncHudFromEngine();
      return;
    }

    // 3. MEJA PACKING
    if (zone.type === 'PACKING') {
      const readyOrder = st.activeOrders.find((o) => o.stage === 'READY_TO_PACK');
      if (!readyOrder) {
        setBanner('Belum ada pesanan yang lengkap untuk di-packing. Ambil semua SKU dulu.', 'warning', 2.6);
        soundEngine.playError();
        syncHudFromEngine();
        return;
      }

      st.phase = 'PACKING_MODAL';
      setPhase('PACKING_MODAL');
      setPackingOrder({ ...readyOrder, items: readyOrder.items.map((it) => ({ ...it })) });
      heldKeysRef.current.clear();
      return;
    }

    // 4. LOADING DOCK (DISPATCH)
    if (zone.type === 'DOCK') {
      const readyToDispatch = st.activeOrders.filter((o) => o.stage === 'READY_TO_DISPATCH');
      if (readyToDispatch.length === 0) {
        setBanner('Belum ada paket tersegel! Selesaikan Packing & Label di Meja Packing dulu.', 'warning', 2.8);
        soundEngine.playError();
        syncHudFromEngine();
        return;
      }

      const deliveredNow = readyToDispatch.length;
      for (const ord of readyToDispatch) {
        st.score += 100;
        st.packagePoints += 100;
        st.packagesDelivered += 1;
        st.correctActions += 1;
        st.totalActions += 1;
        st.cycleTimes.push(Math.max(1, st.elapsedShift - ord.createdAtElapsed));
      }

      // Remove dispatched orders and spawn replacements if quota remains
      st.activeOrders = st.activeOrders.filter((o) => o.stage !== 'READY_TO_DISPATCH');
      while (
        st.activeOrders.length < cfg.concurrentOrders &&
        st.nextOrderIndex < cfg.totalShiftOrders
      ) {
        st.activeOrders.push(generateOrder(st.nextOrderIndex, cfg, st.elapsedShift));
        st.nextOrderIndex += 1;
      }

      soundEngine.playDispatchSuccess();
      spawnParticles(st.player.x, st.player.y + 15, '#10B981', 24);
      addFloatingText(
        st.player.x,
        st.player.y - 28,
        `+${deliveredNow * 100} PAKET TERKIRIM!`,
        '#34D399'
      );
      setBanner(
        `${deliveredNow} paket berhasil dimuat di Loading Dock (+${deliveredNow * 100} poin)!`,
        'success',
        3.0
      );

      if (st.packagesDelivered >= cfg.totalShiftOrders) {
        finishShift(true);
        return;
      }

      syncHudFromEngine();
    }
  }, [finishShift, syncHudFromEngine]);

  const handleWrongLabelInModal = useCallback(
    (_chosen: HandlingLabel, _expected: HandlingLabel) => {
      const st = engineRef.current;
      st.score = Math.max(0, st.score - 30);
      st.penaltyPoints += 30;
      st.wrongLabelCount += 1;
      st.totalActions += 1;
      soundEngine.playError();
      syncHudFromEngine();
    },
    [syncHudFromEngine]
  );

  const handleConfirmPack = useCallback(
    (orderId: string) => {
      const st = engineRef.current;
      const target = st.activeOrders.find((o) => o.id === orderId);
      if (target) {
        target.stage = 'READY_TO_DISPATCH';
      }
      st.correctActions += 1;
      st.totalActions += 1;
      st.phase = 'PLAYING';
      setPhase('PLAYING');
      setPackingOrder(null);
      soundEngine.playPackingComplete();
      spawnParticles(st.player.x, st.player.y, '#38BDF8', 16);
      addFloatingText(st.player.x, st.player.y - 26, 'PACKING OK → KE LOADING DOCK', '#38BDF8');
      setBanner(`Paket ${orderId} tersegel & berlabel! Kirim ke LOADING DOCK.`, 'success', 3.2);
      syncHudFromEngine();
    },
    [syncHudFromEngine]
  );

  const handleCancelPack = useCallback(() => {
    engineRef.current.phase = 'PLAYING';
    setPhase('PLAYING');
    setPackingOrder(null);
  }, []);

  const togglePause = useCallback(() => {
    const st = engineRef.current;
    if (st.phase === 'PLAYING') {
      st.phase = 'PAUSED';
      setPhase('PAUSED');
      heldKeysRef.current.clear();
    } else if (st.phase === 'PAUSED') {
      st.phase = 'PLAYING';
      setPhase('PLAYING');
    }
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  // Keyboard Listeners (separated held vs edge-triggered)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const st = engineRef.current;

      if (e.code === 'Escape') {
        if (st.phase === 'PLAYING' || st.phase === 'PAUSED') {
          e.preventDefault();
          togglePause();
        }
        return;
      }

      if (st.phase === 'TITLE' && (e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        startShift(selectedLevel);
        return;
      }

      if (st.phase !== 'PLAYING') return;

      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)
      ) {
        e.preventDefault();
      }

      if (e.code === 'Space' || e.code === 'Enter') {
        if (!e.repeat) {
          handleInteraction();
        }
        return;
      }

      heldKeysRef.current.add(e.code);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      heldKeysRef.current.delete(e.code);
    };

    const onBlur = () => {
      heldKeysRef.current.clear();
      touchDirRef.current = { up: false, down: false, left: false, right: false };
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [handleInteraction, selectedLevel, startShift, togglePause]);

  // Isolated 60fps Game Loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();
    let hudAccumulator = 0;
    let lastSecShown = -1;

    const tick = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      const st = engineRef.current;
      st.time += dt;

      const cfg = LEVEL_CONFIGS[st.level];

      // Ambient forklift patrol on TITLE or active simulation on PLAYING
      if (st.phase === 'TITLE' || st.phase === 'PLAYING') {
        // Update Forklifts along floor lane markings with smooth cornering
        for (const fl of st.forklifts) {
          const target = fl.waypoints[fl.targetIdx];
          const dx = target.x - fl.x;
          const dy = target.y - fl.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 10) {
            fl.targetIdx = (fl.targetIdx + 1) % fl.waypoints.length;
          } else {
            const desiredAngle = Math.atan2(dy, dx);
            let angleDiff = desiredAngle - fl.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            fl.angle += angleDiff * Math.min(1, dt * 8.5);

            // Modulate speed when approaching corners or turning
            const cornerFactor = dist < 42 ? 0.68 : 1.0;
            fl.speed = fl.baseSpeed * cornerFactor;
            const moveStep = fl.speed * dt;
            fl.x += (dx / dist) * moveStep;
            fl.y += (dy / dist) * moveStep;
          }
          if (fl.warningTimer > 0) fl.warningTimer = Math.max(0, fl.warningTimer - dt);
          if (fl.hornPulse > 0) fl.hornPulse = Math.max(0, fl.hornPulse - dt);
        }
      }

      if (st.phase === 'PLAYING') {
        st.elapsedShift += dt;
        st.timeRemaining = Math.max(0, st.timeRemaining - dt);

        if (st.timeRemaining <= 0) {
          finishShift(false);
        } else {
          // Player Movement
          const p = st.player;
          if (p.stunTimer > 0) p.stunTimer = Math.max(0, p.stunTimer - dt);
          if (p.slowTimer > 0) p.slowTimer = Math.max(0, p.slowTimer - dt);
          if (p.invulnTimer > 0) p.invulnTimer = Math.max(0, p.invulnTimer - dt);
          if (p.flashTimer > 0) p.flashTimer = Math.max(0, p.flashTimer - dt);

          let ix = 0;
          let iy = 0;
          const keys = heldKeysRef.current;
          const touch = touchDirRef.current;

          if (keys.has('KeyA') || keys.has('ArrowLeft') || touch.left) ix -= 1;
          if (keys.has('KeyD') || keys.has('ArrowRight') || touch.right) ix += 1;
          if (keys.has('KeyW') || keys.has('ArrowUp') || touch.up) iy -= 1;
          if (keys.has('KeyS') || keys.has('ArrowDown') || touch.down) iy += 1;

          if (p.stunTimer <= 0 && (ix !== 0 || iy !== 0)) {
            const len = Math.hypot(ix, iy);
            const nx = ix / len;
            const ny = iy / len;
            const moveSpeed = p.slowTimer > 0 ? 120 : 240;
            p.x += nx * moveSpeed * dt;
            p.y += ny * moveSpeed * dt;
            p.angle = Math.atan2(ny, nx);
            p.walkPhase += dt * (p.slowTimer > 0 ? 9 : 15);
          }

          // Outer bounds clamp
          const playerR = 16;
          p.x = clamp(p.x, playerR + 8, WORLD_WIDTH - playerR - 8);
          p.y = clamp(p.y, playerR + 8, WORLD_HEIGHT - playerR - 8);

          // Collide with warehouse zones
          for (const z of WAREHOUSE_ZONES) {
            const res = resolveCircleRect(p.x, p.y, playerR, z);
            p.x = res.x;
            p.y = res.y;
          }

          // Nearest interactive zone detection
          let bestZone: RectZone | null = null;
          let bestDist = 38;
          for (const z of WAREHOUSE_ZONES) {
            if (z.type === 'DIVIDER') continue;
            const d = distanceToRect(p.x, p.y, z);
            if (d < bestDist) {
              bestDist = d;
              bestZone = z;
            }
          }
          st.nearbyZone = bestZone;

          // Dynamic Obstacles Spawning (Level 2 & 3)
          if (cfg.hasDynamicObstacles) {
            st.hazardSpawnTimer -= dt;
            if (st.hazardSpawnTimer <= 0) {
              st.hazardSpawnTimer = st.level === 3 ? 4.2 : 6.0;
              if (st.hazards.length < (st.level === 3 ? 4 : 3)) {
                const candidateSpots = [
                  { x: 250, y: 245 },
                  { x: 250, y: 380 },
                  { x: 710, y: 245 },
                  { x: 710, y: 380 },
                  { x: 480, y: 145 },
                  { x: 480, y: 445 },
                ];
                const spot = candidateSpots[Math.floor(Math.random() * candidateSpots.length)];
                if (Math.hypot(spot.x - p.x, spot.y - p.y) > 95) {
                  st.hazards.push({
                    id: `HZ-${Date.now()}-${Math.random()}`,
                    type: Math.random() > 0.45 ? 'OIL' : 'CRATE',
                    x: spot.x + (Math.random() * 24 - 12),
                    y: spot.y + (Math.random() * 24 - 12),
                    radius: 17,
                    ttl: 11,
                    windup: 1.35,
                  });
                }
              }
            }
          }

          // Update & Check Hazards
          for (let i = st.hazards.length - 1; i >= 0; i--) {
            const h = st.hazards[i];
            if (h.windup > 0) {
              h.windup -= dt;
              continue;
            }
            h.ttl -= dt;
            if (h.ttl <= 0) {
              st.hazards.splice(i, 1);
              continue;
            }

            if (p.invulnTimer <= 0 && Math.hypot(p.x - h.x, p.y - h.y) < playerR + h.radius - 3) {
              if (h.type === 'OIL') {
                p.slowTimer = 1.8;
                p.invulnTimer = 1.2;
                st.hazardHits += 1;
                soundEngine.playHazardHit();
                spawnParticles(p.x, p.y, '#F59E0B', 10);
                addFloatingText(p.x, p.y - 24, 'LICIN! OLI TUMPAH', '#FBBF24');
                setBanner('Waspada tumpahan oli di lantai! Kecepatan berkurang sementara.', 'warning', 2.4);
              } else {
                p.stunTimer = 0.5;
                p.invulnTimer = 1.5;
                st.hazardHits += 1;
                st.shakeTimer = 0.25;
                st.shakeIntensity = 7;
                p.flashTimer = 0.25;
                soundEngine.playHazardHit();
                spawnParticles(h.x, h.y, '#D97706', 14);
                addFloatingText(p.x, p.y - 24, 'TERBENTUR KOTAK!', '#F87171');
                st.hazards.splice(i, 1);
              }
            }
          }

          // Forklift Proximity K3 Horn & Collision Check
          for (const fl of st.forklifts) {
            const distFl = Math.hypot(p.x - fl.x, p.y - fl.y);

            // Randomized K3 warning horn when approaching player's work area
            if (distFl < 165 && fl.warningTimer <= 0) {
              // Random chance + random cooldown so horn feels natural & urgent
              if (distFl < 105 || Math.random() < 0.08) {
                fl.warningTimer = 2.4 + Math.random() * 2.2;
                fl.hornPulse = 0.8;
                soundEngine.playForkliftHorn();
                if (distFl < 110) {
                  addFloatingText(fl.x, fl.y - 26, 'K3: WASPADA FORKLIFT!', '#FACC15');
                }
              }
            }

            if (p.invulnTimer <= 0 && distFl < playerR + 18) {
              p.stunTimer = 0.55;
              p.invulnTimer = 1.6;
              p.flashTimer = 0.25;
              st.hazardHits += 1;
              st.shakeTimer = 0.28;
              st.shakeIntensity = 8;
              // Push away
              const pushAng = Math.atan2(p.y - fl.y, p.x - fl.x);
              p.x += Math.cos(pushAng) * 28;
              p.y += Math.sin(pushAng) * 28;
              soundEngine.playHazardHit();
              spawnParticles(p.x, p.y, '#F97316', 14);
              addFloatingText(p.x, p.y - 26, 'AWAS FORKLIFT!', '#FB923C');
              setBanner('Terkena jalur Forklift! Patuhi garis kuning keselamatan K3.', 'warning', 2.4);
              break;
            }
          }

          // Banner TTL
          if (st.statusBanner) {
            st.statusBanner.ttl -= dt;
            if (st.statusBanner.ttl <= 0) st.statusBanner = null;
          }
        }
      }

      // Particles & Floating text update (always animate smoothly)
      for (let i = st.particles.length - 1; i >= 0; i--) {
        const pt = st.particles[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.vx *= 0.92;
        pt.vy *= 0.92;
        pt.life -= dt;
        if (pt.life <= 0) st.particles.splice(i, 1);
      }

      for (let i = st.floatingTexts.length - 1; i >= 0; i--) {
        const ft = st.floatingTexts[i];
        ft.y -= 26 * dt;
        ft.life -= dt;
        if (ft.life <= 0) st.floatingTexts.splice(i, 1);
      }

      if (st.shakeTimer > 0) st.shakeTimer = Math.max(0, st.shakeTimer - dt);
      const shakeOffset =
        st.shakeTimer > 0
          ? {
              x: (Math.random() - 0.5) * 2 * st.shakeIntensity,
              y: (Math.random() - 0.5) * 2 * st.shakeIntensity,
            }
          : { x: 0, y: 0 };

      // Render Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const carryingPackCount = st.activeOrders.filter(
            (o) => o.stage === 'READY_TO_DISPATCH'
          ).length;
          const carryingPickedCount = st.activeOrders.reduce(
            (acc, o) => acc + o.items.reduce((s, it) => s + (it.pickedQty > 0 ? 1 : 0), 0),
            0
          );

          renderWarehouseScene(ctx, {
            player: {
              ...st.player,
              carryingPackCount,
              carryingPickedCount,
            },
            activeOrders: st.activeOrders,
            forklifts: st.forklifts,
            hazards: st.hazards,
            particles: st.particles,
            floatingTexts: st.floatingTexts,
            nearbyZoneId: st.nearbyZone ? st.nearbyZone.id : null,
            shakeOffset,
            time: st.time,
          });
        }
      }

      // Throttled HUD sync
      hudAccumulator += dt;
      const currentSec = Math.ceil(st.timeRemaining);
      if (st.phase === 'PLAYING' && (hudAccumulator >= 0.14 || currentSec !== lastSecShown)) {
        hudAccumulator = 0;
        lastSecShown = currentSec;
        syncHudFromEngine();
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [finishShift, syncHudFromEngine]);

  const handleTouchDirection = useCallback(
    (dir: 'up' | 'down' | 'left' | 'right', pressed: boolean) => {
      touchDirRef.current[dir] = pressed;
    },
    []
  );

  const levelCfg = LEVEL_CONFIGS[selectedLevel];
  const accuracyPct =
    hud.totalActions > 0 ? Math.round((hud.correctActions / hud.totalActions) * 100) : 100;

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-[#0B1528] text-slate-100 select-none">
      {/* Top Industrial HUD Bar (shown during active gameplay) */}
      {phase !== 'TITLE' && (
        <header className="flex h-13 shrink-0 items-center justify-between gap-4 border-b border-slate-700/80 bg-[#0F1E36] px-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-display text-lg font-extrabold tracking-wide text-white whitespace-nowrap">
              WAREHOUSE GRAND PRIX
            </span>
            <span className="hidden sm:inline text-slate-600">·</span>
            <span className="hidden sm:inline truncate font-mono-tabular text-xs font-semibold text-orange-400">
              {levelCfg.title} ({levelCfg.subtitle})
            </span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 shrink-0 font-mono-tabular text-xs sm:text-sm">
            <div>
              <span className="text-slate-400 mr-1.5">WAKTU</span>
              <span
                className={`font-bold ${
                  hud.timeRemaining <= 15 ? 'text-rose-400' : 'text-white'
                }`}
              >
                {hud.timeRemaining}d
              </span>
            </div>

            <div>
              <span className="text-slate-400 mr-1.5">SKOR</span>
              <span className="font-bold text-orange-400">{hud.score}</span>
            </div>

            <div className="hidden md:block">
              <span className="text-slate-400 mr-1.5">PAKET</span>
              <span className="font-bold text-emerald-400">
                {hud.packagesDelivered}/{hud.targetPackages}
              </span>
            </div>

            <div className="hidden md:block">
              <span className="text-slate-400 mr-1.5">AKURASI</span>
              <span className="font-bold text-sky-400">{accuracyPct}%</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? 'Aktifkan Suara' : 'Matikan Suara'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500 cursor-pointer"
            >
              {muted ? (
                <VolumeX className="h-4 w-4 text-rose-400" />
              ) : (
                <Volume2 className="h-4 w-4 text-emerald-400" />
              )}
            </button>

            <button
              type="button"
              onClick={togglePause}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 text-xs font-semibold text-slate-200 hover:border-slate-500 whitespace-nowrap cursor-pointer"
            >
              {phase === 'PAUSED' ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{phase === 'PAUSED' ? 'Lanjut' : 'Jeda'}</span>
            </button>
          </div>
        </header>
      )}

      {/* Main Arena + Picking Slip Sidebar */}
      <main className="relative flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* 2D Canvas Viewport */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#0B1528] p-2 sm:p-3">
          <canvas
            ref={canvasRef}
            width={WORLD_WIDTH}
            height={WORLD_HEIGHT}
            className="max-h-full max-w-full rounded-xl border border-slate-700/80 bg-[#142033] shadow-2xl object-contain"
          />

          {/* Non-occluding Status Toast (top-center inside canvas area, pointer-events-none) */}
          {phase === 'PLAYING' && hud.statusBanner && (
            <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-10 max-w-md px-3">
              <div
                className={`rounded-lg border px-3.5 py-2 text-center text-xs font-semibold shadow-lg ${
                  hud.statusBanner.tone === 'error'
                    ? 'border-rose-500/80 bg-rose-950/95 text-rose-100'
                    : hud.statusBanner.tone === 'warning'
                    ? 'border-amber-500/80 bg-amber-950/95 text-amber-100'
                    : hud.statusBanner.tone === 'success'
                    ? 'border-emerald-500/80 bg-emerald-950/95 text-emerald-100'
                    : 'border-sky-500/70 bg-slate-900/95 text-slate-100'
                }`}
              >
                {hud.statusBanner.text}
              </div>
            </div>
          )}

          {/* Legend Strip Bottom Left (pointer-events-none, desktop) */}
          {phase === 'PLAYING' && (
            <div className="pointer-events-none absolute bottom-4 left-5 hidden lg:flex items-center gap-3 rounded-lg border border-slate-700/70 bg-[#0B1528]/90 px-3 py-1.5 text-[11px] text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-sky-400" />
                Elektronik (Fragile)
              </span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" />
                Kimia (This Way Up)
              </span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
                Tekstil (Keep Dry)
              </span>
            </div>
          )}
        </div>

        {/* Picking Slip Panel */}
        {phase !== 'TITLE' && (
          <div className="h-56 shrink-0 lg:h-full">
            <PickingSlipPanel
              orders={hud.activeOrders}
              nearbyPrompt={hud.nearbyPrompt}
              onTriggerAction={handleInteraction}
            />
          </div>
        )}
      </main>

      {/* Mobile / Touch Virtual D-Pad */}
      {phase === 'PLAYING' && (
        <TouchControls
          onDirectionChange={handleTouchDirection}
          onAction={handleInteraction}
          actionLabel={hud.nearbyPrompt}
        />
      )}

      {/* Title Screen */}
      {phase === 'TITLE' && (
        <TitleScreen
          selectedLevel={selectedLevel}
          onSelectLevel={setSelectedLevel}
          onStartGame={() => startShift(selectedLevel)}
          muted={muted}
          onToggleMute={toggleMute}
        />
      )}

      {/* Packing & Handling Label Modal */}
      {phase === 'PACKING_MODAL' && packingOrder && (
        <PackingModal
          order={packingOrder}
          onWrongLabel={handleWrongLabelInModal}
          onConfirmPack={handleConfirmPack}
          onCancel={handleCancelPack}
        />
      )}

      {/* Pause Modal */}
      {phase === 'PAUSED' && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-[#0F1E36] p-6 text-center shadow-2xl">
            <h2 className="font-display text-3xl font-bold text-white">SHIFT DIJEDA</h2>
            <p className="mt-1 text-xs text-slate-400">
              {levelCfg.title} · Sisa waktu {hud.timeRemaining} detik
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={togglePause}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-orange-400 cursor-pointer"
              >
                <Play className="h-4 w-4 fill-slate-950" />
                <span>Lanjutkan Shift</span>
              </button>
              <button
                type="button"
                onClick={() => startShift(selectedLevel)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Ulangi Level</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  engineRef.current = createInitialEngine(selectedLevel, 'TITLE');
                  setPhase('TITLE');
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                <Home className="h-4 w-4" />
                <span>Kembali ke Menu</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Report Card (Game Over / Shift Complete) */}
      {phase === 'GAME_OVER' && finalStats && (
        <KpiReportModal
          stats={finalStats}
          onPlayAgain={() => startShift(selectedLevel)}
          onBackToMenu={() => {
            engineRef.current = createInitialEngine(selectedLevel, 'TITLE');
            setFinalStats(null);
            setPhase('TITLE');
          }}
        />
      )}
    </div>
  );
}
