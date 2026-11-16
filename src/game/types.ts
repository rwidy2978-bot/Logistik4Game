export type GamePhase = 'TITLE' | 'PLAYING' | 'PAUSED' | 'PACKING_MODAL' | 'GAME_OVER';

export type DifficultyLevel = 1 | 2 | 3;

export type HandlingLabel = 'FRAGILE' | 'THIS_WAY_UP' | 'KEEP_DRY';

export type SkuCategory = 'ELECTRONICS' | 'CHEMICALS' | 'TEXTILE';

export type RackId =
  | 'A1'
  | 'A2'
  | 'A3'
  | 'A4'
  | 'B1'
  | 'B2'
  | 'B3'
  | 'B4'
  | 'BUFFER';

export interface SkuDefinition {
  id: string;
  name: string;
  category: SkuCategory;
  rackId: Exclude<RackId, 'BUFFER'>;
  requiredLabel: HandlingLabel;
  shortHint: string;
  color: string;
}

export interface OrderItem {
  sku: SkuDefinition;
  qty: number;
  pickedQty: number;
  blindCountMissing: boolean;
  blindCountReported: boolean;
}

export type OrderStage = 'PICKING' | 'READY_TO_PACK' | 'READY_TO_DISPATCH' | 'DISPATCHED';

export interface Order {
  id: string;
  customer: string;
  items: OrderItem[];
  requiredLabel: HandlingLabel;
  stage: OrderStage;
  createdAtElapsed: number;
}

export interface LevelConfig {
  level: DifficultyLevel;
  title: string;
  subtitle: string;
  badgeText: string;
  durationSeconds: number;
  concurrentOrders: number;
  totalShiftOrders: number;
  skusPerOrder: number;
  forkliftCount: number;
  forkliftSpeed: number;
  hasDynamicObstacles: boolean;
  hasBlindCount: boolean;
  requiresHandlingLabel: boolean;
  description: string;
}

export interface RectZone {
  id: string;
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'RACK' | 'BUFFER' | 'PACKING' | 'DOCK' | 'DIVIDER';
  category?: SkuCategory;
  rackId?: RackId;
}

export interface Forklift {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  waypoints: Array<{ x: number; y: number }>;
  targetIdx: number;
  speed: number;
  baseSpeed: number;
  angle: number;
  warningTimer: number;
  hornPulse: number;
  cargoColor: string;
}

export interface FloorHazard {
  id: string;
  type: 'OIL' | 'CRATE';
  x: number;
  y: number;
  radius: number;
  ttl: number;
  windup: number; // >0 means telegraph warning before active
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface FeedbackEntry {
  type: 'POSITIVE' | 'ERROR' | 'INFO';
  message: string;
}

export interface ShiftStats {
  level: DifficultyLevel;
  score: number;
  packagePoints: number;
  timeBonus: number;
  penaltyPoints: number;
  packagesDelivered: number;
  targetPackages: number;
  correctActions: number;
  totalActions: number;
  accuracyPercent: number;
  wrongRackCount: number;
  wrongLabelCount: number;
  hazardHits: number;
  blindCountsResolved: number;
  timeRemaining: number;
  durationSeconds: number;
  avgCycleSeconds: number;
  competencyGrade: 'Sangat Kompeten' | 'Kompeten' | 'Perlu Latihan';
  lessons: string[];
}

export interface HudSnapshot {
  score: number;
  timeRemaining: number;
  packagesDelivered: number;
  targetPackages: number;
  correctActions: number;
  totalActions: number;
  activeOrders: Order[];
  nearbyPrompt: string | null;
  statusBanner: { text: string; tone: 'info' | 'success' | 'warning' | 'error' } | null;
}
