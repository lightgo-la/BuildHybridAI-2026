export type ABCClass = 'A' | 'B' | 'C';

export type EquipmentMode = 'reach_truck' | 'asrs_crane';

export type ViewLayerMode = 'slotting' | 'heatmap' | 'golden_zone';

export interface SKUItem {
  id: string;
  skuCode: string;
  name: string;
  category: string;
  abcClass: ABCClass;
  dailyPicks: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightKg: number;
  quantity: number;
  fragile: boolean;
  color: string;
}

export interface BinSpec {
  id: string;
  aisle: number; // 1..N (X)
  bay: number;   // 1..M (Y)
  level: number; // 1..K (Z)
  xMeters: number;
  yMeters: number;
  zMeters: number; // bottom elevation in meters
  binLengthCm: number;
  binWidthCm: number;
  binHeightCm: number;
  maxWeightKg: number;
  isGoldenZone: boolean;
}

export interface PackedBox {
  skuId: string;
  skuCode: string;
  name: string;
  abcClass: ABCClass;
  xCm: number;
  yCm: number;
  zCm: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightKg: number;
  fragile: boolean;
  rotated: boolean;
  color: string;
  dailyPicksShare: number;
}

export interface BinAllocation {
  bin: BinSpec;
  boxes: PackedBox[];
  usedVolumeCm3: number;
  totalVolumeCm3: number;
  cubicUtilizationPct: number;
  currentWeightKg: number;
  dailyPickLoad: number;
  ergonomicsPenalty: number;
  safetyViolation: boolean;
  goldenZoneAligned: boolean;
}

export interface PickWaypoint {
  binId: string;
  xMeters: number;
  yMeters: number;
  zMeters: number;
  skuCode: string;
  stepTimeSec: number;
}

export interface WarehouseKPIs {
  cubicUtilizationPct: number;
  honeycombingWastePct: number;
  avgCycleTimeSec: number;
  travelEnergyIndex: number;
  goldenZoneHitRatePct: number;
  ergonomicsScore: number; // 0-100 higher is better
  safetyViolations: number;
  maxCongestionPct: number;
  occupiedBins: number;
  totalBins: number;
}

export interface SlottingResult {
  mode: 'baseline_2d' | 'optimized_3d';
  allocations: BinAllocation[];
  unplacedUnits: number;
  kpis: WarehouseKPIs;
  pickRoute: PickWaypoint[];
}

export interface WarehouseObstacle {
  id: string;
  aisle: number;
  bay: number;
  xMeters: number;
  yMeters: number;
  label: string;
}

export type OptimizationPreset = 'balanced' | 'speed' | 'density' | 'safety';

export type RoomEnclosureStyle =
  | 'cutaway_corner'
  | 'three_walls'
  | 'glass_room'
  | 'open_floor';

export type InteriorPropType =
  | 'desk_work'
  | 'island_counter'
  | 'fridge_unit'
  | 'washer_dryer'
  | 'wardrobe_mirror'
  | 'sofa_lounge'
  | 'window_frame'
  | 'door_entry'
  | 'plant_pot'
  | 'rug_carpet'
  | 'tool_cabinet'
  | 'forklift_unit';

export interface InteriorProp {
  id: string;
  type: InteriorPropType;
  label: string;
  xMeters: number;
  yMeters: number;
  rotationDeg: number;
  scale: number;
  color: string;
}

export interface WarehouseConfig {
  aisles: number;
  baysPerAisle: number;
  levels: number;
  equipmentMode: EquipmentMode;
  goldenZoneMinM: number;
  goldenZoneMaxM: number;
  aisleSpacingM?: number;
  baySpacingM?: number;
  binLengthCm?: number;
  binWidthCm?: number;
  binHeightCm?: number;
  allowRotationAndCoPack?: boolean;
  optimizationPreset?: OptimizationPreset;
  mapTag?: string;
  depotXMeters?: number;
  depotYMeters?: number;
  floorWidthM?: number;
  floorDepthM?: number;
  obstacles?: WarehouseObstacle[];
  disabledBinIds?: string[];
  interiorProps?: InteriorProp[];
  roomEnclosure?: RoomEnclosureStyle;
  wallColor?: string;
}

export type TemplateCategory =
  | 'logistics'
  | 'retail_cold'
  | 'home_living'
  | 'garage_hobby'
  | 'shop_office';

export interface WarehouseTemplate extends WarehouseScenario {
  persona: 'professional' | 'everyday';
  category: TemplateCategory;
  highlights: string;
  imageUrl?: string;
}

export interface PinnedCargoPlacement {
  binId: string;
  skuId: string;
  count: number;
}

export interface ZLevelSummary {
  level: number;
  zMeters: number;
  isGoldenZone: boolean;
  totalBins: number;
  occupiedBins: number;
  avgCubicPct: number;
  pickLoadSharePct: number;
  safetyViolations: number;
}

export interface WarehouseScenario {
  id: string;
  name: string;
  description: string;
  config: WarehouseConfig;
  skus: SKUItem[];
  customBins?: BinSpec[];
}
