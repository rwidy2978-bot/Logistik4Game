import {
  FloatingText,
  FloorHazard,
  Forklift,
  Order,
  Particle,
  RectZone,
  SkuCategory,
} from './types';
import { WAREHOUSE_ZONES, WORLD_HEIGHT, WORLD_WIDTH } from './warehouseData';

export interface RenderState {
  player: {
    x: number;
    y: number;
    angle: number;
    walkPhase: number;
    stunTimer: number;
    slowTimer: number;
    flashTimer: number;
    carryingPackCount: number;
    carryingPickedCount: number;
  };
  activeOrders: Order[];
  forklifts: Forklift[];
  hazards: FloorHazard[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  nearbyZoneId: string | null;
  shakeOffset: { x: number; y: number };
  time: number;
}

function getCategoryAccent(category?: SkuCategory): string {
  switch (category) {
    case 'ELECTRONICS':
      return '#38BDF8';
    case 'CHEMICALS':
      return '#F59E0B';
    case 'TEXTILE':
      return '#10B981';
    default:
      return '#94A3B8';
  }
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawSkuIcon(
  ctx: CanvasRenderingContext2D,
  category: SkuCategory | undefined,
  cx: number,
  cy: number,
  color: string
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.8;

  if (category === 'ELECTRONICS') {
    // Wine-glass / Fragile silhouette
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy - 6);
    ctx.lineTo(cx + 5, cy - 6);
    ctx.lineTo(cx + 4, cy);
    ctx.quadraticCurveTo(cx, cy + 3, cx - 4, cy);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy + 2);
    ctx.lineTo(cx, cy + 7);
    ctx.moveTo(cx - 4, cy + 7);
    ctx.lineTo(cx + 4, cy + 7);
    ctx.stroke();
  } else if (category === 'CHEMICALS') {
    // Double up arrows (This Way Up)
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy + 5);
    ctx.lineTo(cx - 4, cy - 4);
    ctx.moveTo(cx - 7, cy - 1);
    ctx.lineTo(cx - 4, cy - 5);
    ctx.lineTo(cx - 1, cy - 1);
    ctx.moveTo(cx + 4, cy + 5);
    ctx.lineTo(cx + 4, cy - 4);
    ctx.moveTo(cx + 1, cy - 1);
    ctx.lineTo(cx + 4, cy - 5);
    ctx.lineTo(cx + 7, cy - 1);
    ctx.stroke();
  } else if (category === 'TEXTILE') {
    // Umbrella (Keep Dry)
    ctx.beginPath();
    ctx.arc(cx, cy - 1, 7, Math.PI, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - 1);
    ctx.lineTo(cx, cy + 6);
    ctx.arc(cx - 2, cy + 6, 2, 0, Math.PI);
    ctx.stroke();
  }
  ctx.restore();
}

function getTargetHighlights(activeOrders: Order[]) {
  const targetRackIds = new Set<string>();
  let needBuffer = false;
  let needPacking = false;
  let needDock = false;

  for (const order of activeOrders) {
    if (order.stage === 'PICKING') {
      for (const item of order.items) {
        if (item.pickedQty < item.qty) {
          if (item.blindCountMissing && item.blindCountReported) {
            needBuffer = true;
          } else {
            targetRackIds.add(item.sku.rackId);
          }
        }
      }
    } else if (order.stage === 'READY_TO_PACK') {
      needPacking = true;
    } else if (order.stage === 'READY_TO_DISPATCH') {
      needDock = true;
    }
  }

  return { targetRackIds, needBuffer, needPacking, needDock };
}

export function renderWarehouseScene(
  ctx: CanvasRenderingContext2D,
  state: RenderState
) {
  ctx.save();
  ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  ctx.translate(state.shakeOffset.x, state.shakeOffset.y);

  // 1. Industrial Epoxy Floor Base
  ctx.fillStyle = '#142033';
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // Subtle floor grid tiles
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)';
  ctx.lineWidth = 1;
  for (let gx = 0; gx <= WORLD_WIDTH; gx += 40) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, WORLD_HEIGHT);
    ctx.stroke();
  }
  for (let gy = 0; gy <= WORLD_HEIGHT; gy += 40) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(WORLD_WIDTH, gy);
    ctx.stroke();
  }

  // Outer Warehouse Perimeter Walls
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, WORLD_WIDTH - 8, WORLD_HEIGHT - 8);

  // 2. U-Shape Floor Markings & Flow Arrows
  ctx.save();
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.22)';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([12, 10]);
  drawRoundedRect(ctx, 185, 130, 590, 345, 28);
  ctx.stroke();
  ctx.setLineDash([]);

  // U-Shape directional chevrons on floor
  ctx.fillStyle = 'rgba(249, 115, 22, 0.16)';
  ctx.font = '700 11px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ALUR U-SHAPE: PICKING ZONA A  ▼', 245, 116);
  ctx.fillText('▲  PICKING ZONA B', 715, 116);
  ctx.fillText('ZONA PACKING  ➔  DISPATCH', 480, 504);
  ctx.restore();

  // Draw Forklift Patrol Paths (dynamic K3 floor lane markings)
  for (const fl of state.forklifts) {
    ctx.save();
    // Wide safety lane background
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.13)';
    ctx.lineWidth = 26;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    fl.waypoints.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();
    ctx.stroke();

    // Animated directional dashed centerline along forklift lane
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 14]);
    ctx.lineDashOffset = -state.time * 42;
    ctx.beginPath();
    fl.waypoints.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  const highlights = getTargetHighlights(state.activeOrders);

  // 3. Warehouse Zones & Racks
  for (const zone of WAREHOUSE_ZONES) {
    drawZone(ctx, zone, highlights, state.nearbyZoneId === zone.id, state.time);
  }

  // 4. Dynamic Floor Hazards (Oil Spills & Falling Crates)
  for (const h of state.hazards) {
    drawHazard(ctx, h, state.time);
  }

  // 5. Forklifts
  for (const fl of state.forklifts) {
    drawForklift(ctx, fl, state.time);
  }

  // 6. Player Operator
  drawPlayer(ctx, state.player, state.time);

  // 7. Particles
  for (const p of state.particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 8. Floating Feedback Texts
  for (const ft of state.floatingTexts) {
    const alpha = Math.min(1, (ft.life / ft.maxLife) * 1.4);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    const textWidth = ctx.measureText(ft.text).width;
    ctx.fillStyle = 'rgba(11, 21, 40, 0.88)';
    drawRoundedRect(ctx, ft.x - textWidth / 2 - 8, ft.y - 14, textWidth + 16, 22, 5);
    ctx.fill();
    ctx.strokeStyle = ft.color;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y + 1);
    ctx.restore();
  }

  ctx.restore();
}

function drawZone(
  ctx: CanvasRenderingContext2D,
  zone: RectZone,
  highlights: ReturnType<typeof getTargetHighlights>,
  isNearby: boolean,
  time: number
) {
  const isTarget =
    (zone.type === 'RACK' && zone.rackId && highlights.targetRackIds.has(zone.rackId)) ||
    (zone.type === 'BUFFER' && highlights.needBuffer) ||
    (zone.type === 'PACKING' && highlights.needPacking) ||
    (zone.type === 'DOCK' && highlights.needDock);

  const pulse = 0.55 + 0.45 * Math.sin(time * 6);

  ctx.save();

  if (zone.type === 'DIVIDER') {
    // Central Pallet Staging Island
    ctx.fillStyle = '#1E293B';
    drawRoundedRect(ctx, zone.x, zone.y, zone.w, zone.h, 10);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw stacked wooden pallets illustration inside
    for (let px = zone.x + 18; px < zone.x + zone.w - 40; px += 62) {
      for (let py = zone.y + 20; py < zone.y + zone.h - 45; py += 58) {
        ctx.fillStyle = '#3B2F23';
        ctx.fillRect(px, py, 46, 42);
        ctx.strokeStyle = '#6B533B';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, 46, 42);
        ctx.fillStyle = '#475569';
        ctx.fillRect(px + 6, py + 6, 34, 30);
      }
    }

    ctx.fillStyle = '#94A3B8';
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(zone.label, zone.x + zone.w / 2, zone.y + zone.h - 16);
    ctx.restore();
    return;
  }

  // Base fill per zone type
  let bg = '#1C2B42';
  let border = '#334155';
  let accent = getCategoryAccent(zone.category);

  if (zone.type === 'BUFFER') {
    bg = '#2A1F14';
    border = '#F59E0B';
    accent = '#F59E0B';
  } else if (zone.type === 'PACKING') {
    bg = '#1A2D3D';
    border = '#38BDF8';
    accent = '#38BDF8';
  } else if (zone.type === 'DOCK') {
    bg = '#172E29';
    border = '#10B981';
    accent = '#10B981';
  }

  // Target beacon outer glow
  if (isTarget) {
    ctx.save();
    ctx.strokeStyle = zone.type === 'BUFFER' ? '#FBBF24' : '#F97316';
    ctx.globalAlpha = 0.4 + 0.45 * pulse;
    ctx.lineWidth = 4;
    drawRoundedRect(ctx, zone.x - 4, zone.y - 4, zone.w + 8, zone.h + 8, 12);
    ctx.stroke();
    ctx.restore();
  }

  ctx.fillStyle = bg;
  drawRoundedRect(ctx, zone.x, zone.y, zone.w, zone.h, 8);
  ctx.fill();

  ctx.strokeStyle = isNearby ? '#F97316' : isTarget ? '#FB923C' : border;
  ctx.lineWidth = isNearby ? 2.8 : isTarget ? 2.2 : 1.5;
  ctx.stroke();

  if (zone.type === 'RACK') {
    // Color bar along inner aisle edge
    const isLeft = zone.x < WORLD_WIDTH / 2;
    ctx.fillStyle = accent;
    if (isLeft) {
      ctx.fillRect(zone.x + zone.w - 7, zone.y + 4, 5, zone.h - 8);
    } else {
      ctx.fillRect(zone.x + 2, zone.y + 4, 5, zone.h - 8);
    }

    // Rack shelves slots aesthetic
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(zone.x + 12, zone.y + 10, zone.w - 26, 16);
    ctx.fillRect(zone.x + 12, zone.y + zone.h - 24, zone.w - 26, 14);

    // SKU Icon
    drawSkuIcon(ctx, zone.category, zone.x + zone.w / 2, zone.y + 20, accent);

    // Rack label
    ctx.fillStyle = '#F8FAFC';
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(zone.label, zone.x + zone.w / 2, zone.y + 49);

    if (zone.sublabel) {
      ctx.fillStyle = '#CBD5E1';
      ctx.font = '500 10px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(zone.sublabel, zone.x + zone.w / 2, zone.y + 66);
    }
  } else if (zone.type === 'BUFFER') {
    ctx.fillStyle = '#FBBF24';
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(zone.label, zone.x + zone.w / 2, zone.y + 28);
    ctx.fillStyle = '#FDE68A';
    ctx.font = '500 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(zone.sublabel || '', zone.x + zone.w / 2, zone.y + 46);
  } else if (zone.type === 'PACKING') {
    // Worktable & scanner detail
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(zone.x + 14, zone.y + 12, 34, 24);
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1;
    ctx.strokeRect(zone.x + 14, zone.y + 12, 34, 24);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(zone.label, zone.x + zone.w / 2 + 12, zone.y + 30);
    ctx.fillStyle = '#7DD3FC';
    ctx.font = '500 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(zone.sublabel || '', zone.x + zone.w / 2 + 12, zone.y + 49);
  } else if (zone.type === 'DOCK') {
    // Hazard stripes at dock door
    ctx.save();
    ctx.beginPath();
    drawRoundedRect(ctx, zone.x + 8, zone.y + zone.h - 14, zone.w - 16, 8, 3);
    ctx.clip();
    for (let sx = zone.x; sx < zone.x + zone.w + 20; sx += 16) {
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(sx, zone.y + zone.h - 14, 8, 8);
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(sx + 8, zone.y + zone.h - 14, 8, 8);
    }
    ctx.restore();

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(zone.label, zone.x + zone.w / 2, zone.y + 28);
    ctx.fillStyle = '#6EE7B7';
    ctx.font = '500 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(zone.sublabel || '', zone.x + zone.w / 2, zone.y + 46);
  }

  // Target indicator dot on active target zones
  if (isTarget) {
    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.arc(zone.x + zone.w - 12, zone.y + 12, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawHazard(ctx: CanvasRenderingContext2D, hazard: FloorHazard, time: number) {
  ctx.save();
  ctx.translate(hazard.x, hazard.y);

  if (hazard.windup > 0) {
    // Telegraph warning ring before crate drops / oil spreads
    const ringPulse = 0.5 + 0.5 * Math.sin(time * 16);
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.globalAlpha = 0.45 + 0.5 * ringPulse;
    ctx.beginPath();
    ctx.arc(0, 0, hazard.radius + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#FCA5A5';
    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('!', 0, 4);
    ctx.restore();
    return;
  }

  if (hazard.type === 'OIL') {
    // Oil spill puddle
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.beginPath();
    ctx.ellipse(0, 0, hazard.radius, hazard.radius * 0.72, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Specular sheen
    ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
    ctx.beginPath();
    ctx.ellipse(-5, -4, hazard.radius * 0.45, hazard.radius * 0.22, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FBBF24';
    ctx.font = '700 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('OLI', 0, 3);
  } else {
    // Fallen crate obstacle
    const s = hazard.radius * 1.4;
    ctx.fillStyle = '#92400E';
    drawRoundedRect(ctx, -s / 2, -s / 2, s, s, 4);
    ctx.fill();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s / 2 + 4, -s / 2 + 4);
    ctx.lineTo(s / 2 - 4, s / 2 - 4);
    ctx.moveTo(s / 2 - 4, -s / 2 + 4);
    ctx.lineTo(-s / 2 + 4, s / 2 - 4);
    ctx.stroke();
  }

  ctx.restore();
}

function drawForklift(ctx: CanvasRenderingContext2D, fl: Forklift, time: number) {
  ctx.save();
  ctx.translate(fl.x, fl.y);

  // K3 Acoustic Horn Warning Wave (world-aligned before rotation)
  if (fl.hornPulse > 0) {
    const progress = 1 - fl.hornPulse / 0.8;
    const waveR = 24 + progress * 46;
    ctx.save();
    ctx.strokeStyle = '#FACC15';
    ctx.globalAlpha = Math.max(0, 1 - progress);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, waveR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#F97316';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(14, waveR - 12), 0, Math.PI * 2);
    ctx.stroke();

    if (progress < 0.75) {
      ctx.fillStyle = '#FEF08A';
      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('TIN! K3', 0, -24 - progress * 10);
    }
    ctx.restore();
  }

  ctx.rotate(fl.angle);

  // K3 Blue Safety Spotlight projected ahead on floor
  const spotGrad = ctx.createRadialGradient(54, 0, 2, 54, 0, 28);
  spotGrad.addColorStop(0, 'rgba(56, 189, 248, 0.42)');
  spotGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
  ctx.fillStyle = spotGrad;
  ctx.beginPath();
  ctx.arc(54, 0, 28, 0, Math.PI * 2);
  ctx.fill();

  // Subtle shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  drawRoundedRect(ctx, -20, -14, 42, 32, 6);
  ctx.fill();

  // Four industrial tires
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(-16, -17, 9, 4);
  ctx.fillRect(6, -17, 9, 4);
  ctx.fillRect(-16, 13, 9, 4);
  ctx.fillRect(6, 13, 9, 4);

  // Forks protruding forward (slight mast bobbing)
  const forkBob = Math.sin(time * 9) * 0.8;
  ctx.fillStyle = '#CBD5E1';
  ctx.fillRect(14 + forkBob, -10, 16, 4);
  ctx.fillRect(14 + forkBob, 6, 16, 4);

  // Pallet & cargo crate carried on forks
  ctx.fillStyle = '#78350F';
  ctx.fillRect(17 + forkBob, -11, 13, 22);
  ctx.fillStyle = fl.cargoColor;
  drawRoundedRect(ctx, 18 + forkBob, -9, 11, 18, 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1;
  ctx.strokeRect(19 + forkBob, -7, 9, 14);

  // Forklift Body (Safety Orange)
  ctx.fillStyle = '#F97316';
  drawRoundedRect(ctx, -18, -14, 34, 28, 5);
  ctx.fill();
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Rear counterweight hazard stripes
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(-17, -10, 4, 20);
  ctx.fillStyle = '#FACC15';
  ctx.fillRect(-17, -7, 4, 4);
  ctx.fillRect(-17, 3, 4, 4);

  // Cab Roof Cage
  ctx.fillStyle = '#1E293B';
  drawRoundedRect(ctx, -10, -10, 18, 20, 3);
  ctx.fill();

  // Rotating safety beacon light
  const beaconOn = Math.sin(time * 14) > 0;
  ctx.fillStyle = beaconOn ? '#FACC15' : '#92400E';
  ctx.beginPath();
  ctx.arc(-12, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  if (beaconOn) {
    ctx.fillStyle = 'rgba(250, 204, 21, 0.32)';
    ctx.beginPath();
    ctx.arc(-12, 0, 14, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: RenderState['player'],
  time: number
) {
  ctx.save();
  ctx.translate(player.x, player.y);

  // Status ring if slowed or stunned
  if (player.stunTimer > 0) {
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.stroke();
  } else if (player.slowTimer > 0) {
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.rotate(player.angle);

  // Walk bobbing feet
  const stride = Math.sin(player.walkPhase) * 4;
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.ellipse(stride, -8, 5, 3.5, 0, 0, Math.PI * 2);
  ctx.ellipse(-stride, 8, 5, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // High-visibility Vest Torso
  ctx.fillStyle = player.flashTimer > 0 ? '#FFFFFF' : '#EAB308';
  drawRoundedRect(ctx, -10, -13, 20, 26, 7);
  ctx.fill();
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Reflective vest stripes
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(-5, -11, 3, 22);

  // Arms / Hands holding cart or packed box
  if (player.carryingPackCount > 0) {
    // Packed sealed box ready for dispatch
    ctx.fillStyle = '#D97706';
    drawRoundedRect(ctx, 10, -11, 16, 22, 3);
    ctx.fill();
    ctx.strokeStyle = '#FEF3C7';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Tape stripe
    ctx.fillStyle = '#FDE68A';
    ctx.fillRect(10, -2, 16, 4);
  } else if (player.carryingPickedCount > 0) {
    // Picking basket with items
    ctx.fillStyle = '#38BDF8';
    drawRoundedRect(ctx, 10, -10, 13, 20, 3);
    ctx.fill();
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Safety Helmet (Safety Orange)
  ctx.fillStyle = '#F97316';
  ctx.beginPath();
  ctx.arc(0, 0, 9.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Helmet visor pointing forward
  ctx.fillStyle = '#FB923C';
  ctx.beginPath();
  ctx.arc(3, 0, 5, -Math.PI / 2, Math.PI / 2);
  ctx.fill();

  ctx.restore();

  // subtle badge above player if carrying ready-to-dispatch box
  if (player.carryingPackCount > 0) {
    const bob = Math.sin(time * 6) * 2;
    ctx.save();
    ctx.fillStyle = '#10B981';
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`SIAP KIRIM (${player.carryingPackCount})`, player.x, player.y - 24 + bob);
    ctx.restore();
  }
}
