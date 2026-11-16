import {
  DifficultyLevel,
  Forklift,
  HandlingLabel,
  LevelConfig,
  Order,
  OrderItem,
  RectZone,
  SkuDefinition,
} from './types';

export const WORLD_WIDTH = 960;
export const WORLD_HEIGHT = 620;

export const LEVEL_CONFIGS: Record<DifficultyLevel, LevelConfig> = {
  1: {
    level: 1,
    title: 'Level 1: Magang',
    subtitle: 'Discrete Picking',
    badgeText: '60 Detik · 1 Order/Siklus',
    durationSeconds: 60,
    concurrentOrders: 1,
    totalShiftOrders: 3,
    skusPerOrder: 3,
    forkliftCount: 1,
    forkliftSpeed: 88,
    hasDynamicObstacles: false,
    hasBlindCount: false,
    requiresHandlingLabel: true,
    description:
      'Fokus ketelitian dasar: ambil 3 SKU per pesanan secara berurutan, pasang label di Meja Packing, dan kirim ke Loading Dock.',
  },
  2: {
    level: 2,
    title: 'Level 2: Operator Senior',
    subtitle: 'Batch Picking',
    badgeText: '75 Detik · 2 Order Paralel',
    durationSeconds: 75,
    concurrentOrders: 2,
    totalShiftOrders: 4,
    skusPerOrder: 3,
    forkliftCount: 2,
    forkliftSpeed: 122,
    hasDynamicObstacles: true,
    hasBlindCount: false,
    requiresHandlingLabel: true,
    description:
      'Tangani 2 pesanan sekaligus (Batch Picking). Waspadai rintangan kotak jatuh & tumpahan oli serta wajib pilih Handling Label yang tepat.',
  },
  3: {
    level: 3,
    title: 'Level 3: Kepala Gudang',
    subtitle: 'Zone & Rush Hour',
    badgeText: '90 Detik · 3 Order + Blind Count',
    durationSeconds: 90,
    concurrentOrders: 3,
    totalShiftOrders: 5,
    skusPerOrder: 3,
    forkliftCount: 2,
    forkliftSpeed: 158,
    hasDynamicObstacles: true,
    hasBlindCount: true,
    requiresHandlingLabel: true,
    description:
      'Jam sibuk ekstrem! Kelola 3 pesanan kilat, tangani selisih stok (Blind Count) lewat Zona Cadangan, dan hindari penalti salah rute atau salah label.',
  },
};

export const HANDLING_LABEL_META: Record<
  HandlingLabel,
  {
    title: string;
    subtitle: string;
    rule: string;
    color: string;
    bgClass: string;
    borderClass: string;
  }
> = {
  FRAGILE: {
    title: 'FRAGILE',
    subtitle: 'Barang Mudah Pecah',
    rule: 'Untuk barang elektronik presisi, kaca optik, sensor & perangkat rentan benturan.',
    color: '#38BDF8',
    bgClass: 'bg-sky-500/15',
    borderClass: 'border-sky-400',
  },
  THIS_WAY_UP: {
    title: 'THIS WAY UP',
    subtitle: 'Posisi Tutup di Atas',
    rule: 'Untuk cairan kimia, pelumas industri, aki/baterai basah agar tidak tumpah atau bocor.',
    color: '#F59E0B',
    bgClass: 'bg-amber-500/15',
    borderClass: 'border-amber-400',
  },
  KEEP_DRY: {
    title: 'KEEP DRY',
    subtitle: 'Jaga Tetap Kering',
    rule: 'Untuk produk tekstil, kain seragam, dokumen arsip & karton sensitif kelembaban.',
    color: '#10B981',
    bgClass: 'bg-emerald-500/15',
    borderClass: 'border-emerald-400',
  },
};

export const SKU_CATALOG: SkuDefinition[] = [
  {
    id: 'SKU-E01',
    name: 'Kaca Optik Lab',
    category: 'ELECTRONICS',
    rackId: 'A1',
    requiredLabel: 'FRAGILE',
    shortHint: 'Lensa optik presisi rentan retak',
    color: '#38BDF8',
  },
  {
    id: 'SKU-E02',
    name: 'Panel Sensor PLC',
    category: 'ELECTRONICS',
    rackId: 'A2',
    requiredLabel: 'FRAGILE',
    shortHint: 'Komponen elektronik sensitif guncangan',
    color: '#38BDF8',
  },
  {
    id: 'SKU-C01',
    name: 'Cairan Pelumas SAE',
    category: 'CHEMICALS',
    rackId: 'A3',
    requiredLabel: 'THIS_WAY_UP',
    shortHint: 'Jerigen cairan wajib berdiri tegak',
    color: '#F59E0B',
  },
  {
    id: 'SKU-C02',
    name: 'Reagen Kimia Industri',
    category: 'CHEMICALS',
    rackId: 'A4',
    requiredLabel: 'THIS_WAY_UP',
    shortHint: 'Botol kimia bersegel tutup atas',
    color: '#F59E0B',
  },
  {
    id: 'SKU-T01',
    name: 'Kain Katun Ekspor',
    category: 'TEXTILE',
    rackId: 'B1',
    requiredLabel: 'KEEP_DRY',
    shortHint: 'Gulungan tekstil anti-lembab',
    color: '#10B981',
  },
  {
    id: 'SKU-T02',
    name: 'Karton Kertas Arsip',
    category: 'TEXTILE',
    rackId: 'B2',
    requiredLabel: 'KEEP_DRY',
    shortHint: 'Media kertas sensitif air & hujan',
    color: '#10B981',
  },
  {
    id: 'SKU-E03',
    name: 'Monitor Scanner Barcode',
    category: 'ELECTRONICS',
    rackId: 'B3',
    requiredLabel: 'FRAGILE',
    shortHint: 'Layar kaca & modul optik',
    color: '#38BDF8',
  },
  {
    id: 'SKU-C03',
    name: 'Solvent Pembersih Mesin',
    category: 'CHEMICALS',
    rackId: 'B4',
    requiredLabel: 'THIS_WAY_UP',
    shortHint: 'Cairan kimia industri mudah bocor',
    color: '#F59E0B',
  },
];

// U-Shape Warehouse Layout (960 x 620)
export const WAREHOUSE_ZONES: RectZone[] = [
  // Left Wing Racks (A1-A4)
  {
    id: 'RACK-A1',
    label: 'RAK A1',
    sublabel: 'Kaca Optik',
    x: 34,
    y: 74,
    w: 98,
    h: 92,
    type: 'RACK',
    rackId: 'A1',
    category: 'ELECTRONICS',
  },
  {
    id: 'RACK-A2',
    label: 'RAK A2',
    sublabel: 'Sensor PLC',
    x: 34,
    y: 186,
    w: 98,
    h: 92,
    type: 'RACK',
    rackId: 'A2',
    category: 'ELECTRONICS',
  },
  {
    id: 'RACK-A3',
    label: 'RAK A3',
    sublabel: 'Pelumas SAE',
    x: 34,
    y: 298,
    w: 98,
    h: 92,
    type: 'RACK',
    rackId: 'A3',
    category: 'CHEMICALS',
  },
  {
    id: 'RACK-A4',
    label: 'RAK A4',
    sublabel: 'Reagen Kimia',
    x: 34,
    y: 410,
    w: 98,
    h: 92,
    type: 'RACK',
    rackId: 'A4',
    category: 'CHEMICALS',
  },

  // Right Wing Racks (B1-B4)
  {
    id: 'RACK-B1',
    label: 'RAK B1',
    sublabel: 'Kain Ekspor',
    x: 828,
    y: 74,
    w: 98,
    h: 92,
    type: 'RACK',
    rackId: 'B1',
    category: 'TEXTILE',
  },
  {
    id: 'RACK-B2',
    label: 'RAK B2',
    sublabel: 'Kertas Arsip',
    x: 828,
    y: 186,
    w: 98,
    h: 92,
    type: 'RACK',
    rackId: 'B2',
    category: 'TEXTILE',
  },
  {
    id: 'RACK-B3',
    label: 'RAK B3',
    sublabel: 'Scanner LCD',
    x: 828,
    y: 298,
    w: 98,
    h: 92,
    type: 'RACK',
    rackId: 'B3',
    category: 'ELECTRONICS',
  },
  {
    id: 'RACK-B4',
    label: 'RAK B4',
    sublabel: 'Solvent Cair',
    x: 828,
    y: 410,
    w: 98,
    h: 92,
    type: 'RACK',
    rackId: 'B4',
    category: 'CHEMICALS',
  },

  // Top Center Buffer / Reserve Stock Zone (for Blind Count Level 3)
  {
    id: 'ZONE-BUFFER',
    label: 'ZONA CADANGAN',
    sublabel: 'Buffer Stock',
    x: 380,
    y: 24,
    w: 200,
    h: 66,
    type: 'BUFFER',
    rackId: 'BUFFER',
  },

  // Central Staging Divider creating the U-Shape flow corridor
  {
    id: 'CENTER-ISLAND',
    label: 'STAGING PALLET',
    sublabel: 'Koridor U-Flow',
    x: 380,
    y: 204,
    w: 200,
    h: 162,
    type: 'DIVIDER',
  },

  // Bottom Packing Station (QC & Handling Label)
  {
    id: 'ZONE-PACKING',
    label: 'MEJA PACKING',
    sublabel: 'QC & Handling Label',
    x: 205,
    y: 522,
    w: 225,
    h: 74,
    type: 'PACKING',
  },

  // Bottom Loading Dock (Dispatch)
  {
    id: 'ZONE-DOCK',
    label: 'LOADING DOCK',
    sublabel: 'Area Dispatch Truk',
    x: 530,
    y: 522,
    w: 235,
    h: 74,
    type: 'DOCK',
  },
];

const CUSTOMERS = [
  'PT Nusantara Logistik',
  'CV Mitra Industri',
  'PT Elektronika Presisi',
  'PT Kimia Sentosa',
  'PT Tekstil Sejahtera',
  'UD Harapan Jaya',
  'PT Mega Manufaktur',
];

export function createForkliftsForLevel(config: LevelConfig): Forklift[] {
  const routes: Array<Array<{ x: number; y: number }>> = [
    [
      { x: 245, y: 145 },
      { x: 245, y: 445 },
      { x: 715, y: 445 },
      { x: 715, y: 145 },
    ],
    [
      { x: 715, y: 445 },
      { x: 245, y: 445 },
      { x: 245, y: 145 },
      { x: 715, y: 145 },
    ],
  ];

  const cargoColors = ['#D97706', '#0284C7'];

  return Array.from({ length: config.forkliftCount }, (_, i) => {
    const waypoints = routes[i % routes.length];
    const start = waypoints[0];
    const next = waypoints[1];
    const baseSpeed = config.forkliftSpeed * (i === 1 ? 0.92 : 1);
    return {
      id: `FL-${i + 1}`,
      x: start.x,
      y: start.y,
      w: 38,
      h: 28,
      waypoints,
      targetIdx: 1,
      speed: baseSpeed,
      baseSpeed,
      angle: Math.atan2(next.y - start.y, next.x - start.x),
      warningTimer: 0.8 + Math.random() * 1.4,
      hornPulse: 0,
      cargoColor: cargoColors[i % cargoColors.length],
    };
  });
}

export function generateOrder(
  orderIndex: number,
  config: LevelConfig,
  elapsedTime: number
): Order {
  // Choose a primary Handling Label theme for this order so the Packing Label question is 100% unambiguous
  const labels: HandlingLabel[] = ['FRAGILE', 'THIS_WAY_UP', 'KEEP_DRY'];
  const primaryLabel = labels[(orderIndex + Math.floor(Math.random() * 3)) % labels.length];

  const matchingSkus = SKU_CATALOG.filter((s) => s.requiredLabel === primaryLabel);
  const otherSkus = SKU_CATALOG.filter((s) => s.requiredLabel !== primaryLabel);

  // Pick 2 matching SKUs + 1 supplementary or matching SKU so primary category dominates unambiguously,
  // OR pick all items from the matching category when possible so students clearly associate product -> handling label.
  const selectedSkus: SkuDefinition[] = [];
  const shuffledMatching = [...matchingSkus].sort(() => Math.random() - 0.5);

  for (let i = 0; i < config.skusPerOrder; i++) {
    if (i < shuffledMatching.length) {
      selectedSkus.push(shuffledMatching[i]);
    } else {
      // Pick one more from matching (with qty 2 or another) or another rack
      const extra =
        matchingSkus[i % matchingSkus.length] || otherSkus[i % otherSkus.length];
      if (!selectedSkus.some((s) => s.id === extra.id)) {
        selectedSkus.push(extra);
      } else {
        // Pick a unique SKU from otherSkus as filler only if needed, while keeping primary dominant
        const uniqueOther = otherSkus.find((o) => !selectedSkus.some((s) => s.id === o.id));
        if (uniqueOther) selectedSkus.push(uniqueOther);
      }
    }
  }

  // Decide if one item triggers Blind Count (Selisih Stok) in Level 3
  const blindIdx = config.hasBlindCount ? Math.floor(Math.random() * selectedSkus.length) : -1;

  const items: OrderItem[] = selectedSkus.map((sku, idx) => ({
    sku,
    qty: idx === 0 ? 2 : 1,
    pickedQty: 0,
    blindCountMissing: idx === blindIdx,
    blindCountReported: false,
  }));

  // Guarantee unambiguous requiredLabel: the majority / primary item label (index 0 has qty 2 and index 1 also matches primaryLabel)
  const customer = CUSTOMERS[(orderIndex + Math.floor(Math.random() * CUSTOMERS.length)) % CUSTOMERS.length];

  return {
    id: `ORD-${101 + orderIndex}`,
    customer,
    items,
    requiredLabel: primaryLabel,
    stage: 'PICKING',
    createdAtElapsed: elapsedTime,
  };
}
