import { type Dispatch, type SetStateAction, useEffect } from 'react';
import type { LangCode } from '../i18n/translations';
import type {
  BinAllocation,
  InteriorProp,
  ViewLayerMode,
} from '../types/warehouse';

interface UseWarehouseShortcutsParams {
  lang: LangCode;
  mapEditorOpen: boolean;
  dragMoveMode: boolean;
  dragScope: 'column' | 'whole_template';
  selectedBin: BinAllocation | null;
  selectedProp: InteriorProp | null;
  showToast: (msg: string) => void;
  toggleLanguage: () => void;
  handleWorkspaceUndo: () => void;
  handleWorkspaceRedo: () => void;
  handleAddBinAbove: (alloc: BinAllocation) => void;
  handleDeleteBin: (binId: string) => void;
  handleDeleteInteriorProp: (id: string) => void;
  handleUpdateInteriorProp: (id: string, patch: Partial<InteriorProp>) => void;
  handleMoveRackColumn: (
    oldX: number,
    oldY: number,
    newX: number,
    newY: number
  ) => void;
  handleTranslateWholeTemplate: (dx: number, dy: number) => void;
  setCameraPreset: Dispatch<SetStateAction<'iso' | 'top' | 'elevation'>>;
  setCameraResetTick: Dispatch<SetStateAction<number>>;
  setActiveLayout: Dispatch<SetStateAction<'optimized_3d' | 'baseline_2d'>>;
  setDragMoveMode: Dispatch<SetStateAction<boolean>>;
  setInteriorInitialTab: Dispatch<SetStateAction<'interior' | 'shortcuts'>>;
  setInteriorModalOpen: Dispatch<SetStateAction<boolean>>;
  setSceneBgModalOpen: Dispatch<SetStateAction<boolean>>;
  setMapEditorOpen: Dispatch<SetStateAction<boolean>>;
  setTemplateGalleryOpen: Dispatch<SetStateAction<boolean>>;
  setCadModalOpen: Dispatch<SetStateAction<boolean>>;
  setViewLayer: Dispatch<SetStateAction<ViewLayerMode>>;
  setAppView: Dispatch<SetStateAction<'workspace' | 'home'>>;
  setLevelFilter: Dispatch<SetStateAction<number | 'all'>>;
}

export function useWarehouseShortcuts({
  lang,
  mapEditorOpen,
  dragMoveMode,
  dragScope,
  selectedBin,
  selectedProp,
  showToast,
  toggleLanguage,
  handleWorkspaceUndo,
  handleWorkspaceRedo,
  handleAddBinAbove,
  handleDeleteBin,
  handleDeleteInteriorProp,
  handleUpdateInteriorProp,
  handleMoveRackColumn,
  handleTranslateWholeTemplate,
  setCameraPreset,
  setCameraResetTick,
  setActiveLayout,
  setDragMoveMode,
  setInteriorInitialTab,
  setInteriorModalOpen,
  setSceneBgModalOpen,
  setMapEditorOpen,
  setTemplateGalleryOpen,
  setCadModalOpen,
  setViewLayer,
  setAppView,
  setLevelFilter,
}: UseWarehouseShortcutsParams): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !mapEditorOpen) {
        const lower = e.key.toLowerCase();
        if (lower === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleWorkspaceUndo();
          showToast(
            lang === 'ko' ? '3D 편집 실행 취소 (Undo)' : 'Undo 3D Edit'
          );
          return;
        }
        if (lower === 'y' || (lower === 'z' && e.shiftKey)) {
          e.preventDefault();
          handleWorkspaceRedo();
          showToast(
            lang === 'ko' ? '3D 편집 다시 실행 (Redo)' : 'Redo 3D Edit'
          );
          return;
        }
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key;
      if (key === '1') {
        setCameraPreset('iso');
        showToast(
          lang === 'ko' ? '[1] 3D 입체뷰 전환' : '[1] 3D Isometric View'
        );
      } else if (key === '2') {
        setCameraPreset('top');
        showToast(
          lang === 'ko' ? '[2] 2D 평면뷰 전환' : '[2] 2D Top-Down View'
        );
      } else if (key === '3') {
        setCameraPreset('elevation');
        showToast(
          lang === 'ko' ? '[3] Z축 정면뷰 전환' : '[3] Z-Elevation View'
        );
      } else if (key === 'r' || key === 'R') {
        setCameraPreset('iso');
        setCameraResetTick((n) => n + 1);
        showToast(
          lang === 'ko' ? '[R] 3D 카메라 시점 초기화' : '[R] Reset 3D Camera'
        );
      } else if (key === ' ') {
        e.preventDefault();
        setActiveLayout((prev) => {
          const next = prev === 'optimized_3d' ? 'baseline_2d' : 'optimized_3d';
          showToast(
            next === 'optimized_3d'
              ? lang === 'ko'
                ? '[Space] 3D 최적화 배치 적용'
                : '[Space] Switched to 3D Optimized'
              : lang === 'ko'
                ? '[Space] 2D 일반 배치 비교'
                : '[Space] Switched to 2D Baseline'
          );
          return next;
        });
      } else if (key === 'm' || key === 'M') {
        setDragMoveMode((prev) => {
          const next = !prev;
          showToast(
            next
              ? lang === 'ko'
                ? '[M] 3D 마우스 드래그 이동 모드: 켜짐'
                : '[M] 3D Mouse Drag-Move: ON'
              : lang === 'ko'
                ? '[M] 3D 마우스 드래그 이동 모드: 꺼짐'
                : '[M] 3D Mouse Drag-Move: OFF'
          );
          return next;
        });
      } else if (key === 'i' || key === 'I') {
        setInteriorInitialTab('interior');
        setInteriorModalOpen((v) => !v);
      } else if (key === 'b' || key === 'B') {
        setSceneBgModalOpen((v) => !v);
      } else if (key === 'e' || key === 'E') {
        setMapEditorOpen((v) => !v);
      } else if (key === 't' || key === 'T') {
        setTemplateGalleryOpen((v) => !v);
      } else if (key === 'c' || key === 'C') {
        setCadModalOpen((v) => !v);
      } else if (key === 'g' || key === 'G') {
        setViewLayer((prev) =>
          prev === 'golden_zone' ? 'slotting' : 'golden_zone'
        );
        showToast(
          lang === 'ko'
            ? '[G] 골든존 강조 뷰 전환'
            : '[G] Toggle Golden Zone View'
        );
      } else if (key === 'h' || key === 'H') {
        setViewLayer((prev) => (prev === 'heatmap' ? 'slotting' : 'heatmap'));
        showToast(
          lang === 'ko'
            ? '[H] 피킹 빈도 히트맵 전환'
            : '[H] Toggle 3D Heatmap'
        );
      } else if (key === 'w' || key === 'W') {
        setAppView((prev) => (prev === 'home' ? 'workspace' : 'home'));
      } else if (key === 'l' || key === 'L') {
        toggleLanguage();
      } else if (key === '?' || key === '/' || key === 'k' || key === 'K') {
        setInteriorInitialTab('shortcuts');
        setInteriorModalOpen((v) => !v);
      } else if (key === '0') {
        setLevelFilter('all');
        showToast(
          lang === 'ko' ? '[0] 전체 Z층 모두 표시' : '[0] Show All Z-Levels'
        );
      } else if ((key === '+' || key === '=') && selectedBin) {
        handleAddBinAbove(selectedBin);
        showToast(
          lang === 'ko'
            ? `[+] ${selectedBin.bin.id} 위 1단 추가`
            : `[+] Added level above ${selectedBin.bin.id}`
        );
      } else if (key === 'Delete' || key === 'Backspace') {
        if (selectedProp) {
          handleDeleteInteriorProp(selectedProp.id);
          showToast(
            lang === 'ko'
              ? `[Del] 인테리어 가구 삭제됨`
              : `[Del] Deleted 3D Interior Prop`
          );
        } else if (selectedBin) {
          handleDeleteBin(selectedBin.bin.id);
          showToast(
            lang === 'ko'
              ? `[Del] ${selectedBin.bin.id} 칸 삭제됨`
              : `[Del] Deleted Bin ${selectedBin.bin.id}`
          );
        }
      } else if (key === '[' && selectedProp) {
        handleUpdateInteriorProp(selectedProp.id, {
          rotationDeg: (selectedProp.rotationDeg + 315) % 360,
        });
      } else if (key === ']' && selectedProp) {
        handleUpdateInteriorProp(selectedProp.id, {
          rotationDeg: (selectedProp.rotationDeg + 45) % 360,
        });
      } else if (
        key === 'ArrowLeft' ||
        key === 'ArrowRight' ||
        key === 'ArrowUp' ||
        key === 'ArrowDown'
      ) {
        const dx =
          key === 'ArrowLeft' ? -0.25 : key === 'ArrowRight' ? 0.25 : 0;
        const dy = key === 'ArrowUp' ? -0.25 : key === 'ArrowDown' ? 0.25 : 0;
        if (selectedProp) {
          e.preventDefault();
          handleUpdateInteriorProp(selectedProp.id, {
            xMeters: Number((selectedProp.xMeters + dx).toFixed(2)),
            yMeters: Number((selectedProp.yMeters + dy).toFixed(2)),
          });
        } else if (dragMoveMode && dragScope === 'whole_template') {
          e.preventDefault();
          handleTranslateWholeTemplate(dx * 2, dy * 2);
        } else if (selectedBin) {
          e.preventDefault();
          handleMoveRackColumn(
            selectedBin.bin.xMeters,
            selectedBin.bin.yMeters,
            Number((selectedBin.bin.xMeters + dx).toFixed(2)),
            Number((selectedBin.bin.yMeters + dy).toFixed(2))
          );
        } else {
          e.preventDefault();
          handleTranslateWholeTemplate(dx * 2, dy * 2);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    dragMoveMode,
    dragScope,
    handleAddBinAbove,
    handleDeleteBin,
    handleDeleteInteriorProp,
    handleMoveRackColumn,
    handleTranslateWholeTemplate,
    handleUpdateInteriorProp,
    handleWorkspaceRedo,
    handleWorkspaceUndo,
    lang,
    mapEditorOpen,
    selectedBin,
    selectedProp,
    setActiveLayout,
    setAppView,
    setCadModalOpen,
    setCameraPreset,
    setCameraResetTick,
    setDragMoveMode,
    setInteriorInitialTab,
    setInteriorModalOpen,
    setLevelFilter,
    setMapEditorOpen,
    setSceneBgModalOpen,
    setTemplateGalleryOpen,
    setViewLayer,
    showToast,
    toggleLanguage,
  ]);
}
