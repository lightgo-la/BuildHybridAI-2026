# CubiSlot 3D — 3D Warehouse & Living Space Slotting Digital Twin (`#BuildHybridAI 2026`)

![Built with TypeScript](https://img.shields.io/badge/Built%20with-TypeScript%205.8-3178C6?logo=typescript&logoColor=white)
![Frontend React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?logo=react&logoColor=black)
![3D Engine Three.js](https://img.shields.io/badge/3D%20Engine-Three.js%20%2F%20WebGL-000000?logo=threedotjs&logoColor=white)
![UI Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%204-06B6D4?logo=tailwindcss&logoColor=white)
![Build Vite](https://img.shields.io/badge/Bundler-Vite%206-646CFF?logo=vite&logoColor=white)
![Hybrid AI Firebase](https://img.shields.io/badge/Hybrid%20AI-Firebase%20AI%20Logic%20v12-FFCA28?logo=firebase&logoColor=black)
![On-Device AI Gemini Nano](https://img.shields.io/badge/On--Device%20AI-Chrome%20Gemini%20Nano-4285F4?logo=googlechrome&logoColor=white)
![Language English](https://img.shields.io/badge/Language-English-10B981)
![Hackathon BuildHybridAI 2026](https://img.shields.io/badge/Hackathon-%23BuildHybridAI%202026-FF6D00?logo=googledevelopers&logoColor=white)
![License Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-D22128?logo=apache&logoColor=white)
![Release v1.2.0](https://img.shields.io/badge/Release-v1.2.0-8A2BE2)



> **Google for Developers `#BuildHybridAI 2026` Challenge · Web / Chrome Track**  
> Open-Source 3D Warehouse Slotting Optimization & Everyday Home Storage Digital Twin powered by **Firebase AI Logic (`firebase/ai`)** Hybrid Inference (**On-Device Chrome Gemini Nano** + **Cloud Gemini Fallback** + **Local Deterministic Action Engine**).

<img width="2456" height="1252" alt="CubiSlot 3D" src="https://github.com/user-attachments/assets/6148c26f-b509-4622-80e3-bd35a09a99f4" />

**(https://youtu.be/VUHSq6-An3o?si=oqS1yGDDfbLso3XG)**
---

## Key Features

1. **3D Warehouse & Everyday Space Slotting Engine (`src/engine/slottingEngine.ts`)**
   - **Z-Axis Golden Zone Ergonomics (`0.80m – 1.65m`)**: Aligns high-frequency Class-A SKUs to waist-to-shoulder elevation to minimize vertical lift fatigue and cycle time.
   - **3D Bin Packing with Best-Fit 6-Axis Rotation & Multi-SKU Co-Packing**: Eliminates cubic void waste (*honeycombing*) while enforcing **70% physical bottom-support**, **fragile top-stack protection**, and **heavy-on-light crush prevention (`≤ 1.45×` weight ratio)**.
   - **NIOSH Structural & Rack Safety Guard**: Anchors heavy cargo (`> 16 kg`, or `> 10 kg` in Max-Safety mode) to lower levels (`Z1–Z2`), achieving **0 safety violations**, and reports detailed per-SKU overflow diagnostics (`unplacedItems`).
   - **3D Shelf AABB Physics Collision Solver (`resolveShelfCollisions3D`)**: Prevents vertical and horizontal shelf overlaps during custom resizing, dragging, and pillar collision checks.
   - **Exact Box Quota & Per-SKU Quantity Pinning (`buildExactBinSkuPins`)**: Directly specify total box counts or exact per-SKU box quantities per shelf bin with automatic shelf dimension expansion when needed.
   - **Orthogonal Aisle-Corridor Kinematics & Custom/TSP Pick Wave**: Models both **Reach-Truck** sequential lift/travel and **AS/RS Dual-Mast Crane Chebyshev (`max(dx/vx, dz/vz)`)** simultaneous motion with cross-aisle corridor routing and return-to-depot cycle calculation.
   - **4 One-Click 3D Optimization Presets**: `Balanced`, `Fast Pick`, `Max Density`, `Max Safety`.

2. **24 Ready-to-Use Pro & Everyday Space Templates with Bespoke 3D Previews (`src/data/warehouseTemplates.ts`, `public/templates/`)**
   - **12 Professional WMS / Logistics Templates**: Omni High-Bay, AS/RS Cube, Cold-Chain Hub, Heavy Cross-Dock, Pharma GDP Vault, Fashion Mezzanine, Auto Parts, 3PL Cross-Aisle with Pillars, Beverage Depot, ESD Clean Rack, Q-Commerce Dark Store, Goods-to-Person Shuttle.
   - **12 Everyday Home & Small-Business Templates**: Home Kitchen Pantry, Walk-In Closet, French-Door Fridge & Freezer, Garage & DIY Tool Rack, Camping Gear Closet, Studio Apartment Wall, Online Seller Packing Room, Study & Hobby Shelf, Laundry & Utility Room, Cafe Stockroom, Office Supply Archive, Moving & Self-Storage.

3. **Everyday Life Home Dashboard (`src/components/EverydayHomeView.tsx`)**
   - Dedicated approachable home mode with visual template cards, SKU content chips, plain-language KPIs, and a **10-Second Custom Room / Shelf Builder**.

4. **Interactive 3D Digital Twin Studio & Live 2D Floor Plan Split View (`src/components/Warehouse3DViewport.tsx`, `src/App.tsx`)**
   - **`THREE.InstancedMesh` Draw-Call Batching & LRU Texture Cache**: Batches rack uprights, shelf decks, Golden Zone volume bands, structural pillars, bottle crates, and pallet runners into GPU-instanced meshes with bounded LRU `CanvasTexture` disposal and `requestAnimationFrame`-throttled hover raycasting.
   - **Unobstructed Smart Camera Auto-Zoom (`computeUnobstructedFocusGoal`)**: Evaluates 8 horizontal sightline vectors to avoid neighboring rack occlusion when zooming to a selected shelf bin, cargo box, prop, obstacle, or depot.
   - **Live Main-Screen 2D Floor Plan & Pop-Out Desktop Blueprint**: View the synchronized 3D Digital Twin alongside the live 2D Floor Plan (`3D Only` / `3D + 2D Split` with 4 height presets / `2D Full`), pop out a standalone desktop window, or lock the viewport to `Always 3D Optimized`.
   - **Single-Item & Batch Cargo 3D Drag-Drop with Auto-Swap & Ghost Preview**: Click or drag individual 3D boxes (`Shift + Drag` for batch transfer) between any shelf bins with live validity ghost previews (`Green: Safe Fit`, `Amber: 1:1 Auto-Swap`, `Red: NIOSH Z3+ Heavy Warning`).
   - **Custom Box & Shelf Dimension Studio (`src/components/BinInspectorPanel.tsx`)**: Resize any shelf bin (`L × W × H cm`, single bin / entire column / all shelves) and insert custom-sized boxes or adjust exact box counts directly in the target bin.
   - **3D Space Interior & Furniture Builder (`src/components/InteriorStudioModal.tsx`)**: Place, drag, rotate, scale, and recolor 12 types of 3D furniture, appliances, doors, and windows + 4 room wall styles.
   - **3D Background & Lighting Studio (`src/components/Scene3DBackgroundModal.tsx`)**: 12 lighting/backdrop presets + custom color pickers and floor materials.

5. **2D Free-Canvas Map & Pick Route Editor, CSV Data Pipeline & 2D CAD Blueprint Exporter (`.DXF` / `.SVG` / `.CSV`)**
   - **2D Free Canvas & Pick Route Editor (`src/components/MapEditorModal.tsx`)**: Pointer-enabled drag-and-drop racks, marquee multi-select, right-click context actions, direct box placement & exact quantity input per shelf level, and an interactive **Pick Route Editor** with 4 automated route patterns (`Shortest TSP`, `S-Shape Aisle`, `Golden Zone First`, `All Occupied`) + live distance/time savings delta badge.
   - **Warehouse CSV Data Pipeline (`src/utils/csvExporter.ts`)**: Import custom SKU master tables (`.CSV` with UTF-8 BOM) and export both SKU catalogs and 3D bin-packing coordinate schedules to `.CSV`.
   - **Standard R12 ASCII `.DXF` (AutoCAD-compatible) & `.SVG` Blueprint Generator (`src/utils/cadExporter.ts`)**: 1:1 metric plan view + front Z-elevation view with orthogonal aisle pick routes.

6. **Firebase AI Logic Hybrid Co-Pilot & Action Engine (`src/services/hybridAi.ts`, `src/components/HybridAICopilotPanel.tsx`)**
   - Uses official **`firebase/ai`** SDK (`InferenceMode.PREFER_ON_DEVICE`, `ONLY_ON_DEVICE`, `PREFER_IN_CLOUD`, `ONLY_IN_CLOUD`) with Chrome built-in **Gemini Nano Prompt API** fallback, local quantitative heuristic fallback (including active custom pick route telemetry), **1-click 3D Bin Camera Focus chips**, and **1-click Executable Slotting Actions**.

---

## Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `Ctrl+Z` / `Ctrl+Y` | Undo / Redo 3D Workspace & Layout Edits |
| `1` / `2` / `3` / `4` | Switch 3D Camera (`1`: 3D Isometric, `2`: 2D Top Plan, `3`: Z-Elevation, `4`: Eye-Level Closeup) |
| `A` / `F` / `Esc` | `A`: Toggle Smart Camera Auto-Zoom · `F`: Focus Selected Object · `Esc`: Clear Selection |
| `R` | Reset 3D Camera Framing |
| `Space` | Toggle `Before: 2D Baseline` ↔ `After: 3D Optimized` |
| `M` | Toggle 3D Mouse Drag-Move Mode (Whole Template / Single Rack / Furniture) |
| `I` | Open 3D Space Interior & Furniture Studio |
| `B` | Open 3D Background & Lighting Studio |
| `E` | Open 2D Free-Canvas Map & Route Editor |
| `T` | Open 24-Template Gallery |
| `C` | Open 2D CAD (`.DXF` / `.SVG`) Blueprint Exporter |
| `G` / `H` / `0` | `G`: Golden Zone View · `H`: 3D Pick Frequency Heatmap · `0`: Show All Z-Levels |
| `W` | Toggle Everyday Home ↔ 3D Studio |
| `←` `↑` `↓` `→` | Move Selected 3D Furniture Prop, Rack Column, Obstacle, Depot, or Whole Template |
| `[` / `]` | Rotate Selected 3D Interior Furniture Prop by 45° |
| `+` / `Delete` | `+`: Add +1 Z-Level Above Bin · `Delete`: Remove Selected Bin, Cargo, Obstacle, or Prop |
| `?` / `K` | Open Keyboard Shortcuts Guide |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Configure Firebase AI Logic & App Check
cp .env.example .env

# 3. Start development server
npm run dev

# 4. Run type-check, unit + QC/QA test suite, and production build
npm run typecheck
npm test
npm run build
```

---

## Open-Source License

Licensed under the **Apache License, Version 2.0** — see [LICENSE](LICENSE).
