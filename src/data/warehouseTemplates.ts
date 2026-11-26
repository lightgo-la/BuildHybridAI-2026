import type {
  ABCClass,
  SKUItem,
  TemplateCategory,
  WarehouseConfig,
  WarehouseTemplate,
} from '../types/warehouse';

type CompactSkuTuple = [
  code: string,
  name: string,
  abc: ABCClass,
  picks: number,
  l: number,
  w: number,
  h: number,
  kg: number,
  qty: number,
  fragile: boolean,
  color: string,
];

function makeSkus(prefix: string, items: CompactSkuTuple[]): SKUItem[] {
  return items.map(
    ([code, name, abc, picks, l, w, h, kg, qty, fragile, color], idx) => ({
      id: `${prefix}-s${idx + 1}`,
      skuCode: code,
      name,
      category: prefix,
      abcClass: abc,
      dailyPicks: picks,
      lengthCm: l,
      widthCm: w,
      heightCm: h,
      weightKg: kg,
      quantity: qty,
      fragile,
      color,
    })
  );
}

function makeProConfig(
  aisles: number,
  bays: number,
  levels: number,
  opts: Partial<WarehouseConfig> = {}
): WarehouseConfig {
  return {
    aisles,
    baysPerAisle: bays,
    levels,
    aisleSpacingM: opts.aisleSpacingM ?? 3.4,
    baySpacingM: opts.baySpacingM ?? 1.45,
    binLengthCm: opts.binLengthCm ?? 120,
    binWidthCm: opts.binWidthCm ?? 90,
    binHeightCm: opts.binHeightCm ?? 70,
    equipmentMode: opts.equipmentMode ?? 'reach_truck',
    goldenZoneMinM: 0.8,
    goldenZoneMaxM: 1.65,
    allowRotationAndCoPack: true,
    mapTag: opts.mapTag ?? `${aisles}×${bays}×${levels} · Pro`,
    ...opts,
  };
}

function makeLifeConfig(
  aisles: number,
  bays: number,
  levels: number,
  opts: Partial<WarehouseConfig> = {}
): WarehouseConfig {
  return {
    aisles,
    baysPerAisle: bays,
    levels,
    aisleSpacingM: opts.aisleSpacingM ?? 2.3,
    baySpacingM: opts.baySpacingM ?? 1.1,
    binLengthCm: opts.binLengthCm ?? 85,
    binWidthCm: opts.binWidthCm ?? 55,
    binHeightCm: opts.binHeightCm ?? 48,
    equipmentMode: 'reach_truck',
    goldenZoneMinM: 0.8,
    goldenZoneMaxM: 1.65,
    allowRotationAndCoPack: true,
    mapTag: opts.mapTag ?? `${aisles}×${bays}×${levels} · Everyday`,
    ...opts,
  };
}

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  logistics: 'Logistics & WMS',
  retail_cold: 'Cold-Chain & Retail',
  home_living: 'Home & Living',
  garage_hobby: 'Garage & Hobby',
  shop_office: 'Shop & Office',
};

export const RAW_WAREHOUSE_TEMPLATES: WarehouseTemplate[] = [
  {
    id: 'tpl-pro-01-highbay',
    persona: 'professional',
    category: 'logistics',
    name: '01 · Omni High-Bay Fulfillment Center',
    description:
      'Standard 3-aisle, 5-level e-commerce fulfillment center balancing A/B/C pick velocity with heavy beverage pallets.',
    highlights: 'Z2–Z3 Golden Zone picking · Z1 heavy cargo anchoring',
    config: makeProConfig(3, 6, 5, { mapTag: '3×6×5 · 90 Bins' }),
    skus: makeSkus('omni', [
      ['ELC-101', 'Wireless Barcode Scanner', 'A', 145, 34, 24, 22, 3.2, 12, true, '#22d3ee'],
      ['CON-204', 'Thermal Shipping Labels Carton', 'A', 132, 40, 30, 28, 8.5, 10, false, '#38bdf8'],
      ['BEV-309', 'Electrolyte Hydration 24-Pack', 'A', 118, 48, 38, 32, 19.4, 8, false, '#f59e0b'],
      ['PHM-112', 'Emergency First-Aid Kit', 'A', 96, 32, 26, 20, 4.1, 12, true, '#34d399'],
      ['HDW-410', 'Brushless Impact Driver Kit', 'B', 64, 44, 34, 26, 9.8, 8, false, '#818cf8'],
      ['AUT-502', 'Synthetic Motor Oil 4L Case', 'B', 52, 52, 40, 36, 24.5, 6, false, '#fb7185'],
      ['IND-701', 'Heavy-Duty Steel Caster Set', 'C', 14, 56, 44, 38, 34.0, 4, false, '#f43f5e'],
      ['SEA-880', 'Insulated Thermal Work Gloves', 'C', 9, 38, 28, 24, 3.6, 10, false, '#94a3b8'],
    ]),
  },
  {
    id: 'tpl-pro-02-asrs',
    persona: 'professional',
    category: 'logistics',
    name: '02 · AS/RS Automated High-Density Cube',
    description:
      '4-aisle, 6-level narrow-aisle automated storage & retrieval cube operated by simultaneous X-Z Chebyshev stacker cranes.',
    highlights: 'Simultaneous X-Z crane travel optimization',
    config: makeProConfig(4, 7, 6, {
      aisleSpacingM: 2.55,
      baySpacingM: 1.38,
      equipmentMode: 'asrs_crane',
      mapTag: '4×7×6 · AS/RS',
    }),
    skus: makeSkus('asrs', [
      ['PRO-010', 'Smart Hub Controller', 'A', 220, 30, 22, 18, 2.5, 18, true, '#22d3ee'],
      ['PRO-022', 'Fast-Charge Power Cell Module', 'A', 195, 28, 24, 20, 5.4, 16, false, '#38bdf8'],
      ['BEV-402', 'Cold Brew Concentrate Crate', 'A', 168, 50, 40, 34, 22.0, 10, false, '#f59e0b'],
      ['MED-108', 'Sterile Diagnostic Cartridge Kit', 'A', 152, 24, 20, 18, 1.8, 20, true, '#34d399'],
      ['BAT-550', 'LiFePO4 Backup Battery Module', 'B', 74, 54, 42, 36, 28.5, 8, false, '#f43f5e'],
      ['ACC-331', 'USB-C Cable Bulk Carton', 'B', 62, 36, 28, 24, 4.8, 14, false, '#818cf8'],
      ['RSV-910', 'Retail Promotional Display Stand', 'C', 11, 58, 42, 30, 6.4, 10, false, '#94a3b8'],
    ]),
  },
  {
    id: 'tpl-pro-03-cold',
    persona: 'professional',
    category: 'retail_cold',
    name: '03 · Cold-Chain Chilled & Frozen Micro Hub',
    description:
      'Urban temperature-controlled distribution hub maximizing 3D cubic density across compact 100×80×60cm insulated bins.',
    highlights: 'High-density cold-chain 3D bin packing',
    config: makeProConfig(2, 5, 4, {
      aisleSpacingM: 3.1,
      baySpacingM: 1.35,
      binLengthCm: 100,
      binWidthCm: 80,
      binHeightCm: 60,
      mapTag: '2×5×4 · Cold Storage',
    }),
    skus: makeSkus('cold', [
      ['CLD-101', 'Bio Thermal Cold Pack Tote', 'A', 165, 38, 26, 24, 4.6, 10, true, '#22d3ee'],
      ['FRZ-205', 'Artisan Gelato 12-Tub Case', 'A', 140, 44, 34, 26, 11.2, 8, false, '#38bdf8'],
      ['DAI-310', 'Organic Dairy Milk Crate 18L', 'A', 128, 46, 36, 30, 18.8, 6, false, '#f59e0b'],
      ['PRO-412', 'Organic Fresh Salad Greens Tray', 'B', 72, 34, 24, 20, 2.1, 12, true, '#34d399'],
      ['SEA-509', 'Flash-Frozen Salmon Fillet Box', 'B', 56, 48, 32, 22, 14.0, 6, false, '#fb7185'],
      ['DRY-770', 'Insulated Thermal Liner Roll', 'C', 18, 42, 30, 24, 3.4, 8, false, '#94a3b8'],
    ]),
  },
  {
    id: 'tpl-pro-04-heavy',
    persona: 'professional',
    category: 'logistics',
    name: '04 · Heavy Bulk Cross-Docking Center',
    description:
      'Wide-aisle 5-row industrial cross-docking hub preventing heavy machinery parts (>16 kg) from being placed on upper levels.',
    highlights: 'Guaranteed 0 NIOSH heavy-cargo safety violations',
    config: makeProConfig(5, 4, 4, {
      aisleSpacingM: 3.6,
      baySpacingM: 1.5,
      mapTag: '5×4×4 · Heavy Bulk',
    }),
    skus: makeSkus('heavy', [
      ['MTR-100', 'Industrial Servo Actuator', 'A', 130, 44, 34, 28, 21.5, 10, false, '#f59e0b'],
      ['VAL-205', 'Hydraulic Manifold Block', 'A', 115, 38, 28, 24, 17.8, 10, false, '#fb7185'],
      ['PLC-114', 'Safety PLC Control Module', 'A', 155, 30, 24, 18, 2.9, 16, true, '#22d3ee'],
      ['CBL-312', 'Servo Harness Cable Reel', 'B', 68, 46, 36, 26, 12.4, 10, false, '#818cf8'],
      ['PNU-420', 'Pneumatic Cylinder Assembly', 'B', 54, 50, 32, 22, 19.2, 6, false, '#f43f5e'],
      ['GSK-890', 'PTFE Flange Gasket Kit', 'C', 14, 36, 28, 20, 3.1, 14, false, '#94a3b8'],
    ]),
  },
  {
    id: 'tpl-pro-05-pharma',
    persona: 'professional',
    category: 'retail_cold',
    name: '05 · Pharma GDP Clean Storage Vault',
    description:
      'Pharmaceutical clean vault protecting fragile vaccine vials and diagnostic reagents upright while maximizing Golden Zone picking.',
    highlights: 'Upright fragile protection · Safe ergonomic picking',
    config: makeProConfig(3, 5, 5, {
      binLengthCm: 100,
      binWidthCm: 80,
      binHeightCm: 60,
      mapTag: '3×5×5 · Pharma GDP',
    }),
    skus: makeSkus('pharma', [
      ['VAC-101', 'Insulated Vaccine Vial Carrier', 'A', 180, 28, 22, 20, 2.2, 14, true, '#34d399'],
      ['IVD-202', 'In-Vitro Diagnostic Reagent Box', 'A', 150, 34, 26, 22, 3.8, 12, true, '#22d3ee'],
      ['SYR-305', 'Sterile Syringe Case', 'A', 130, 40, 30, 26, 4.9, 10, false, '#38bdf8'],
      ['SOL-410', 'Saline IV Solution 1L×12 Pack', 'B', 65, 44, 32, 28, 18.2, 6, false, '#f59e0b'],
      ['PPE-901', 'Nitrile Exam Gloves Carton', 'C', 18, 42, 30, 24, 5.4, 10, false, '#94a3b8'],
    ]),
  },
  {
    id: 'tpl-pro-06-apparel',
    persona: 'professional',
    category: 'retail_cold',
    name: '06 · Fashion & Apparel Mezzanine Hub',
    description:
      'High-SKU fashion mezzanine compressing apparel totes and footwear boxes via 3D divider co-packing.',
    highlights: 'Multi-SKU apparel & footwear divider co-packing',
    config: makeProConfig(4, 6, 4, {
      aisleSpacingM: 2.9,
      baySpacingM: 1.35,
      binLengthCm: 110,
      binWidthCm: 80,
      binHeightCm: 60,
      mapTag: '4×6×4 · Apparel',
    }),
    skus: makeSkus('apparel', [
      ['TEE-101', 'Cotton Crewneck Tee Tote', 'A', 175, 36, 28, 20, 4.0, 14, false, '#22d3ee'],
      ['JNS-204', 'Slim-Fit Denim Jeans Carton', 'A', 142, 42, 32, 24, 9.5, 10, false, '#38bdf8'],
      ['SNK-311', 'Running Shoe Box', 'A', 158, 34, 24, 16, 1.6, 16, true, '#34d399'],
      ['BAG-420', 'Canvas Tote Bag Bundle', 'B', 58, 40, 30, 22, 5.2, 10, false, '#a78bfa'],
      ['PRK-880', 'Winter Down Parka Pack', 'C', 12, 52, 40, 30, 6.8, 8, false, '#94a3b8'],
    ]),
  },
  {
    id: 'tpl-pro-07-auto',
    persona: 'professional',
    category: 'logistics',
    name: '07 · Automotive Parts Distribution Depot',
    description:
      'Separates heavy brake rotors & AGM batteries (anchored to Z1) from high-velocity cabin filters & spark plugs (Golden Zone).',
    highlights: 'Heavy drivetrain parts vs fast consumables separation',
    config: makeProConfig(4, 5, 5, { mapTag: '4×5×5 · Auto Parts' }),
    skus: makeSkus('auto', [
      ['FLT-101', 'Cabin & Oil Filter Kit', 'A', 160, 32, 24, 20, 2.8, 16, false, '#22d3ee'],
      ['BRK-209', 'Ventilated Brake Rotor Pair', 'A', 112, 38, 36, 18, 22.8, 8, false, '#f59e0b'],
      ['SPK-118', 'Iridium Spark Plug Set', 'A', 145, 24, 18, 14, 1.4, 18, true, '#34d399'],
      ['AGM-500', '12V AGM Automotive Battery', 'B', 48, 36, 26, 24, 21.0, 6, false, '#f43f5e'],
      ['WPR-604', 'Silicone Wiper Blade Carton', 'C', 15, 64, 22, 18, 4.2, 10, false, '#818cf8'],
    ]),
  },
  {
    id: 'tpl-pro-08-crossaisle',
    persona: 'professional',
    category: 'logistics',
    name: '08 · 3PL Cross-Aisle & Structural Pillar Hub',
    description:
      'Production-grade 3PL warehouse featuring a central cross-aisle (Bay 3) and structural building pillars.',
    highlights: 'Central cross-aisle & structural pillar detour routing',
    config: makeProConfig(4, 6, 5, {
      mapTag: '4×6×5 · Cross-Aisle',
      disabledBinIds: [
        'A1-B3-Z1', 'A1-B3-Z2', 'A1-B3-Z3', 'A1-B3-Z4', 'A1-B3-Z5',
        'A2-B3-Z1', 'A2-B3-Z2', 'A2-B3-Z3', 'A2-B3-Z4', 'A2-B3-Z5',
        'A3-B3-Z1', 'A3-B3-Z2', 'A3-B3-Z3', 'A3-B3-Z4', 'A3-B3-Z5',
        'A4-B3-Z1', 'A4-B3-Z2', 'A4-B3-Z3', 'A4-B3-Z4', 'A4-B3-Z5',
      ],
      obstacles: [
        { id: 'OBS-A2-B3', aisle: 2, bay: 3, xMeters: 3.4, yMeters: 4.7, label: 'PILLAR' },
        { id: 'OBS-A3-B3', aisle: 3, bay: 3, xMeters: 6.8, yMeters: 4.7, label: 'PILLAR' },
      ],
    }),
    skus: makeSkus('3pl', [
      ['3PL-A1', 'Parcel Polybag Mailer Carton', 'A', 170, 36, 28, 22, 4.2, 14, false, '#22d3ee'],
      ['3PL-A2', 'Smart Home AI Speaker', 'A', 135, 32, 26, 24, 3.5, 12, true, '#34d399'],
      ['3PL-B1', 'Premium Pet Food 15kg Sack', 'B', 62, 54, 38, 26, 17.5, 8, false, '#f59e0b'],
      ['3PL-C1', 'Seasonal Promo Banner Case', 'C', 10, 58, 30, 24, 4.0, 10, false, '#94a3b8'],
    ]),
  },
  {
    id: 'tpl-pro-09-beverage',
    persona: 'professional',
    category: 'retail_cold',
    name: '09 · Beverage & FMCG Distribution Center',
    description:
      'Anchors 20L beverage kegs and water multipacks on Z1 floor pallets while keeping single-case drinks in the waist-level Golden Zone.',
    highlights: 'Z1 heavy beverage keg anchoring',
    config: makeProConfig(3, 5, 4, { mapTag: '3×5×4 · Beverage' }),
    skus: makeSkus('bev', [
      ['MIN-24', 'Mineral Water 500mL×24 Pack', 'A', 190, 44, 30, 24, 13.0, 12, false, '#38bdf8'],
      ['COL-12', 'Craft Cola 12-Bottle Case', 'A', 155, 40, 28, 22, 10.5, 12, false, '#22d3ee'],
      ['KEG-20', 'Draft Beverage Keg 20L', 'A', 110, 42, 42, 48, 24.0, 6, false, '#f59e0b'],
      ['TEA-06', 'Organic Green Tea Case', 'B', 70, 36, 28, 24, 9.2, 10, false, '#34d399'],
      ['CUP-50', 'Takeout Paper Cup Carton', 'C', 16, 52, 40, 34, 4.1, 8, false, '#94a3b8'],
    ]),
  },
  {
    id: 'tpl-pro-10-esd',
    persona: 'professional',
    category: 'logistics',
    name: '10 · Semiconductor & Electronics ESD Clean Rack',
    description:
      'ESD-safe clean rack protecting shock-sensitive PCB trays and enterprise NVMe SSD packs without top-stacking pressure.',
    highlights: '100% upright protection for fragile PCBs & SSDs',
    config: makeProConfig(3, 6, 5, {
      binLengthCm: 100,
      binWidthCm: 80,
      binHeightCm: 60,
      mapTag: '3×6×5 · ESD Clean',
    }),
    skus: makeSkus('esd', [
      ['PCB-10', 'Control PCB Board Tray', 'A', 165, 34, 26, 14, 1.8, 14, true, '#22d3ee'],
      ['SSD-20', 'Enterprise NVMe SSD Pack', 'A', 148, 26, 20, 14, 1.2, 16, true, '#34d399'],
      ['PSU-40', 'Server Power Supply Unit', 'B', 64, 42, 24, 18, 6.4, 10, false, '#818cf8'],
      ['UPS-80', 'Rackmount UPS Battery Chassis', 'B', 32, 54, 44, 24, 22.0, 4, false, '#f43f5e'],
      ['CAB-90', 'Fiber Optic Patch Cord Bin', 'C', 14, 36, 28, 20, 2.5, 12, false, '#94a3b8'],
    ]),
  },
  {
    id: 'tpl-pro-11-qcommerce',
    persona: 'professional',
    category: 'retail_cold',
    name: '11 · Q-Commerce 15-Min Delivery Dark Store',
    description:
      'Places ultra-fast fresh groceries and meal kits closest to the I/O depot to keep average pick cycle times under 10 seconds.',
    highlights: 'Depot-adjacent ultra-fast pick routing',
    config: makeProConfig(3, 4, 4, {
      aisleSpacingM: 2.6,
      baySpacingM: 1.25,
      binLengthCm: 90,
      binWidthCm: 65,
      binHeightCm: 55,
      mapTag: '3×4×4 · Dark Store',
    }),
    skus: makeSkus('qc', [
      ['GRO-01', 'Fresh Daily Bakery Box', 'A', 210, 32, 24, 18, 1.5, 10, true, '#f59e0b'],
      ['GRO-02', 'Fresh Meal Kit Tote', 'A', 195, 34, 26, 18, 2.8, 12, true, '#34d399'],
      ['GRO-03', 'Sparkling Water 6-Bottle Pack', 'A', 165, 30, 22, 24, 9.2, 8, false, '#38bdf8'],
      ['HSH-04', 'Jumbo Kitchen Paper Bundle', 'B', 55, 44, 32, 28, 2.4, 6, false, '#a78bfa'],
      ['PET-05', 'Clumping Cat Litter 10kg Pack', 'C', 22, 42, 30, 20, 17.2, 4, false, '#fb7185'],
    ]),
  },
  {
    id: 'tpl-pro-12-shuttle',
    persona: 'professional',
    category: 'logistics',
    name: '12 · Goods-to-Person Robotic Shuttle Bay',
    description:
      '5-aisle, 6-level (180-bin) Goods-to-Person (GTP) robotic shuttle bay delivering high-velocity totes directly to pick stations.',
    highlights: '180-bin high density · High-speed shuttle throughput',
    config: makeProConfig(5, 6, 6, {
      aisleSpacingM: 2.5,
      baySpacingM: 1.35,
      equipmentMode: 'asrs_crane',
      mapTag: '5×6×6 · GTP Shuttle',
    }),
    skus: makeSkus('shut', [
      ['G2P-01', 'Cosmetic Ampoule Serum Carton', 'A', 240, 28, 20, 16, 1.9, 24, true, '#22d3ee'],
      ['G2P-02', 'Wireless Earbuds Case Box', 'A', 210, 26, 20, 18, 2.1, 22, true, '#34d399'],
      ['G2P-03', 'Multivitamin Bottle Pack', 'A', 180, 32, 24, 20, 4.5, 18, false, '#38bdf8'],
      ['G2P-04', 'Ceramic Mug Gift Set', 'B', 75, 36, 28, 22, 6.2, 12, true, '#f59e0b'],
      ['G2P-05', 'Heavy Cast Dumbbell 20kg Pair', 'B', 38, 40, 28, 20, 20.0, 6, false, '#f43f5e'],
      ['G2P-06', 'Seasonal Gift Wrap Roll', 'C', 9, 54, 30, 20, 3.0, 14, false, '#94a3b8'],
    ]),
  },
  {
    id: 'tpl-life-13-pantry',
    persona: 'everyday',
    category: 'home_living',
    name: '13 · Home Kitchen Pantry',
    description:
      'Anchors heavy water packs and rice containers on the Z1 bottom shelf while organizing daily snacks and coffee at waist level.',
    highlights: 'Bottom-shelf heavy water · Easy waist-level access',
    config: makeLifeConfig(2, 3, 4, {
      binLengthCm: 80,
      binWidthCm: 50,
      binHeightCm: 45,
      mapTag: '2×3×4 · Pantry',
    }),
    skus: makeSkus('pantry', [
      ['WTR-2L', 'Bottled Water 2L×12 Pack', 'A', 95, 36, 24, 32, 24.5, 4, false, '#38bdf8'],
      ['SNK-10', 'Daily Snacks & Cereal Tote', 'A', 120, 34, 22, 20, 2.4, 8, true, '#22d3ee'],
      ['COF-04', 'Coffee Beans & Tea Set', 'A', 105, 30, 22, 18, 3.1, 6, true, '#34d399'],
      ['RCE-20', 'Grain & Rice 10kg Dispenser', 'B', 48, 38, 26, 28, 17.0, 3, false, '#f59e0b'],
      ['OIL-08', 'Cooking Oil & Sauce Caddy', 'B', 62, 32, 22, 26, 7.5, 4, true, '#fb7185'],
      ['SEA-99', 'Holiday Hotpot & Cookware Set', 'C', 6, 44, 32, 22, 4.2, 4, false, '#94a3b8'],
    ]),
  },
  {
    id: 'tpl-life-14-closet',
    persona: 'everyday',
    category: 'home_living',
    name: '14 · Walk-In Closet & Wardrobe',
    description:
      'Keeps daily shirts and handbags in the ergonomic Golden Zone while storing off-season winter duvets and luggage on upper/lower shelves.',
    highlights: 'Daily wardrobe vs seasonal bedding separation',
    config: makeLifeConfig(2, 4, 4, {
      binLengthCm: 85,
      binWidthCm: 55,
      binHeightCm: 45,
      mapTag: '2×4×4 · Closet',
    }),
    skus: makeSkus('closet', [
      ['SHRT-A', 'Daily Shirts & Knitwear Box', 'A', 135, 36, 26, 18, 2.2, 8, false, '#22d3ee'],
      ['BAG-A1', 'Handbag & Cap Organizer Tote', 'A', 98, 34, 26, 22, 1.5, 6, true, '#34d399'],
      ['SHO-B1', 'Clear Sneaker Display Case', 'B', 68, 34, 24, 16, 1.4, 10, true, '#38bdf8'],
      ['LUG-C1', 'Carry-On Travel Suitcase', 'C', 8, 54, 36, 24, 4.2, 3, false, '#818cf8'],
      ['BLK-C2', 'Winter Microfiber Duvet Pack', 'C', 5, 48, 36, 20, 3.5, 6, false, '#94a3b8'],
    ]),
  },
  {
    id: 'tpl-life-15-fridge',
    persona: 'everyday',
    category: 'home_living',
    name: '15 · French-Door Fridge & Freezer',
    description:
      'Neatly organizes milk & juice cartons, glass meal-prep containers, fresh produce trays, and frozen dumplings without wasted space.',
    highlights: 'Glass container protection · Compact cold storage',
    config: makeLifeConfig(2, 3, 4, {
      aisleSpacingM: 2.0,
      baySpacingM: 0.95,
      binLengthCm: 75,
      binWidthCm: 50,
      binHeightCm: 40,
      mapTag: '2×3×4 · Fridge',
    }),
    skus: makeSkus('fridge', [
      ['MLK-01', 'Fresh Milk & Juice Home Pack', 'A', 140, 26, 18, 24, 4.5, 6, true, '#38bdf8'],
      ['MEL-02', 'Airtight Glass Side-Dish Containers', 'A', 125, 24, 18, 12, 1.8, 10, true, '#34d399'],
      ['VEG-03', 'Fresh Greens & Salad Crisper Bin', 'A', 110, 32, 22, 16, 2.1, 6, true, '#22d3ee'],
      ['BEV-04', 'Sparkling Beverage 12-Can Pack', 'B', 65, 34, 22, 14, 4.8, 6, false, '#f59e0b'],
      ['FRZ-05', 'Frozen Dumpling & Meal Kit Pack', 'C', 18, 36, 24, 16, 2.8, 6, false, '#94a3b8'],
    ]),
  },
  {
    id: 'tpl-life-16-garage',
    persona: 'everyday',
    category: 'garage_hobby',
    name: '16 · Garage & DIY Tool Rack',
    description:
      'Anchors heavy steel tool chests and 18L paint pails on Z1 floor shelves while keeping cordless drills and hardware bins at waist height.',
    highlights: 'Heavy tool chest bottom-level safety lock',
    config: makeLifeConfig(3, 4, 4, {
      aisleSpacingM: 2.6,
      baySpacingM: 1.25,
      binLengthCm: 100,
      binWidthCm: 60,
      binHeightCm: 50,
      mapTag: '3×4×4 · Garage DIY',
    }),
    skus: makeSkus('garage', [
      ['DRL-01', 'Cordless Drill & Battery Case', 'A', 115, 38, 28, 16, 4.2, 6, false, '#22d3ee'],
      ['SCR-02', 'Fastener & Hand-Tool Organizer', 'A', 130, 34, 24, 14, 3.1, 8, false, '#34d399'],
      ['CHT-03', 'Heavy Steel Socket Tool Chest', 'B', 45, 48, 34, 26, 22.5, 4, false, '#f59e0b'],
      ['PNT-04', 'Acrylic Wall Paint 18L Pail', 'C', 12, 34, 34, 38, 21.0, 4, false, '#fb7185'],
      ['CAR-05', 'Car Wash & Detailing Kit', 'B', 52, 40, 28, 24, 5.4, 6, false, '#818cf8'],
    ]),
  },
  {
    id: 'tpl-life-17-camping',
    persona: 'everyday',
    category: 'garage_hobby',
    name: '17 · Camping & Outdoor Gear Closet',
    description:
      'Places heavy 50L ice coolers on Z1, weekend camp stoves and lanterns in the waist-level Golden Zone, and family dome tents on upper shelves.',
    highlights: 'Fast weekend camping load-out workflow',
    config: makeLifeConfig(2, 4, 4, {
      binLengthCm: 100,
      binWidthCm: 60,
      binHeightCm: 55,
      mapTag: '2×4×4 · Camping Gear',
    }),
    skus: makeSkus('camp', [
      ['CLR-01', 'Hard-Shell Ice Cooler 50L', 'A', 78, 56, 38, 38, 18.5, 3, false, '#38bdf8'],
      ['STV-02', 'Camp Stove & Cookware Set', 'A', 92, 40, 28, 22, 4.8, 5, true, '#22d3ee'],
      ['LNT-03', 'LED Camp Lantern & Powerbank', 'A', 104, 28, 22, 20, 2.3, 6, true, '#34d399'],
      ['CHR-04', 'Folding Relax Camp Chair', 'B', 55, 84, 22, 20, 4.2, 4, false, '#f59e0b'],
      ['TNT-05', '4-Person Family Dome Tent', 'C', 16, 62, 28, 26, 9.6, 4, false, '#818cf8'],
    ]),
  },
  {
    id: 'tpl-life-18-oneroom',
    persona: 'everyday',
    category: 'home_living',
    name: '18 · Studio Apartment Wall Shelving',
    description:
      'Compresses daily tech gadgets, textbooks, skincare trays, kettlebells, and seasonal clothes into a single 5-bay studio wall unit.',
    highlights: 'Single-wall compact studio space maximization',
    config: makeLifeConfig(1, 5, 4, {
      aisleSpacingM: 2.0,
      baySpacingM: 1.0,
      binLengthCm: 85,
      binWidthCm: 45,
      binHeightCm: 42,
      mapTag: '1×5×4 · Studio Wall',
    }),
    skus: makeSkus('studio', [
      ['DAY-01', 'Chargers & Desk Gadget Tray', 'A', 145, 30, 20, 14, 1.5, 6, true, '#22d3ee'],
      ['BOK-02', 'Laptop & Reference Books Box', 'A', 118, 32, 24, 16, 2.8, 6, false, '#38bdf8'],
      ['COS-03', 'Skincare & Vanity Organizer', 'A', 132, 26, 20, 18, 1.9, 6, true, '#34d399'],
      ['GYM-04', 'Kettlebell & Home Gym Tote', 'B', 44, 34, 24, 24, 17.5, 2, false, '#f59e0b'],
      ['ARC-05', 'Seasonal Wardrobe Storage Box', 'C', 8, 46, 34, 22, 3.8, 5, false, '#94a3b8'],
    ]),
  },
  {
    id: 'tpl-life-19-minishop',
    persona: 'everyday',
    category: 'shop_office',
    name: '19 · Online Seller Shipping & Packing Room',
    description:
      'Clusters corrugated mailer boxes, packing tape, and bestseller merchandise kits right in the front Golden Zone for rapid parcel dispatch.',
    highlights: 'Faster daily parcel packing & shipping',
    config: makeLifeConfig(3, 4, 4, {
      aisleSpacingM: 2.6,
      baySpacingM: 1.25,
      binLengthCm: 100,
      binWidthCm: 60,
      binHeightCm: 50,
      mapTag: '3×4×4 · Online Shop',
    }),
    skus: makeSkus('shop', [
      ['BOX-M', 'Mailer Box Bundle (50 pcs)', 'A', 140, 42, 32, 22, 4.5, 10, false, '#22d3ee'],
      ['FIL-3D', 'Bestseller Merch & Craft Kit', 'A', 112, 32, 24, 24, 6.2, 10, true, '#34d399'],
      ['TAP-12', 'Packing Tape & Bubble Wrap Box', 'A', 128, 34, 26, 20, 5.1, 8, false, '#38bdf8'],
      ['TOL-90', 'Heat Press & Packaging Machine', 'B', 42, 46, 34, 26, 21.0, 4, false, '#f59e0b'],
      ['RSV-10', 'Seasonal Gift Ribbon & Pouches', 'C', 10, 48, 30, 22, 2.9, 8, false, '#94a3b8'],
    ]),
  },
  {
    id: 'tpl-life-20-hobby',
    persona: 'everyday',
    category: 'garage_hobby',
    name: '20 · Study, Vinyl LP & Collector Shelf',
    description:
      'Protects fragile acrylic figure cases and camera lenses from top-stacking while anchoring heavy vinyl LP crates and art books on Z1.',
    highlights: 'Fragile figure/lens protection · Heavy LP base stability',
    config: makeLifeConfig(2, 4, 5, {
      binLengthCm: 80,
      binWidthCm: 45,
      binHeightCm: 40,
      mapTag: '2×4×5 · Study & Hobby',
    }),
    skus: makeSkus('study', [
      ['FIG-01', 'Acrylic Collector Figure Case', 'A', 85, 28, 22, 24, 1.4, 8, true, '#22d3ee'],
      ['VNL-02', 'Vinyl LP Record Storage Crate', 'A', 95, 34, 34, 34, 16.5, 4, true, '#f59e0b'],
      ['CAM-03', 'Dry-Cabinet Camera & Lens Box', 'A', 110, 32, 24, 20, 3.2, 6, true, '#34d399'],
      ['ART-04', 'Hardcover Art Book Collection', 'B', 40, 36, 26, 22, 12.0, 6, false, '#818cf8'],
      ['OLD-05', 'Back-Issue Magazine Archive', 'C', 6, 38, 28, 24, 5.5, 8, false, '#94a3b8'],
    ]),
  },
  {
    id: 'tpl-life-21-laundry',
    persona: 'everyday',
    category: 'home_living',
    name: '21 · Laundry & Utility Room Rack',
    description:
      'Anchors heavy 5L liquid detergent jugs on Z1, keeps daily towels and sprays at waist height, and stores lightweight paper rolls above.',
    highlights: 'Zero heavy detergent spill or drop hazards',
    config: makeLifeConfig(2, 3, 4, {
      binLengthCm: 80,
      binWidthCm: 50,
      binHeightCm: 45,
      mapTag: '2×3×4 · Utility Room',
    }),
    skus: makeSkus('util', [
      ['DET-01', 'Liquid Laundry Detergent 5L×4', 'A', 88, 36, 26, 30, 20.5, 4, false, '#38bdf8'],
      ['TWL-02', 'Fresh Bath Towel Basket', 'A', 115, 36, 26, 20, 2.2, 6, false, '#22d3ee'],
      ['CLN-03', 'Multi-Surface Cleaner & Brush Kit', 'A', 102, 28, 20, 22, 2.8, 6, true, '#34d399'],
      ['VAC-04', 'Cordless Vacuum Filter & Tool Kit', 'B', 50, 34, 24, 22, 3.9, 4, true, '#f59e0b'],
      ['TIS-05', 'Bath Tissue 30-Roll Bulk Pack', 'C', 14, 48, 36, 28, 2.6, 4, false, '#94a3b8'],
    ]),
  },
  {
    id: 'tpl-life-22-cafe',
    persona: 'everyday',
    category: 'shop_office',
    name: '22 · Cafe & Bakery Stockroom',
    description:
      'Places heavy milk cases and 20kg flour sacks on lower shelves while keeping espresso beans, cups, and lids in the barista Golden Zone.',
    highlights: 'Peak-hour barista replenishment speed',
    config: makeLifeConfig(3, 3, 4, {
      binLengthCm: 90,
      binWidthCm: 55,
      binHeightCm: 48,
      mapTag: '3×3×4 · Cafe Stockroom',
    }),
    skus: makeSkus('cafe', [
      ['BEN-01', 'Whole-Bean Espresso Coffee Carton', 'A', 165, 34, 24, 22, 5.0, 8, true, '#f59e0b'],
      ['CUP-02', 'Iced Cups, Lids & Sleeves Box', 'A', 180, 42, 30, 22, 3.2, 10, false, '#22d3ee'],
      ['MLK-03', 'Barista Milk 1L×12 Case', 'A', 150, 38, 26, 24, 12.8, 8, false, '#38bdf8'],
      ['SYR-04', 'Glass Flavor Syrup 6-Bottle Case', 'B', 64, 32, 24, 32, 9.6, 6, true, '#fb7185'],
      ['FLR-05', 'Artisan Bread Flour 20kg Sack', 'B', 40, 48, 34, 18, 20.0, 4, false, '#a78bfa'],
    ]),
  },
  {
    id: 'tpl-life-23-office',
    persona: 'everyday',
    category: 'shop_office',
    name: '23 · Office Supply & Document Archive Room',
    description:
      'Anchors heavy A4 copy paper reams and 20kg contract archive boxes on Z1 while organizing laser toner and stationery at waist height.',
    highlights: 'Bottom-anchored A4 paper · Fast stationery access',
    config: makeLifeConfig(2, 4, 4, {
      binLengthCm: 90,
      binWidthCm: 55,
      binHeightCm: 45,
      mapTag: '2×4×4 · Office Supply',
    }),
    skus: makeSkus('office', [
      ['PAP-A4', 'A4 Copy Paper 5-Ream Carton', 'A', 110, 32, 24, 26, 12.5, 8, false, '#38bdf8'],
      ['TON-02', 'Laser Printer Toner Cartridge', 'A', 96, 36, 20, 18, 2.2, 8, true, '#22d3ee'],
      ['STN-03', 'Office Pens & Sticky Notes Tray', 'A', 125, 30, 22, 16, 1.8, 8, false, '#34d399'],
      ['BOX-04', 'Legal Contract Archive Box 20kg', 'B', 22, 42, 32, 28, 20.0, 4, false, '#f59e0b'],
      ['TAX-05', 'Annual Tax Binder Case', 'C', 6, 40, 30, 24, 7.5, 8, false, '#94a3b8'],
    ]),
  },
  {
    id: 'tpl-life-24-moving',
    persona: 'everyday',
    category: 'home_living',
    name: '24 · Moving & Self-Storage Unit',
    description:
      'Stacks heavy book boxes safely on Z1 floor shelves while protecting fragile dishware and PC monitor cartons from top-stack crushing.',
    highlights: 'Zero dishware/appliance damage · Safe load distribution',
    config: makeLifeConfig(2, 3, 4, {
      binLengthCm: 100,
      binWidthCm: 70,
      binHeightCm: 55,
      mapTag: '2×3×4 · Moving Storage',
    }),
    skus: makeSkus('move', [
      ['DISH-1', 'Cushioned Kitchen Dish & Glass Box', 'A', 65, 42, 32, 28, 9.5, 4, true, '#34d399'],
      ['ELEC-2', 'Monitor & Small Appliance Carton', 'A', 80, 48, 30, 38, 11.0, 4, true, '#22d3ee'],
      ['BOOK-3', 'Heavy Book Collection Moving Box', 'B', 35, 44, 34, 28, 21.0, 4, false, '#f59e0b'],
      ['CLTH-4', 'Wardrobe Apparel & Bedding Carton', 'B', 50, 50, 38, 30, 7.2, 6, false, '#818cf8'],
      ['MEMO-5', 'Family Photo Album & Keepsake Box', 'C', 10, 38, 28, 22, 4.0, 4, true, '#94a3b8'],
    ]),
  },
];

export const WAREHOUSE_TEMPLATES: WarehouseTemplate[] =
  RAW_WAREHOUSE_TEMPLATES.map((tpl) => ({
    ...tpl,
    imageUrl: `/templates/${tpl.id}.png`,
  }));
