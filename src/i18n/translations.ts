export type LangCode = 'en';

export interface UIMessages {
  appSubtitle: string;
  navHome: string;
  navWorkspace: string;
  navTemplates: string;
  navMapCanvas: string;
  navCad: string;
  easyModeOn: string;
  proModeOn: string;
  langLabel: string;
  themeSizeBtn: string;
  saveRun: string;
  firebaseOk: string;
  firebaseSetup: string;
  filterAll: string;
  filterPro: string;
  filterEveryday: string;
  allTemplatesJump: string;
  before2d: string;
  after3d: string;
  view3dPack: string;
  view3dHeatmap: string;
  view3dGolden: string;
  dragMoveOn: string;
  dragMoveOff: string;
  optGoalLabel: string;
  goalBalanced: string;
  goalSpeed: string;
  goalDensity: string;
  goalSafety: string;
  quickEditBarLabel: string;
  quickAddLevel: string;
  quickDeleteBin: string;
  quickPinTopSku: string;
  quickClearPins: string;
  quickResetBins: string;
  quickSelectHint: string;
  tabOptimize: string;
  tabEditSpaceCargo: string;
  tabInspect: string;
  kpiSpaceFit: string;
  kpiPickSpeed: string;
  kpiGoldenHit: string;
  kpiSavedBins: string;
  kpiSafety: string;
  homeBadge: string;
  homeTitle: string;
  homeSubtitle: string;
  homeOpen3dBtn: string;
  homeOpenCanvasBtn: string;
  homeBuilderTitle: string;
  homeBuilderSubtitle: string;
  homeWidthLabel: string;
  homeDepthLabel: string;
  homeLevelsLabel: string;
  homeShelfSizeLabel: string;
  homeShelfSmall: string;
  homeShelfMedium: string;
  homeShelfLarge: string;
  homeApplyRoomBtn: string;
  homeActiveSpaceLabel: string;
  homeFilterEveryday: string;
  homeFilterPro: string;
  homeFilterAll: string;
  homeSearchPlaceholder: string;
  homeCardOpen3d: string;
  homeCardApplyHere: string;
  tplModalTitle: string;
  tplModalSubtitle: string;
  tplSearchPlaceholder: string;
  tplAllCategories: string;
  optimizerSummaryTitle: string;
  optimizerView3d: string;
  optimizerFreedBins: string;
  optimizerWasteCut: string;
  optimizerControlsTitle: string;
  optimizerSmartFitTitle: string;
  optimizerSmartFitDesc: string;
  optimizerGoldenBandLabel: string;
  optimizerZSliceTitle: string;
  optimizerShowAllZ: string;
  cadTitle: string;
  cadSubtitle: string;
  cadDownloadDxf: string;
  cadDownloadSvg: string;
  cadPrint: string;
  designStudioTitle: string;
  inspectorClickHint: string;
  inspectorClickDesc: string;
  inspectorTopWave: string;
  inspectorAiAudit: string;
  inspectorDeleteBin: string;
}

const ENGLISH_MESSAGES: UIMessages = {
  appSubtitle: '3D Warehouse & Living Space Optimization Twin',
  navHome: 'Everyday Home',
  navWorkspace: '3D Studio',
  navTemplates: 'Templates',
  navMapCanvas: 'Map Canvas',
  navCad: '2D CAD',
  easyModeOn: 'Easy Mode ✓',
  proModeOn: 'Pro Terms',
  langLabel: 'EN',
  themeSizeBtn: 'Size',
  saveRun: 'Save Run',
  firebaseOk: 'Firebase OK',
  firebaseSetup: 'Firebase',
  filterAll: 'All',
  filterPro: 'Pro',
  filterEveryday: 'Everyday',
  allTemplatesJump: 'Jump to any of 24 templates...',
  before2d: 'Before: 2D Baseline',
  after3d: 'After: 3D Optimized',
  view3dPack: '3D Pack',
  view3dHeatmap: '3D Heatmap',
  view3dGolden: 'Golden Zone',
  dragMoveOn: '3D Drag Move: ON',
  dragMoveOff: 'Drag Move Racks',
  optGoalLabel: '3D Goal:',
  goalBalanced: 'Balanced',
  goalSpeed: 'Fast Pick',
  goalDensity: 'Max Density',
  goalSafety: 'Max Safety',
  quickEditBarLabel: 'Quick 3D Edit',
  quickAddLevel: '+1 Level',
  quickDeleteBin: 'Delete Bin',
  quickPinTopSku: '+1 Pin Top Item',
  quickClearPins: 'Unpin All',
  quickResetBins: 'Reset Space',
  quickSelectHint:
    'Click any 3D rack bin to add levels, delete bins, or pin items directly.',
  tabOptimize: 'Auto Optimize',
  tabEditSpaceCargo: 'Space & Items',
  tabInspect: 'Shelf & Box Size',
  kpiSpaceFit: '3D Cubic Utilization',
  kpiPickSpeed: 'Avg 3D Pick Cycle',
  kpiGoldenHit: 'Golden Zone Hit (A)',
  kpiSavedBins: 'Saved Bins & Ergo',
  kpiSafety: 'Rack Safety Hazards',
  homeBadge: 'Everyday Home & Smart Storage Hub',
  homeTitle: 'Organize Every Room, Pantry, Shop & Rack in Interactive 3D',
  homeSubtitle:
    'Pick from 24 real-world everyday & pro space templates (pantry, fridge, closet, garage, camping, studio wall, smart store) and launch 3D slotting + CAD plans in one click.',
  homeOpen3dBtn: 'Open in 3D Studio',
  homeOpenCanvasBtn: 'Edit Size in 2D Canvas',
  homeBuilderTitle: '10-Second Custom Room / Shelf Builder',
  homeBuilderSubtitle:
    'Adjust width, depth, levels & bin size to generate your own 3D space.',
  homeWidthLabel: 'Room Width (m)',
  homeDepthLabel: 'Room Depth (m)',
  homeLevelsLabel: 'Shelf Levels',
  homeShelfSizeLabel: 'Shelf Bin Size',
  homeShelfSmall: 'Compact (Home/Pantry)',
  homeShelfMedium: 'Medium (Garage/Studio)',
  homeShelfLarge: 'Large (Warehouse/Pallet)',
  homeApplyRoomBtn: 'Create My 3D Space',
  homeActiveSpaceLabel: 'Active Space',
  homeFilterEveryday: 'Everyday / Home (12)',
  homeFilterPro: 'Pro Logistics (12)',
  homeFilterAll: 'All Templates (24)',
  homeSearchPlaceholder:
    'Search spaces (pantry, fridge, camping, studio, cafe, AS/RS...)',
  homeCardOpen3d: 'Apply & Open 3D',
  homeCardApplyHere: 'Apply Here',
  tplModalTitle: 'Space & Cargo Template Library',
  tplModalSubtitle:
    '12 Pro Logistics WMS + 12 Everyday Home & Shop templates — 1-click ready',
  tplSearchPlaceholder: 'Search templates (pantry, camping, AS/RS, fridge...)',
  tplAllCategories: 'All Categories',
  optimizerSummaryTitle: '3D Space Gain Summary',
  optimizerView3d: 'View 3D Result',
  optimizerFreedBins: 'Freed Rack Bins',
  optimizerWasteCut: 'Void Waste Cut',
  optimizerControlsTitle: 'Interactive Space Controls',
  optimizerSmartFitTitle: '3D Rotation & Divider Co-Pack',
  optimizerSmartFitDesc:
    'Rotates cartons in 6 axes & shares compatible bins to cut void honeycombing.',
  optimizerGoldenBandLabel: 'Golden Zone Elevation Band',
  optimizerZSliceTitle: 'Z-Axis Level Utilization (Click to Slice)',
  optimizerShowAllZ: 'Show All Z',
  cadTitle: '2D CAD Blueprint & DXF Exporter',
  cadSubtitle:
    'Metric 1:1 drawing units (meters) · Plan View (X-Y) + Front Z-Elevation',
  cadDownloadDxf: 'Download Standard CAD .DXF',
  cadDownloadSvg: 'Download .SVG Blueprint',
  cadPrint: 'Print / PDF',
  designStudioTitle: 'Design & Size Studio',
  inspectorClickHint: 'Left-click to Inspect · Right-click for Actions',
  inspectorClickDesc:
    'Click any rack bin to inspect 3D coordinates, or right-click in 3D space to add/delete bins, pin cargo, or export CAD.',
  inspectorTopWave: '5-Stop Top Pick Wave',
  inspectorAiAudit: 'AI Audit Bin',
  inspectorDeleteBin: 'Delete Bin',
};

export const UI_MESSAGES: Record<LangCode, UIMessages> = {
  en: ENGLISH_MESSAGES,
};

export function t(_lang: LangCode, key: keyof UIMessages): string {
  return ENGLISH_MESSAGES[key];
}
