import { type Dispatch, type SetStateAction, useEffect } from 'react';
import type { LangCode } from '../i18n/translations';
import type {
  BinAllocation,
  DragScope,
  InteriorProp,
  SelectedCargoBox,
  ViewLayerMode,
  WarehouseObstacle,
} from '../types/warehouse';

interface UseWarehouseShortcutsParams {
  lang: LangCode;
  mapEditorOpen: boolean;
  anyModalOpen?: boolean;
  alwaysOptimizedLock?: boolean;
  dragMoveMode: boolean;
  dragScope: DragScope;
  selectedBin: BinAllocation | null;
  selectedProp: InteriorProp | null;
  selectedObstacle?: WarehouseObstacle | null;
  selectedDepot?: boolean;
  depotX?: number;
  depotZ?: number;
  selectedCargo: SelectedCargoBox | null;
  showToast: (msg: string) => void;
  toggleLanguage: () => void;
  handleWorkspaceUndo: () => void;
  handleWorkspaceRedo: () => void;
  handleAddBinAbove: (alloc: BinAllocation) => void;
  handleDeleteBin: (binId: string) => void;
  handleDeleteInteriorProp: (id: string) => void;
  handleUpdateInteriorProp: (id: string, patch: Partial<InteriorProp>) => void;
  handleUpdateObstacle?: (
    id: string,
    patch: Partial<WarehouseObstacle>
  ) => void;
  handleDeleteObstacle?: (id: string) => void;
  handleMoveDepot?: (newX: number, newY: number) => void;
  handleMoveSingleBin: (
    binId: string,
    newX: number,
    newY: number,
    newLevel?: number
  ) => void;
  handleMoveRackColumn: (
    oldX: number,
    oldY: number,
    newX: number,
    newY: number
  ) => void;
  handleNudgeSingleCargo: (
    fromBinId: string,
    skuId: string,
    dxSign: number,
    dySign: number
  ) => void;
  handlePinCargo: (binId: string, skuId: string, delta?: number) => void;
  handleTranslateWholeTemplate: (dx: number, dy: number) => void;
  setCameraPreset: Dispatch<
    SetStateAction<'iso' | 'top' | 'elevation' | 'closeup'>
  >;
  setCameraResetTick: Dispatch<SetStateAction<number>>;
  setCameraFocusTick?: Dispatch<SetStateAction<number>>;
  setAutoZoomEnabled?: Dispatch<SetStateAction<boolean>>;
  onClearAllSelection?: () => void;
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
  setSelectedCargo: Dispatch<SetStateAction<SelectedCargoBox | null>>;
}

export function useWarehouseShortcuts({
  lang,
  mapEditorOpen,
  anyModalOpen = false,
  alwaysOptimizedLock = false,
  dragMoveMode,
  dragScope,
  selectedBin,
  selectedProp,
  selectedObstacle = null,
  selectedDepot = false,
  depotX = 0,
  depotZ = 0,
  selectedCargo,
  showToast,
  toggleLanguage,
  handleWorkspaceUndo,
  handleWorkspaceRedo,
  handleAddBinAbove,
  handleDeleteBin,
  handleDeleteInteriorProp,
  handleUpdateInteriorProp,
  handleUpdateObstacle,
  handleDeleteObstacle,
  handleMoveDepot,
  handleMoveSingleBin,
  handleMoveRackColumn,
  handleNudgeSingleCargo,
  handlePinCargo,
  handleTranslateWholeTemplate,
  setCameraPreset,
  setCameraResetTick,
  setCameraFocusTick,
  setAutoZoomEnabled,
  onClearAllSelection,
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
  setSelectedCargo,
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

      if (mapEditorOpen || anyModalOpen) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        const lower = e.key.toLowerCase();
        if (lower === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleWorkspaceUndo();
          showToast(
            lang === 'ko' ? 'Undo 3D Edit' : 'Undo 3D Edit'
          );
          return;
        }
        if (lower === 'y' || (lower === 'z' && e.shiftKey)) {
          e.preventDefault();
          handleWorkspaceRedo();
          showToast(
            lang === 'ko' ? 'Redo 3D Edit' : 'Redo 3D Edit'
          );
          return;
        }
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key;
      if (key === '1') {
        setCameraPreset('iso');
        setCameraResetTick((n) => n + 1);
        showToast(
          lang === 'ko' ? '[1] 3D Isometric Auto-Fit' : '[1] 3D Isometric Auto-Fit'
        );
      } else if (key === '2') {
        setCameraPreset('top');
        setCameraResetTick((n) => n + 1);
        showToast(
          lang === 'ko' ? '[2] 2D Top-Down Auto-Fit' : '[2] 2D Top-Down Auto-Fit'
        );
      } else if (key === '3') {
        setCameraPreset('elevation');
        setCameraResetTick((n) => n + 1);
        showToast(
          lang === 'ko' ? '[3] Z-Elevation Auto-Fit' : '[3] Z-Elevation Auto-Fit'
        );
      } else if (key === '4') {
        setCameraPreset('closeup');
        setCameraResetTick((n) => n + 1);
        showToast(
          lang === 'ko'
            ? '[4] Eye-Level Closeup View'
            : '[4] Eye-Level Closeup View'
        );
      } else if (key === 'a' || key === 'A') {
        setAutoZoomEnabled?.((prev) => {
          const next = !prev;
          showToast(
            next
              ? lang === 'ko'
                ? '[A] ✨ Smart Camera Auto-Zoom: ON'
                : '[A] ✨ Smart Camera Auto-Zoom: ON'
              : lang === 'ko'
                ? '[A] Smart Camera Auto-Zoom: OFF'
                : '[A] Smart Camera Auto-Zoom: OFF'
          );
          return next;
        });
      } else if (key === 'Escape') {
        if (
          selectedBin ||
          selectedCargo ||
          selectedProp ||
          selectedObstacle ||
          selectedDepot
        ) {
          onClearAllSelection?.();
          showToast(
            lang === 'ko'
              ? '[Esc] Cleared selection & restored overview'
              : '[Esc] Cleared selection & restored overview'
          );
        }
      } else if (key === 'f' || key === 'F') {
        setCameraFocusTick?.((n) => n + 1);
        showToast(
          lang === 'ko'
            ? '[F] Focus & Zoom on Selected Object'
            : '[F] Focus & Zoom on Selected Object'
        );
      } else if (key === 'r' || key === 'R') {
        setCameraPreset('iso');
        setCameraResetTick((n) => n + 1);
        showToast(
          lang === 'ko' ? '[R] Reset 3D Camera' : '[R] Reset 3D Camera'
        );
      } else if (key === ' ') {
        e.preventDefault();
        if (alwaysOptimizedLock) {
          setActiveLayout('optimized_3d');
          showToast(
            lang === 'ko'
              ? '🔒 Always-Optimized Lock is active'
              : '🔒 Always-Optimized Lock is active'
          );
          return;
        }
        setActiveLayout((prev) => {
          const next = prev === 'optimized_3d' ? 'baseline_2d' : 'optimized_3d';
          showToast(
            next === 'optimized_3d'
              ? lang === 'ko'
                ? '[Space] Switched to 3D Optimized'
                : '[Space] Switched to 3D Optimized'
              : lang === 'ko'
                ? '[Space] Switched to 2D Baseline'
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
                ? '[M] 3D Mouse Drag-Move: ON'
                : '[M] 3D Mouse Drag-Move: ON'
              : lang === 'ko'
                ? '[M] 3D Mouse Drag-Move: OFF'
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
            ? '[G] Toggle Golden Zone View'
            : '[G] Toggle Golden Zone View'
        );
      } else if (key === 'h' || key === 'H') {
        setViewLayer((prev) => (prev === 'heatmap' ? 'slotting' : 'heatmap'));
        showToast(
          lang === 'ko'
            ? '[H] Toggle 3D Heatmap'
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
          lang === 'ko' ? '[0] Show All Z-Levels' : '[0] Show All Z-Levels'
        );
      } else if ((key === '+' || key === '=') && selectedBin) {
        handleAddBinAbove(selectedBin);
        showToast(
          lang === 'ko'
            ? `[+] Added level above ${selectedBin.bin.id}`
            : `[+] Added level above ${selectedBin.bin.id}`
        );
      } else if (key === 'Delete' || key === 'Backspace') {
        if (selectedCargo) {
          handlePinCargo(selectedCargo.binId, selectedCargo.skuId, -1);
          setSelectedCargo(null);
          showToast(
            lang === 'ko'
              ? `[Del] Removed 1 unit of ${selectedCargo.name}`
              : `[Del] Removed 1 unit of ${selectedCargo.name}`
          );
        } else if (selectedObstacle && handleDeleteObstacle) {
          handleDeleteObstacle(selectedObstacle.id);
        } else if (selectedProp) {
          handleDeleteInteriorProp(selectedProp.id);
          showToast(
            lang === 'ko'
              ? `[Del] Deleted 3D Interior Prop`
              : `[Del] Deleted 3D Interior Prop`
          );
        } else if (selectedBin) {
          handleDeleteBin(selectedBin.bin.id);
          showToast(
            lang === 'ko'
              ? `[Del] Deleted Bin ${selectedBin.bin.id}`
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
        const dxSign = key === 'ArrowLeft' ? -1 : key === 'ArrowRight' ? 1 : 0;
        const dySign = key === 'ArrowUp' ? -1 : key === 'ArrowDown' ? 1 : 0;

        if (selectedObstacle && handleUpdateObstacle) {
          e.preventDefault();
          handleUpdateObstacle(selectedObstacle.id, {
            xMeters: Number((selectedObstacle.xMeters + dx).toFixed(2)),
            yMeters: Number((selectedObstacle.yMeters + dy).toFixed(2)),
          });
        } else if (selectedDepot && handleMoveDepot) {
          e.preventDefault();
          handleMoveDepot(
            Number((depotX + dx).toFixed(2)),
            Number((depotZ + dy).toFixed(2))
          );
        } else if (selectedProp) {
          e.preventDefault();
          handleUpdateInteriorProp(selectedProp.id, {
            xMeters: Number((selectedProp.xMeters + dx).toFixed(2)),
            yMeters: Number((selectedProp.yMeters + dy).toFixed(2)),
          });
        } else if (
          selectedCargo &&
          (!dragMoveMode || dragScope === 'single_cargo')
        ) {
          e.preventDefault();
          handleNudgeSingleCargo(
            selectedCargo.binId,
            selectedCargo.skuId,
            dxSign,
            dySign
          );
        } else if (dragMoveMode && dragScope === 'whole_template') {
          e.preventDefault();
          handleTranslateWholeTemplate(dx * 2, dy * 2);
        } else if (selectedBin && dragScope === 'single_bin') {
          e.preventDefault();
          handleMoveSingleBin(
            selectedBin.bin.id,
            Number((selectedBin.bin.xMeters + dx).toFixed(2)),
            Number((selectedBin.bin.yMeters + dy).toFixed(2))
          );
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
    handleMoveSingleBin,
    handleNudgeSingleCargo,
    handlePinCargo,
    handleTranslateWholeTemplate,
    handleUpdateInteriorProp,
    handleUpdateObstacle,
    handleDeleteObstacle,
    handleMoveDepot,
    handleWorkspaceRedo,
    handleWorkspaceUndo,
    lang,
    mapEditorOpen,
    anyModalOpen,
    alwaysOptimizedLock,
    selectedBin,
    selectedCargo,
    selectedProp,
    selectedObstacle,
    selectedDepot,
    depotX,
    depotZ,
    setActiveLayout,
    setAppView,
    setCadModalOpen,
    setCameraPreset,
    setCameraResetTick,
    setCameraFocusTick,
    setAutoZoomEnabled,
    onClearAllSelection,
    setDragMoveMode,
    setInteriorInitialTab,
    setInteriorModalOpen,
    setLevelFilter,
    setMapEditorOpen,
    setSceneBgModalOpen,
    setSelectedCargo,
    setTemplateGalleryOpen,
    setViewLayer,
    showToast,
    toggleLanguage,
  ]);
}
