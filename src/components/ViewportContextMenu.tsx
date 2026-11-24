import React, { useEffect, useRef } from 'react';
import {
  Bot,
  Compass,
  Eraser,
  Eye,
  Flame,
  Layers,
  PackagePlus,
  PlusSquare,
  Ruler,
  Sliders,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { LangCode } from '../i18n/translations';
import type { BinAllocation, SKUItem, ViewLayerMode } from '../types/warehouse';

export interface ViewportContextState {
  clientX: number;
  clientY: number;
  binAlloc: BinAllocation | null;
  floorPoint: { x: number; z: number } | null;
}

interface ViewportContextMenuProps {
  menu: ViewportContextState | null;
  skus: SKUItem[];
  levelFilter: number | 'all';
  activeLayout: 'baseline_2d' | 'optimized_3d';
  onClose: () => void;
  onInspectBin: (alloc: BinAllocation) => void;
  onPinSkuToBin: (binId: string, skuId: string) => void;
  onClearBinPins: (binId: string) => void;
  onAddBinAbove: (alloc: BinAllocation) => void;
  onAddBinAtFloor: (x: number, z: number) => void;
  onDeleteBin: (binId: string) => void;
  onToggleLevelSlice: (level: number | 'all') => void;
  onAuditBinWithAi: (alloc: BinAllocation) => void;
  onOpenCadExport: () => void;
  onOpenMapEditor: () => void;
  onOpenEditor: () => void;
  onChangeViewLayer: (layer: ViewLayerMode) => void;
  onToggleLayout: () => void;
  onResetCamera: () => void;
  lang?: LangCode;
}

export const ViewportContextMenu: React.FC<ViewportContextMenuProps> = ({
  menu,
  skus,
  levelFilter,
  activeLayout,
  onClose,
  onInspectBin,
  onPinSkuToBin,
  onClearBinPins,
  onAddBinAbove,
  onAddBinAtFloor,
  onDeleteBin,
  onToggleLevelSlice,
  onAuditBinWithAi,
  onOpenCadExport,
  onOpenMapEditor,
  onOpenEditor,
  onChangeViewLayer,
  onToggleLayout,
  onResetCamera,
  lang = 'ko',
}) => {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menu) return;
    const handleDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('mousedown', handleDown);
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('mousedown', handleDown);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [menu, onClose]);

  if (!menu) return null;

  const left = Math.min(menu.clientX, window.innerWidth - 255);
  const top = Math.min(menu.clientY, window.innerHeight - 380);
  const alloc = menu.binAlloc;

  return (
    <div
      ref={menuRef}
      style={{ left: `${Math.max(8, left)}px`, top: `${Math.max(8, top)}px` }}
      className="fixed z-50 w-60 rounded-xl border border-[var(--t-border)] bg-[var(--t-surface)] p-1.5 text-xs text-[var(--t-text)] shadow-2xl"
    >
      {alloc ? (
        <>
          <div className="border-b border-[var(--t-border)] px-2.5 py-1.5">
            <div className="font-bold">Bin {alloc.bin.id}</div>
            <div className="text-[10px] text-[var(--t-muted)]">
              {alloc.cubicUtilizationPct.toFixed(0)}% fill ·{' '}
              {alloc.currentWeightKg.toFixed(1)}/{alloc.bin.maxWeightKg}kg · Z
              {alloc.bin.level}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onInspectBin(alloc);
              onClose();
            }}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-[var(--t-surface-alt)]"
          >
            <Eye className="h-3.5 w-3.5 text-[var(--t-accent)]" />
            {lang === 'ko' ? '3D 적재 상세 보기' : 'Inspect 3D Packing Details'}
          </button>

          {/* Quick Add Cargo Box to This Bin */}
          <div className="my-1 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] p-1.5">
            <div className="mb-1 flex items-center gap-1.5 px-1 text-[10px] font-semibold text-[var(--t-muted)]">
              <PackagePlus className="h-3 w-3 text-emerald-400" />
              {lang === 'ko' ? '이 칸에 물품 고정 (+1 Pin)' : 'Add Cargo Here (+1 Pin)'}
            </div>
            <div className="grid grid-cols-2 gap-1">
              {skus.slice(0, 4).map((sku) => (
                <button
                  key={sku.id}
                  type="button"
                  onClick={() => {
                    onPinSkuToBin(alloc.bin.id, sku.id);
                    onClose();
                  }}
                  className="truncate rounded border border-[var(--t-border)] bg-[var(--t-surface)] px-1.5 py-1 text-left text-[10px] hover:border-[var(--t-accent)]"
                  title={`${sku.skuCode} (${sku.name})`}
                >
                  + {sku.skuCode}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onClearBinPins(alloc.bin.id);
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-[var(--t-surface-alt)]"
          >
            <Eraser className="h-3.5 w-3.5 text-amber-400" />
            {lang === 'ko' ? '이 칸의 고정 물품 해제' : 'Unpin Custom Cargo in Bin'}
          </button>

          <button
            type="button"
            onClick={() => {
              onAddBinAbove(alloc);
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-[var(--t-surface-alt)]"
          >
            <PlusSquare className="h-3.5 w-3.5 text-emerald-400" />
            {lang === 'ko'
              ? `위에 선반 1단 추가 (+Z${alloc.bin.level + 1})`
              : `Add Rack Bin Above (+Z${alloc.bin.level + 1})`}
          </button>

          <button
            type="button"
            onClick={() => {
              onToggleLevelSlice(
                levelFilter === alloc.bin.level ? 'all' : alloc.bin.level
              );
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-[var(--t-surface-alt)]"
          >
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            {levelFilter === alloc.bin.level
              ? lang === 'ko'
                ? '전체 층(Z) 모두 보기'
                : 'Show All Z-Levels'
              : lang === 'ko'
                ? `Z${alloc.bin.level}층만 단면 보기`
                : `Slice Level Z${alloc.bin.level} Only`}
          </button>

          <button
            type="button"
            onClick={() => {
              onAuditBinWithAi(alloc);
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-[var(--t-surface-alt)]"
          >
            <Bot className="h-3.5 w-3.5 text-cyan-400" />
            {lang === 'ko' ? 'AI로 이 칸 정밀 진단' : 'Audit Bin with Hybrid AI'}
          </button>

          <div className="my-1 border-t border-[var(--t-border)]" />

          <button
            type="button"
            onClick={() => {
              onDeleteBin(alloc.bin.id);
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-rose-400 hover:bg-rose-950/40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {lang === 'ko' ? '이 선반 칸 삭제' : 'Delete This Storage Bin'}
          </button>
        </>
      ) : (
        <>
          <div className="border-b border-[var(--t-border)] px-2.5 py-1.5">
            <div className="font-bold">
              {lang === 'ko' ? '3D 공간 빠른 편집' : '3D Warehouse Space'}
            </div>
            <div className="text-[10px] text-[var(--t-muted)]">
              {menu.floorPoint
                ? `${lang === 'ko' ? '바닥 좌표' : 'Floor'} @ (${menu.floorPoint.x.toFixed(1)}m, ${menu.floorPoint.z.toFixed(1)}m)`
                : lang === 'ko'
                  ? '시뮬레이션 빠른 작업'
                  : 'Quick Simulation Actions'}
            </div>
          </div>

          {menu.floorPoint && (
            <button
              type="button"
              onClick={() => {
                onAddBinAtFloor(menu.floorPoint!.x, menu.floorPoint!.z);
                onClose();
              }}
              className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-[var(--t-surface-alt)]"
            >
              <PlusSquare className="h-3.5 w-3.5 text-emerald-400" />
              {lang === 'ko' ? '커서 위치에 선반 칸 추가' : 'Add Storage Bin at Cursor'}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onOpenMapEditor();
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-[var(--t-surface-alt)]"
          >
            <Sliders className="h-3.5 w-3.5 text-emerald-400" />
            {lang === 'ko' ? '2D 자유 맵 에디터 열기' : 'Open 2D Map Editor'}
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenEditor();
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-[var(--t-surface-alt)]"
          >
            <Sliders className="h-3.5 w-3.5 text-cyan-400" />
            {lang === 'ko' ? '공간·물품 설계 탭 열기' : 'Open Space & Cargo Editor'}
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenCadExport();
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-[var(--t-surface-alt)]"
          >
            <Ruler className="h-3.5 w-3.5 text-[var(--t-accent)]" />
            {lang === 'ko' ? '2D CAD 도면 내보내기 (.DXF/.SVG)' : 'Export 2D CAD (.DXF / .SVG)'}
          </button>

          <button
            type="button"
            onClick={() => {
              onToggleLayout();
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-[var(--t-surface-alt)]"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            {lang === 'ko'
              ? `${activeLayout === 'optimized_3d' ? '2D 일반 배치' : '3D 최적화'}로 전환`
              : `Switch to ${activeLayout === 'optimized_3d' ? '2D Baseline' : '3D Optimized'}`}
          </button>

          <div className="my-1 border-t border-[var(--t-border)]" />

          <div className="grid grid-cols-3 gap-1 px-1 py-1 text-[10px]">
            <button
              type="button"
              onClick={() => {
                onChangeViewLayer('slotting');
                onClose();
              }}
              className="flex flex-col items-center gap-0.5 rounded bg-[var(--t-surface-alt)] py-1 hover:text-[var(--t-accent)]"
            >
              <Layers className="h-3 w-3" />
              3D Pack
            </button>
            <button
              type="button"
              onClick={() => {
                onChangeViewLayer('heatmap');
                onClose();
              }}
              className="flex flex-col items-center gap-0.5 rounded bg-[var(--t-surface-alt)] py-1 hover:text-amber-300"
            >
              <Flame className="h-3 w-3" />
              Heatmap
            </button>
            <button
              type="button"
              onClick={() => {
                onResetCamera();
                onClose();
              }}
              className="flex flex-col items-center gap-0.5 rounded bg-[var(--t-surface-alt)] py-1 hover:text-emerald-300"
            >
              <Compass className="h-3 w-3" />
              Reset Cam
            </button>
          </div>
        </>
      )}
    </div>
  );
};
