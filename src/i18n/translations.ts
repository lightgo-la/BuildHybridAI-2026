export type LangCode = 'ko' | 'en';

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

export const UI_MESSAGES: Record<LangCode, UIMessages> = {
  ko: {
    appSubtitle: '3D 입체 적재·수납 최적화 디지털 트윈',
    navHome: '일상 생활 홈',
    navWorkspace: '3D 작업실',
    navTemplates: '템플릿',
    navMapCanvas: '2D 자유 맵',
    navCad: '2D 도면(CAD)',
    easyModeOn: '쉬운 말 ✓',
    proModeOn: '전문 용어',
    langLabel: '한국어',
    themeSizeBtn: '크기/테마',
    saveRun: '결과 저장',
    firebaseOk: 'Firebase 연결됨',
    firebaseSetup: 'Firebase 설정',
    filterAll: '전체',
    filterPro: '전문 물류',
    filterEveryday: '일상 수납',
    allTemplatesJump: '24종 템플릿 바로 선택...',
    before2d: '적용 전: 2D 일반 배치',
    after3d: '적용 후: 3D 최적화',
    view3dPack: '3D 적재 보기',
    view3dHeatmap: '빈도 히트맵',
    view3dGolden: '허리높이 존',
    dragMoveOn: '3D 선반 드래그 이동 중 ✓',
    dragMoveOff: '3D 선반 드래그 이동',
    optGoalLabel: '3D 목표:',
    goalBalanced: '균형',
    goalSpeed: '빠른 동선',
    goalDensity: '공간 압축',
    goalSafety: '안전 최우선',
    quickEditBarLabel: '3D 빠른 편집',
    quickAddLevel: '+1단 추가',
    quickDeleteBin: '칸 삭제',
    quickPinTopSku: '주력품 +1 고정',
    quickClearPins: '고정 해제',
    quickResetBins: '공간 초기화',
    quickSelectHint: '3D 선반 칸을 클릭하면 여기서 바로 1단 추가·삭제·물품 고정이 가능합니다.',
    tabOptimize: '최적화 요약',
    tabEditSpaceCargo: '공간·물건 편집',
    tabInspect: '상세 보기',
    kpiSpaceFit: '공간 활용률',
    kpiPickSpeed: '꺼내는 속도',
    kpiGoldenHit: '허리높이 적중',
    kpiSavedBins: '절약된 선반 칸',
    kpiSafety: '안전 위험',
    homeBadge: '일상 수납 & 스마트 공간 도우미',
    homeTitle: '우리 집·가게·작업실 공간을 한눈에 3D로 정리하세요',
    homeSubtitle:
      '팬트리, 냉장고, 드레스룸, 차고, 원룸, 스마트스토어 등 24종 실생활·전문 공간 템플릿을 고르고 클릭 한 번으로 최적 배치와 3D 도면을 완성할 수 있습니다.',
    homeOpen3dBtn: '3D 화면에서 바로 보기',
    homeOpenCanvasBtn: '2D 자유 맵으로 크기 수정',
    homeBuilderTitle: '내 방·선반 10초 맞춤 만들기',
    homeBuilderSubtitle: '가로·깊이·선반 단수를 고르면 바로 새 3D 공간을 생성합니다.',
    homeWidthLabel: '공간 가로 폭 (m)',
    homeDepthLabel: '공간 깊이 (m)',
    homeLevelsLabel: '선반 높이 단수',
    homeShelfSizeLabel: '선반 칸 크기',
    homeShelfSmall: '소형(가정/팬트리)',
    homeShelfMedium: '중형(차고/원룸)',
    homeShelfLarge: '대형(창고/팔레트)',
    homeApplyRoomBtn: '내 방 크기로 3D 생성',
    homeActiveSpaceLabel: '현재 선택된 공간',
    homeFilterEveryday: '일상·가정 (12종)',
    homeFilterPro: '전문·물류 (12종)',
    homeFilterAll: '전체 템플릿 (24종)',
    homeSearchPlaceholder: '공간 검색 (팬트리, 냉장고, 캠핑, 원룸, 카페, 창고...)',
    homeCardOpen3d: '적용 후 3D 보기',
    homeCardApplyHere: '현재 공간 적용',
    tplModalTitle: '공간 & 수납 템플릿 라이브러리',
    tplModalSubtitle: '전문 물류 12종 + 일상생활·가정·매장 12종 — 클릭 즉시 2D·3D 반영',
    tplSearchPlaceholder: '템플릿 검색 (팬트리, 캠핑, 냉장고, AS/RS...)',
    tplAllCategories: '전체 카테고리',
    optimizerSummaryTitle: '3D 최적화 효과 요약',
    optimizerView3d: '3D 결과 보기',
    optimizerFreedBins: '절약된 선반 칸',
    optimizerWasteCut: '빈틈 낭비 감소',
    optimizerControlsTitle: '3D 최적화 간편 조절',
    optimizerSmartFitTitle: '자동 회전 & 빈틈 채움 (Smart Fit)',
    optimizerSmartFitDesc: '상자를 6방향으로 회전하고 남는 공간에 호환 물건을 함께 수납해 빈틈을 줄입니다.',
    optimizerGoldenBandLabel: '손 닿기 편한 높이 (Golden Zone)',
    optimizerZSliceTitle: '층별(Z축) 공간 활용도 (클릭해 층만 보기)',
    optimizerShowAllZ: '전체 층 보기',
    cadTitle: '2D CAD 설계 도면 & DXF 내보내기',
    cadSubtitle: '실측 미터(1:1m) 기준 · 평면도(X-Y) + 정면 입면도(X-Z)',
    cadDownloadDxf: 'AutoCAD .DXF 다운로드',
    cadDownloadSvg: '.SVG 도면 다운로드',
    cadPrint: '인쇄 / PDF',
    designStudioTitle: '디자인 & 화면 크기 스튜디오',
    inspectorClickHint: '3D 화면에서 칸을 클릭해 보세요',
    inspectorClickDesc: '선반 칸을 클릭하면 내부 3D 배치와 무게를 볼 수 있고, 우클릭하면 추가·삭제·물품 고정이 가능합니다.',
    inspectorTopWave: '가장 자주 꺼내는 상위 5곳',
    inspectorAiAudit: 'AI 정밀 진단',
    inspectorDeleteBin: '이 칸 삭제',
  },
  en: {
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
    quickSelectHint: 'Click any 3D rack bin to add levels, delete bins, or pin items directly.',
    tabOptimize: 'Optimize',
    tabEditSpaceCargo: 'Edit Space',
    tabInspect: 'Inspect',
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
    homeBuilderSubtitle: 'Adjust width, depth, levels & bin size to generate your own 3D space.',
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
    homeSearchPlaceholder: 'Search spaces (pantry, fridge, camping, studio, cafe, AS/RS...)',
    homeCardOpen3d: 'Apply & Open 3D',
    homeCardApplyHere: 'Apply Here',
    tplModalTitle: 'Space & Cargo Template Library',
    tplModalSubtitle: '12 Pro Logistics WMS + 12 Everyday Home & Shop templates — 1-click ready',
    tplSearchPlaceholder: 'Search templates (pantry, camping, AS/RS, fridge...)',
    tplAllCategories: 'All Categories',
    optimizerSummaryTitle: '3D Space Gain Summary',
    optimizerView3d: 'View 3D Result',
    optimizerFreedBins: 'Freed Rack Bins',
    optimizerWasteCut: 'Void Waste Cut',
    optimizerControlsTitle: 'Interactive Space Controls',
    optimizerSmartFitTitle: '3D Rotation & Divider Co-Pack',
    optimizerSmartFitDesc: 'Rotates cartons in 6 axes & shares compatible bins to cut void honeycombing.',
    optimizerGoldenBandLabel: 'Golden Zone Elevation Band',
    optimizerZSliceTitle: 'Z-Axis Level Utilization (Click to Slice)',
    optimizerShowAllZ: 'Show All Z',
    cadTitle: '2D CAD Blueprint & DXF Exporter',
    cadSubtitle: 'Metric 1:1 drawing units (meters) · Plan View (X-Y) + Front Z-Elevation',
    cadDownloadDxf: 'Download AutoCAD .DXF',
    cadDownloadSvg: 'Download .SVG Blueprint',
    cadPrint: 'Print / PDF',
    designStudioTitle: 'Design & Size Studio',
    inspectorClickHint: 'Left-click to Inspect · Right-click for Actions',
    inspectorClickDesc: 'Click any rack bin to inspect 3D coordinates, or right-click in 3D space to add/delete bins, pin cargo, or export CAD.',
    inspectorTopWave: '5-Stop Top Pick Wave',
    inspectorAiAudit: 'AI Audit Bin',
    inspectorDeleteBin: 'Delete Bin',
  },
};

export function t(lang: LangCode, key: keyof UIMessages): string {
  return UI_MESSAGES[lang][key];
}
