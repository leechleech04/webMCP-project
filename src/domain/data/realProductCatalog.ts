import type { ComponentDefinition } from "../types/component";

type ProductOverride = Partial<ComponentDefinition> & Pick<ComponentDefinition, "name">;

const estimated = (amount: number, billingUnit: "PRODUCT" | "INSTANCE" = "INSTANCE") => ({
  amount,
  currency: "KRW" as const,
  kind: "ESTIMATE" as const,
  source: "Korean market catalog estimate",
  updatedAt: "2026-09-03",
  billingUnit,
});

const atxInputs = [
  { id: "motherboard-atx", type: "ATX_24PIN" as const, direction: "INPUT" as const },
  { id: "motherboard-eps", type: "EPS_8PIN" as const, direction: "INPUT" as const },
  { id: "fan-header-1", type: "PWM" as const, direction: "OUTPUT" as const },
  { id: "argb-header-1", type: "ARGB" as const, direction: "OUTPUT" as const },
];

const psuOutputs = (gpuType: "PCIE_8PIN" | "12V_2X6") => [
  { id: "psu-atx-01", type: "ATX_24PIN" as const, direction: "OUTPUT" as const },
  { id: "psu-eps-01", type: "EPS_8PIN" as const, direction: "OUTPUT" as const },
  { id: "psu-gpu-01", type: gpuType, direction: "OUTPUT" as const },
  { id: "psu-gpu-02", type: "PCIE_8PIN" as const, direction: "OUTPUT" as const },
  { id: "psu-gpu-03", type: "PCIE_8PIN" as const, direction: "OUTPUT" as const },
];

/** Public first-wave catalog. Stable internal IDs migrate v1 builds; MPN is canonical SKU identity. */
export const realProductOverrides: Readonly<Record<string, ProductOverride>> = {
  "case-01": { name: "Lian Li Lancool 216", manufacturer: "Lian Li", model: "LANCOOL 216", mpn: "LAN216X", officialUrl: "https://lian-li.com/product/lancool-216/", price: estimated(149000) },
  "case-sff-01": { name: "Cooler Master MasterBox NR200P V2", manufacturer: "Cooler Master", model: "MasterBox NR200P V2", mpn: "NR200PV2-KCNN-S00", officialUrl: "https://www.coolermaster.com/en-global/products/masterbox-nr200p-v2.html", dimensions: { width: 185, height: 292, depth: 372 }, price: estimated(139000) },
  "case-terra-01": { name: "Fractal Design Terra", manufacturer: "Fractal Design", model: "Terra Silver", mpn: "FD-C-TER1N-02", officialUrl: "https://www.fractal-design.com/products/cases/terra-series/terra/terra-silver/", dimensions: { width: 153, height: 218, depth: 343 }, price: estimated(289000) },
  "case-mini-pc-01": {
    name: "InWin Chopin MAX (200W PSU Included)", manufacturer: "InWin", model: "Chopin MAX", mpn: "IW-CS-CHOPINMAXSIL-PS200W",
    officialUrl: "https://www.in-win.com/en/gaming-chassis/chopin-max", dimensions: { width: 84, height: 244, depth: 217 },
    integratedPsu: { capacity: 200, connectors: psuOutputs("PCIE_8PIN") }, price: estimated(179000),
  },
  "case-dual-chamber-atx": { name: "Lian Li O11D EVO RGB", manufacturer: "Lian Li", model: "O11D EVO RGB", mpn: "O11DERGBX", officialUrl: "https://lian-li.com/product/o11d-evo-rgb/", dimensions: { width: 290, height: 471, depth: 478 }, price: estimated(239000) },

  "motherboard-01": { name: "ASUS TUF GAMING B850-PLUS WIFI", manufacturer: "ASUS", model: "TUF GAMING B850-PLUS WIFI", mpn: "90MB1J90-M0EAY0", officialUrl: "https://www.asus.com/us/motherboards-components/motherboards/tuf-gaming/tuf-gaming-b850-plus-wifi/techspec/", compatibility: { motherboardFormFactor: "ATX", cpuSocket: "AM5", memoryType: "DDR5" }, connectors: atxInputs, price: estimated(279000) },
  "motherboard-matx-am5": { name: "ASUS TUF GAMING B850M-PLUS WIFI", manufacturer: "ASUS", model: "TUF GAMING B850M-PLUS WIFI", mpn: "TUF-GAMING-B850M-PLUS-WIFI", officialUrl: "https://www.asus.com/uk/motherboards-components/motherboards/tuf-gaming/tuf-gaming-b850m-plus-wifi/techspec/", compatibility: { motherboardFormFactor: "MICRO_ATX", cpuSocket: "AM5", memoryType: "DDR5" }, connectors: atxInputs, price: estimated(249000) },
  "motherboard-itx-01": { name: "ASUS ROG STRIX B850-I GAMING WIFI", manufacturer: "ASUS", model: "ROG STRIX B850-I GAMING WIFI", mpn: "ROG-STRIX-B850-I-GAMING-WIFI", officialUrl: "https://rog.asus.com/us/motherboards/rog-strix/rog-strix-b850-i-gaming-wifi/spec/", compatibility: { motherboardFormFactor: "MINI_ITX", cpuSocket: "AM5", memoryType: "DDR5" }, connectors: atxInputs, price: estimated(349000) },
  "motherboard-atx-lga1851": { name: "MSI MPG Z890 EDGE TI WIFI", manufacturer: "MSI", model: "MPG Z890 EDGE TI WIFI", mpn: "MPG-Z890-EDGE-TI-WIFI", officialUrl: "https://www.msi.com/Motherboard/MPG-Z890-EDGE-TI-WIFI/Specification", compatibility: { motherboardFormFactor: "ATX", cpuSocket: "LGA1851", memoryType: "DDR5" }, connectors: atxInputs, price: estimated(489000) },

  "cpu-am5-65w": { name: "AMD Ryzen 5 9600X", manufacturer: "AMD", model: "Ryzen 5 9600X", mpn: "100-100001405WOF", officialUrl: "https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-5-9600x.html", power: { consumption: 65 }, compatibility: { cpuSocket: "AM5" }, price: estimated(319000) },
  "cpu-01": { name: "AMD Ryzen 7 9800X3D", manufacturer: "AMD", model: "Ryzen 7 9800X3D", mpn: "100-100001084WOF", officialUrl: "https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-7-9800x3d.html", power: { consumption: 120 }, compatibility: { cpuSocket: "AM5" }, price: estimated(729000) },
  "cpu-lga1851-125w": { name: "Intel Core Ultra 5 245K", manufacturer: "Intel", model: "Core Ultra 5 245K", mpn: "BX80768245K", officialUrl: "https://www.intel.com/content/www/us/en/products/sku/241067/intel-core-ultra-5-processor-245k-24m-cache-up-to-5-20-ghz/specifications.html", power: { consumption: 125 }, compatibility: { cpuSocket: "LGA1851" }, price: estimated(369000) },
  "cpu-am5-170w": { name: "Intel Core Ultra 7 265K", manufacturer: "Intel", model: "Core Ultra 7 265K", mpn: "BX80768265K", officialUrl: "https://www.intel.com/content/www/us/en/products/sku/241063/intel-core-ultra-7-processor-265k-30m-cache-up-to-5-50-ghz/specifications.html", power: { consumption: 125 }, compatibility: { cpuSocket: "LGA1851" }, price: estimated(529000) },

  "gpu-1fan-01": { name: "ZOTAC GAMING GeForce RTX 5060 SOLO", manufacturer: "ZOTAC", model: "RTX 5060 SOLO", mpn: "ZT-B50600G-10L", officialUrl: "https://www.zotac.com/us/product/graphics_card/zotac-gaming-geforce-rtx-5060-solo", dimensions: { width: 111.2, height: 36.4, depth: 164.5 }, power: { consumption: 145 }, connectors: [{ id: "gpu-power", type: "PCIE_8PIN", direction: "INPUT" }], price: estimated(499000) },
  "gpu-2fan-01": { name: "ASUS Prime GeForce RTX 5070 OC 12GB", manufacturer: "ASUS", model: "PRIME RTX 5070 OC", mpn: "PRIME-RTX5070-O12G", officialUrl: "https://www.asus.com/uk/motherboards-components/graphics-cards/prime/prime-rtx5070-o12g/techspec/", dimensions: { width: 126, height: 50, depth: 304 }, power: { consumption: 250 }, connectors: [{ id: "gpu-power", type: "12V_2X6", direction: "INPUT" }], price: estimated(899000) },
  "gpu-01": { name: "ASUS TUF Gaming GeForce RTX 5080 OC 16GB", manufacturer: "ASUS", model: "TUF RTX 5080 OC", mpn: "TUF-RTX5080-O16G-GAMING", officialUrl: "https://www.asus.com/us/motherboards-components/graphics-cards/tuf-gaming/tuf-rtx5080-o16g-gaming/", dimensions: { width: 150, height: 72, depth: 348 }, power: { consumption: 360 }, connectors: [{ id: "gpu-power", type: "12V_2X6", direction: "INPUT" }], price: estimated(1890000) },
  "gpu-compact-200": { name: "PowerColor Reaper Radeon RX 9070 16GB", manufacturer: "PowerColor", model: "Reaper Radeon RX 9070", mpn: "RX9070-16G-A", officialUrl: "https://www.powercolor.com/product-detail215.htm", dimensions: { width: 127, height: 42, depth: 304 }, power: { consumption: 220 }, connectors: [{ id: "gpu-power", type: "PCIE_8PIN", direction: "INPUT" }, { id: "gpu-power-2", type: "PCIE_8PIN", direction: "INPUT" }], price: estimated(899000) },
  "gpu-performance-280": { name: "SAPPHIRE PURE Radeon RX 9070 XT 16GB", manufacturer: "SAPPHIRE", model: "PURE Radeon RX 9070 XT", mpn: "11348-03-20G", officialUrl: "https://nation.sapphiretech.com/en/consumer/pure-radeon-rx-9070-xt-16g-gddr6", dimensions: { width: 120.25, height: 61.6, depth: 320 }, power: { consumption: 317 }, connectors: [{ id: "gpu-power", type: "PCIE_8PIN", direction: "INPUT" }, { id: "gpu-power-2", type: "PCIE_8PIN", direction: "INPUT" }], price: estimated(1099000) },

  "ram-01": { name: "G.SKILL Flare X5 DDR5-6000 CL30 32GB (2×16GB)", manufacturer: "G.SKILL", model: "Flare X5 DDR5-6000 CL30 32GB", mpn: "F5-6000J3038F16GX2-FX5", officialUrl: "https://www.gskill.com/qvl/165/396/1673491242/F5-6000J3038F16GX2-FX5-QVL", compatibility: { memoryType: "DDR5" }, maxPerBuild: 2, price: estimated(149000, "PRODUCT") },
  "ram-03": { name: "Kingston FURY Beast DDR5-6400 32GB (2×16GB)", manufacturer: "Kingston", model: "FURY Beast DDR5-6400 32GB", mpn: "KF564C32BBK2-32", officialUrl: "https://www.kingston.com/en/memory/gaming/kingston-fury-beast-ddr5-memory", compatibility: { memoryType: "DDR5" }, maxPerBuild: 2, price: estimated(189000, "PRODUCT") },

  "storage-nvme-01": { name: "Samsung 990 PRO NVMe SSD 2TB", manufacturer: "Samsung", model: "990 PRO 2TB", mpn: "MZ-V9P2T0BW", officialUrl: "https://www.samsung.com/us/memory-storage/nvme-ssd/990-pro-2tb-nvme-pcie-gen-4-mz-v9p2t0b-am/", power: { consumption: 8.5 }, compatibility: { storageFormFactor: "M2_2280" }, maxPerBuild: 2, price: estimated(249000) },
  "storage-nvme-heatsink": { name: "Crucial T705 PCIe 5.0 NVMe SSD 2TB", manufacturer: "Crucial", model: "T705 2TB", mpn: "CT2000T705SSD3", officialUrl: "https://www.crucial.com/ssd/t705/ct2000t705ssd3", power: { consumption: 12 }, compatibility: { storageFormFactor: "M2_2280" }, maxPerBuild: 2, price: estimated(399000) },
  "storage-sata-2tb": { name: "Samsung 870 EVO SATA SSD 2TB", manufacturer: "Samsung", model: "870 EVO 2TB", mpn: "MZ-77E2T0B", officialUrl: "https://www.samsung.com/us/computing/memory-storage/solid-state-drives/870-evo-sata-2-5-ssd-2tb-mz-77e2t0b-am/", compatibility: { storageFormFactor: "SATA_2_5" }, maxPerBuild: 2, price: estimated(199000) },

  "cooler-single-tower": { name: "Noctua NH-U12S redux", manufacturer: "Noctua", model: "NH-U12S redux", mpn: "NH-U12S-REDUX", officialUrl: "https://www.noctua.at/en/products/nh-u12s-redux/specifications", dimensions: { width: 125, height: 158, depth: 71 }, compatibility: { supportedCpuSockets: ["AM5", "LGA1851"] }, price: estimated(79000) },
  "cooler-dual-tower": { name: "Noctua NH-D15 G2", manufacturer: "Noctua", model: "NH-D15 G2", mpn: "NH-D15-G2", officialUrl: "https://noctua.at/en/products/cpu-cooler-retail/nh-d15-g2/specification", dimensions: { width: 150, height: 168, depth: 152 }, compatibility: { supportedCpuSockets: ["AM5", "LGA1851"] }, price: estimated(189000) },
  "cooler-low-profile-am5": { name: "Noctua NH-L9a-AM5", manufacturer: "Noctua", model: "NH-L9a-AM5", mpn: "NH-L9A-AM5", officialUrl: "https://www.noctua.at/en/products/nh-l9a-am5/specifications", dimensions: { width: 114, height: 37, depth: 92 }, compatibility: { supportedCpuSockets: ["AM5"] }, price: estimated(69000) },
  "radiator-240-01": { name: "ARCTIC Liquid Freezer III Pro 240", manufacturer: "ARCTIC", model: "Liquid Freezer III Pro 240", mpn: "ACFRE00178A", officialUrl: "https://www.arctic.de/en/Liquid-Freezer-III-Pro-240/", dimensions: { width: 120, height: 38, depth: 277 }, compatibility: { supportedCpuSockets: ["AM5", "LGA1851"] }, price: estimated(139000) },
  "radiator-01": { name: "ARCTIC Liquid Freezer III Pro 360", manufacturer: "ARCTIC", model: "Liquid Freezer III Pro 360", mpn: "ACFRE00180A", officialUrl: "https://www.arctic.de/en/Liquid-Freezer-III-Pro-360/", dimensions: { width: 120, height: 38, depth: 398 }, compatibility: { supportedCpuSockets: ["AM5", "LGA1851"] }, price: estimated(169000) },

  "psu-atx-650": { name: "Seasonic FOCUS GX-750 ATX 3.1", manufacturer: "Seasonic", model: "FOCUS GX-750 ATX 3.1", mpn: "FOCUS-GX-750-ATX31", officialUrl: "https://seasonic.com/focus-gx-atx-3/", dimensions: { width: 150, height: 86, depth: 140 }, power: { capacity: 750 }, connectors: psuOutputs("12V_2X6"), price: estimated(149000) },
  "psu-atx-short-850": { name: "Seasonic FOCUS GX-850 ATX 3.1", manufacturer: "Seasonic", model: "FOCUS GX-850 ATX 3.1", mpn: "FOCUS-GX-850-ATX31", officialUrl: "https://seasonic.com/focus-gx-atx-3/", dimensions: { width: 150, height: 86, depth: 140 }, power: { capacity: 850 }, connectors: psuOutputs("12V_2X6"), price: estimated(179000) },
  "psu-sfx-01": { name: "Corsair SF850L 850W SFX-L", manufacturer: "Corsair", model: "SF850L", mpn: "CP-9020245", officialUrl: "https://www.corsair.com/us/en/p/psu/cp-9020245-na/sf-l-series-sf850l-fully-modular-low-noise-sfx-power-supply-cp-9020245-na", dimensions: { width: 125, height: 63.5, depth: 130 }, power: { capacity: 850 }, connectors: psuOutputs("12V_2X6"), price: estimated(229000) },

  "fan-top-01": { name: "Noctua NF-A12x25 G2 PWM", manufacturer: "Noctua", model: "NF-A12x25 G2 PWM", mpn: "NF-A12X25-G2-PWM", officialUrl: "https://noctua.at/en/products/fan/nf-a12x25-g2-pwm", dimensions: { width: 120, height: 25, depth: 120 }, maxPerBuild: 10, price: estimated(49000) },
  "fan-140-01": { name: "Noctua NF-A14x25 G2 PWM", manufacturer: "Noctua", model: "NF-A14x25 G2 PWM", mpn: "NF-A14X25-G2-PWM", officialUrl: "https://noctua.at/en/products/fan/nf-a14x25-g2-pwm", dimensions: { width: 140, height: 25, depth: 140 }, maxPerBuild: 10, price: estimated(55000) },
};

export const realProductIds = Object.freeze(Object.keys(realProductOverrides));
