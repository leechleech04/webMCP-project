import { useState, useMemo } from "react";
import { useBuildStore } from "../../store/buildStore";
import { getActiveCaseProfile } from "../../domain/cases/getActiveCase";
import { componentRegistry } from "../../domain/data/components";
import { mountRegistry } from "../../domain/data/mounts";
import { installComponent } from "../../domain/commands/installComponent";
import { removeComponent } from "../../domain/commands/removeComponent";
import { moveComponent } from "../../domain/commands/moveComponent";
import { setFanDirection } from "../../domain/commands/setFanDirection";
import type { ComponentDefinition } from "../../domain/types/component";

type TabCategory = "GPU" | "RADIATOR" | "FAN" | "MOTHERBOARD" | "CPU" | "RAM" | "PSU" | "DIAGRAMS";

const CATEGORIES: { id: TabCategory; label: string; icon: string }[] = [
  { id: "GPU", label: "Graphics", icon: "🎮" },
  { id: "RADIATOR", label: "Liquid Cooler", icon: "💧" },
  { id: "FAN", label: "Fans & Air", icon: "🌀" },
  { id: "MOTHERBOARD", label: "Motherboard", icon: "🟩" },
  { id: "CPU", label: "CPU", icon: "⚡" },
  { id: "RAM", label: "Memory (RAM)", icon: "🧠" },
  { id: "PSU", label: "Power Supply", icon: "🔋" },
  { id: "DIAGRAMS", label: "Diagrams", icon: "📐" },
];

export function ComponentPalette() {
  const state = useBuildStore((s) => s);
  const activeProfile = useMemo(() => getActiveCaseProfile(state), [state]);
  const [activeTab, setActiveTab] = useState<TabCategory>("GPU");
  const [selectedMounts, setSelectedMounts] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedDiagramSize, setSelectedDiagramSize] = useState<"120" | "140" | "160" | "AIO">("120");
  const [ramQuantity, setRamQuantity] = useState<1 | 2>(2);

  const installedMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of state.placements) {
      map.set(p.componentId, p.mountId);
    }
    return map;
  }, [state.placements]);

  const occupiedMounts = useMemo(() => {
    return new Set(state.placements.map((p) => p.mountId));
  }, [state.placements]);

  const isDualRamInstalled = useMemo(() => {
    return installedMap.has("ram-01") && installedMap.has("ram-02");
  }, [installedMap]);

  const componentsInTab = useMemo(() => {
    if (activeTab === "DIAGRAMS") return [];
    return Object.values(componentRegistry).filter((c) => c.type === activeTab);
  }, [activeTab]);

  const getCompatibleMountsForComponent = (component: ComponentDefinition) => {
    return activeProfile.supportedMountIds.filter((mid) => {
      const def = mountRegistry[mid];
      return def && def.supportedComponentTypes.includes(component.type);
    });
  };

  const checkClearanceFit = (component: ComponentDefinition, mountId: string) => {
    const limit = activeProfile.clearanceLimits?.[mountId];
    if (!limit) return { fits: true, reason: "" };

    if (limit.maxDepth && component.dimensions.depth > limit.maxDepth) {
      return {
        fits: false,
        reason: `Depth/Length (${component.dimensions.depth}mm) exceeds case max (${limit.maxDepth}mm)`,
        excessMm: component.dimensions.depth - limit.maxDepth,
      };
    }
    if (limit.maxWidth && component.dimensions.width > limit.maxWidth) {
      return {
        fits: false,
        reason: `Width (${component.dimensions.width}mm) exceeds case max (${limit.maxWidth}mm)`,
        excessMm: component.dimensions.width - limit.maxWidth,
      };
    }
    if (limit.maxHeight && component.dimensions.height > limit.maxHeight) {
      return {
        fits: false,
        reason: `Height (${component.dimensions.height}mm) exceeds case max (${limit.maxHeight}mm)`,
        excessMm: component.dimensions.height - limit.maxHeight,
      };
    }
    return { fits: true, reason: "" };
  };

  const handleInstall = (componentId: string) => {
    const component = componentRegistry[componentId];
    if (!component) return;

    const availableMounts = getCompatibleMountsForComponent(component);
    const targetMount = selectedMounts[componentId] || availableMounts.find((m) => !occupiedMounts.has(m)) || availableMounts[0];

    if (!targetMount) {
      setErrorMessage(`No supported mount found for ${component.name} in current case (${activeProfile.label})`);
      return;
    }

    try {
      installComponent({ componentId, mountId: targetMount });
      const fit = checkClearanceFit(component, targetMount);
      if (!fit.fits) {
        setStatusMessage(`⚠️ Installed ${component.name} with Overfill / Clearance Warning: ${fit.reason}`);
      } else {
        setStatusMessage(`Installed ${component.name} at ${targetMount}`);
      }
      setErrorMessage(null);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err?.message ?? String(err));
      setStatusMessage(null);
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const handleInstallRamDual = () => {
    try {
      if (!occupiedMounts.has("dimm-a1")) {
        installComponent({ componentId: "ram-01", mountId: "dimm-a1" });
      }
      if (!occupiedMounts.has("dimm-b1") && activeProfile.supportedMountIds.includes("dimm-b1")) {
        installComponent({ componentId: "ram-02", mountId: "dimm-b1" });
      }
      setStatusMessage("Installed 2x DDR5 RAM Sticks in Dual-Channel (dimm-a1 & dimm-b1)");
      setErrorMessage(null);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message ?? String(err));
      setStatusMessage(null);
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const handleRemoveRamDual = () => {
    try {
      if (installedMap.has("ram-01")) removeComponent({ componentId: "ram-01" });
      if (installedMap.has("ram-02")) removeComponent({ componentId: "ram-02" });
      if (installedMap.has("ram-03")) removeComponent({ componentId: "ram-03" });
      setStatusMessage("Removed all RAM sticks");
      setErrorMessage(null);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message ?? String(err));
      setStatusMessage(null);
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const handleRemove = (componentId: string) => {
    try {
      removeComponent({ componentId });
      setStatusMessage(`Removed ${componentRegistry[componentId]?.name ?? componentId}`);
      setErrorMessage(null);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message ?? String(err));
      setStatusMessage(null);
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const handleMove = (componentId: string, targetMount: string) => {
    try {
      moveComponent({ componentId, mountId: targetMount });
      setStatusMessage(`Moved ${componentRegistry[componentId]?.name ?? componentId} to ${targetMount}`);
      setErrorMessage(null);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message ?? String(err));
      setStatusMessage(null);
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const handleToggleFan = (componentId: string) => {
    const currentCfg = state.fanConfigs.find((c) => c.componentId === componentId);
    const nextDir = currentCfg?.direction === "EXHAUST" ? "INTAKE" : "EXHAUST";
    setFanDirection({ componentId, direction: nextDir });
  };

  return (
    <section
      aria-label="Component Catalog and Customizer"
      style={{
        marginTop: "0.6rem",
        border: "1px solid #1e3a8a",
        borderRadius: "12px",
        padding: "0.85rem",
        background: "#080f1d",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
        overflowWrap: "break-word",
        wordBreak: "break-word",
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.45rem",
          marginBottom: "0.75rem",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "0.92rem",
            color: "#60a5fa",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            overflowWrap: "break-word",
            wordBreak: "break-word",
          }}
        >
          <span>🛠️</span> Component Customizer
        </h3>
        <span
          style={{
            fontSize: "0.72rem",
            color: "#38bdf8",
            fontWeight: 700,
            background: "#111a2b",
            padding: "0.2rem 0.5rem",
            borderRadius: "6px",
            border: "1px solid #1e293b",
            overflowWrap: "break-word",
            wordBreak: "break-word",
          }}
        >
          Profile: {activeProfile.formFactor}
        </span>
      </div>

      {/* Large Category Tabs Strip */}
      <div
        style={{
          display: "flex",
          gap: "0.4rem",
          overflowX: "auto",
          paddingBottom: "0.45rem",
          marginBottom: "0.75rem",
        }}
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeTab === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.id)}
              style={{
                flexShrink: 0,
                padding: "0.45rem 0.75rem",
                borderRadius: "8px",
                border: isActive ? "1px solid #38bdf8" : "1px solid #28354a",
                background: isActive ? "linear-gradient(135deg, #1e40af, #1d4ed8)" : "#111a2b",
                color: isActive ? "#ffffff" : "#94a3b8",
                fontSize: "0.78rem",
                fontWeight: isActive ? 800 : 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                boxShadow: isActive ? "0 2px 8px rgba(56, 189, 248, 0.3)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontSize: "0.9rem" }}>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* RAM QUANTITY & DUAL CHANNEL SELECTOR HEADER */}
      {activeTab === "RAM" && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
            background: "#111a2b",
            padding: "0.65rem 0.85rem",
            borderRadius: "8px",
            marginBottom: "0.75rem",
            border: "1px solid #1e3a8a",
            overflowWrap: "break-word",
            wordBreak: "break-word",
          }}
        >
          <div>
            <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#60a5fa" }}>RAM Stick Configuration:</span>
            <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "0.1rem" }}>
              {ramQuantity === 2 ? "2x Sticks (Dual-Channel) · Uses dimm-a1 & dimm-b1" : "1x Stick (Single-Channel)"}
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setRamQuantity(1)}
              style={{
                padding: "0.35rem 0.75rem",
                borderRadius: "6px",
                fontSize: "0.75rem",
                fontWeight: 700,
                background: ramQuantity === 1 ? "#2563eb" : "#1e293b",
                color: "#ffffff",
                border: ramQuantity === 1 ? "1px solid #38bdf8" : "1px solid #334155",
                cursor: "pointer",
              }}
            >
              1 Stick
            </button>
            <button
              type="button"
              onClick={() => setRamQuantity(2)}
              style={{
                padding: "0.35rem 0.75rem",
                borderRadius: "6px",
                fontSize: "0.75rem",
                fontWeight: 700,
                background: ramQuantity === 2 ? "#2563eb" : "#1e293b",
                color: "#ffffff",
                border: ramQuantity === 2 ? "1px solid #38bdf8" : "1px solid #334155",
                cursor: "pointer",
              }}
            >
              2 Sticks (Dual)
            </button>
          </div>
        </div>
      )}

      {/* DIAGRAMS TAB */}
      {activeTab === "DIAGRAMS" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.85rem",
            background: "#111827",
            padding: "0.85rem",
            borderRadius: "10px",
            border: "1px solid #1e293b",
            overflowWrap: "break-word",
            wordBreak: "break-word",
          }}
        >
          <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setSelectedDiagramSize("120")}
              style={{
                padding: "0.35rem 0.75rem",
                borderRadius: "6px",
                background: selectedDiagramSize === "120" ? "#2563eb" : "#1e293b",
                color: "#ffffff",
                fontSize: "0.76rem",
                fontWeight: 700,
                border: "1px solid #334155",
                cursor: "pointer",
              }}
            >
              120mm Fan Diagram
            </button>
            <button
              type="button"
              onClick={() => setSelectedDiagramSize("140")}
              style={{
                padding: "0.35rem 0.75rem",
                borderRadius: "6px",
                background: selectedDiagramSize === "140" ? "#2563eb" : "#1e293b",
                color: "#ffffff",
                fontSize: "0.76rem",
                fontWeight: 700,
                border: "1px solid #334155",
                cursor: "pointer",
              }}
            >
              140mm Fan Diagram
            </button>
            <button
              type="button"
              onClick={() => setSelectedDiagramSize("160")}
              style={{
                padding: "0.35rem 0.75rem",
                borderRadius: "6px",
                background: selectedDiagramSize === "160" ? "#2563eb" : "#1e293b",
                color: "#ffffff",
                fontSize: "0.76rem",
                fontWeight: 700,
                border: "1px solid #334155",
                cursor: "pointer",
              }}
            >
              160mm Fan Diagram
            </button>
            <button
              type="button"
              onClick={() => setSelectedDiagramSize("AIO")}
              style={{
                padding: "0.35rem 0.75rem",
                borderRadius: "6px",
                background: selectedDiagramSize === "AIO" ? "#059669" : "#1e293b",
                color: "#ffffff",
                fontSize: "0.76rem",
                fontWeight: 700,
                border: "1px solid #059669",
                cursor: "pointer",
              }}
            >
              AIO Liquid Cooler Schematic
            </button>
          </div>

          {selectedDiagramSize === "120" && (
            <div style={{ padding: "0.65rem", background: "#0c1320", borderRadius: "8px", border: "1px solid #1e3a8a" }}>
              <div style={{ fontWeight: 800, color: "#60a5fa", fontSize: "0.88rem" }}>120mm Fan Technical Diagram</div>
              <div style={{ fontSize: "0.76rem", color: "#cbd5e1", marginTop: "0.4rem", lineHeight: "1.5" }}>
                • Frame Size: <strong>120 × 120 × 25 mm</strong><br />
                • Mounting Hole Spacing: <strong>105 × 105 mm</strong> (Ø 4.3mm screw pitch)<br />
                • Rated Speed: <strong>2000 RPM (PWM)</strong> · Airflow: <strong>60 CFM</strong><br />
                • Static Pressure: <strong>2.34 mm H2O</strong> · Noise Level: <strong>22.6 dBA</strong><br />
                • Impeller: <strong>9 Aerodynamic High-Pressure Blades</strong>
              </div>
            </div>
          )}

          {selectedDiagramSize === "140" && (
            <div style={{ padding: "0.65rem", background: "#0c1320", borderRadius: "8px", border: "1px solid #1e3a8a" }}>
              <div style={{ fontWeight: 800, color: "#60a5fa", fontSize: "0.88rem" }}>140mm Fan Technical Diagram</div>
              <div style={{ fontSize: "0.76rem", color: "#cbd5e1", marginTop: "0.4rem", lineHeight: "1.5" }}>
                • Frame Size: <strong>140 × 140 × 25 mm</strong><br />
                • Mounting Hole Spacing: <strong>125 × 125 mm</strong> (Ø 4.3mm screw pitch)<br />
                • Rated Speed: <strong>1600 RPM (PWM)</strong> · Airflow: <strong>85 CFM</strong><br />
                • Static Pressure: <strong>2.80 mm H2O</strong> · Noise Level: <strong>24.2 dBA</strong><br />
                • Impeller: <strong>7 Extended Sweep Flow Blades</strong>
              </div>
            </div>
          )}

          {selectedDiagramSize === "160" && (
            <div style={{ padding: "0.65rem", background: "#0c1320", borderRadius: "8px", border: "1px solid #1e3a8a" }}>
              <div style={{ fontWeight: 800, color: "#60a5fa", fontSize: "0.88rem" }}>160mm Large Intake Fan Technical Diagram</div>
              <div style={{ fontSize: "0.76rem", color: "#cbd5e1", marginTop: "0.4rem", lineHeight: "1.5" }}>
                • Frame Size: <strong>160 × 160 × 30 mm</strong><br />
                • Mounting Hole Spacing: <strong>140 × 140 mm</strong> (Chassis Ring Mount)<br />
                • Rated Speed: <strong>1400 RPM (PWM)</strong> · Airflow: <strong>110 CFM</strong><br />
                • Static Pressure: <strong>3.42 mm H2O</strong> · Noise Level: <strong>26.8 dBA</strong><br />
                • Impeller: <strong>High-Volume Dual-Ball Bearing Impeller</strong>
              </div>
            </div>
          )}

          {selectedDiagramSize === "AIO" && (
            <div style={{ padding: "0.65rem", background: "#0c1320", borderRadius: "8px", border: "1px solid #047857" }}>
              <div style={{ fontWeight: 800, color: "#34d399", fontSize: "0.88rem" }}>AIO Closed-Loop Liquid Cooling Schematic</div>
              <div style={{ fontSize: "0.76rem", color: "#cbd5e1", marginTop: "0.4rem", lineHeight: "1.5" }}>
                • <strong>Radiator</strong>: 120 / 240 / 360 × 120 × 30mm Aluminum Dual-Pass Matrix<br />
                • <strong>Coolant Tubes</strong>: Dual 400mm Low-Permeation Braided EPDM Sleeved Rubber Tubes<br />
                • <strong>Water Pump Unit</strong>: 2800 RPM 3-Phase Ceramic Bearing Pump (80×80×55mm)<br />
                • <strong>Cold Plate</strong>: 55×55mm High-Density Micro-Skived Pure Copper Base<br />
                • <strong>Connectors</strong>: 4-Pin PWM Pump Header + 3-Pin ARGB 5V Sync
              </div>
            </div>
          )}
        </div>
      )}

      {/* Prominent Component Cards List */}
      {activeTab !== "DIAGRAMS" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            maxHeight: "600px",
            overflowY: "auto",
            paddingRight: "0.25rem",
          }}
        >
          {componentsInTab.map((comp) => {
            const installedMount = installedMap.get(comp.id);
            const isInstalled = !!installedMount;
            const compatibleMounts = getCompatibleMountsForComponent(comp);
            const selectedTargetMount = selectedMounts[comp.id] || compatibleMounts.find((m) => !occupiedMounts.has(m)) || compatibleMounts[0];
            const fanConfig = state.fanConfigs.find((c) => c.componentId === comp.id);
            const clearanceFit = selectedTargetMount ? checkClearanceFit(comp, selectedTargetMount) : { fits: true, reason: "" };

            return (
              <div
                key={comp.id}
                style={{
                  padding: "0.85rem",
                  borderRadius: "10px",
                  border: isInstalled
                    ? (!clearanceFit.fits ? "1px solid #ef4444" : "1px solid #38bdf8")
                    : (!clearanceFit.fits ? "1px solid #7f1d1d" : "1px solid #1e293b"),
                  background: isInstalled
                    ? (!clearanceFit.fits ? "rgba(127, 29, 29, 0.3)" : "rgba(30, 58, 138, 0.35)")
                    : "#111a2b",
                  boxShadow: isInstalled ? "0 2px 10px rgba(56, 189, 248, 0.2)" : "none",
                  overflowWrap: "break-word",
                  wordBreak: "break-word",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "0.4rem",
                  }}
                >
                  <div style={{ flex: "1 1 200px", minWidth: "0" }}>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: "0.88rem",
                        lineHeight: 1.35,
                        color: !clearanceFit.fits && isInstalled ? "#fca5a5" : "#f8fafc",
                        overflowWrap: "break-word",
                        wordBreak: "break-word",
                      }}
                    >
                      {comp.name}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#94a3b8",
                        marginTop: "0.3rem",
                        display: "flex",
                        gap: "0.4rem",
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          background: "#0c1320",
                          padding: "0.15rem 0.45rem",
                          borderRadius: "4px",
                          border: "1px solid #1e293b",
                          overflowWrap: "break-word",
                          wordBreak: "break-word",
                        }}
                      >
                        📐 {comp.dimensions.width}×{comp.dimensions.height}×{comp.dimensions.depth} mm
                      </span>
                      {comp.power?.consumption ? (
                        <span
                          style={{
                            background: "#0c1320",
                            padding: "0.15rem 0.45rem",
                            borderRadius: "4px",
                            border: "1px solid #1e293b",
                            color: "#f59e0b",
                            overflowWrap: "break-word",
                            wordBreak: "break-word",
                          }}
                        >
                          ⚡ {comp.power.consumption}W
                        </span>
                      ) : null}
                      {comp.power?.capacity ? (
                        <span
                          style={{
                            background: "#0c1320",
                            padding: "0.15rem 0.45rem",
                            borderRadius: "4px",
                            border: "1px solid #1e293b",
                            color: "#10b981",
                            overflowWrap: "break-word",
                            wordBreak: "break-word",
                          }}
                        >
                          🔋 {comp.power.capacity}W Capacity
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: "0.72rem",
                      padding: "0.2rem 0.55rem",
                      borderRadius: "5px",
                      background: isInstalled
                        ? (!clearanceFit.fits ? "#7f1d1d" : "#1e40af")
                        : (!clearanceFit.fits ? "#450a0a" : "#1f2937"),
                      color: isInstalled
                        ? (!clearanceFit.fits ? "#fca5a5" : "#93c5fd")
                        : (!clearanceFit.fits ? "#f87171" : "#94a3b8"),
                      fontWeight: 800,
                      alignSelf: "flex-start",
                      overflowWrap: "break-word",
                      wordBreak: "break-word",
                      maxWidth: "100%",
                    }}
                  >
                    {isInstalled
                      ? (!clearanceFit.fits ? `⚠️ Overfill: ${installedMount}` : `✓ ${installedMount}`)
                      : (!clearanceFit.fits ? "⚠️ Inapplicable" : "Available")}
                  </span>
                </div>

                {!clearanceFit.fits && (
                  <div
                    style={{
                      fontSize: "0.74rem",
                      color: "#fca5a5",
                      background: "rgba(220, 38, 38, 0.2)",
                      padding: "0.35rem 0.6rem",
                      borderRadius: "6px",
                      marginTop: "0.45rem",
                      border: "1px solid rgba(239, 68, 68, 0.4)",
                      fontWeight: 600,
                      lineHeight: 1.4,
                      overflowWrap: "break-word",
                      wordBreak: "break-word",
                    }}
                  >
                    ⚠️ {clearanceFit.reason}
                  </div>
                )}

                {/* RAM Dual-Channel Kit Action */}
                {activeTab === "RAM" && ramQuantity === 2 ? (
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.65rem", flexWrap: "wrap" }}>
                    {!isDualRamInstalled ? (
                      <button
                        type="button"
                        onClick={handleInstallRamDual}
                        style={{
                          flex: "1 1 180px",
                          padding: "0.45rem 0.9rem",
                          borderRadius: "7px",
                          background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                          color: "#ffffff",
                          fontWeight: 800,
                          fontSize: "0.78rem",
                          border: "none",
                          cursor: "pointer",
                          boxShadow: "0 2px 8px rgba(37, 99, 235, 0.35)",
                          overflowWrap: "break-word",
                          wordBreak: "break-word",
                        }}
                      >
                        ⚡ Install 2x Sticks (Dual-Channel Kit)
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRemoveRamDual}
                        style={{
                          flex: "1 1 180px",
                          padding: "0.45rem 0.9rem",
                          borderRadius: "7px",
                          background: "#7f1d1d",
                          color: "#fecaca",
                          fontWeight: 700,
                          fontSize: "0.78rem",
                          border: "1px solid #dc2626",
                          cursor: "pointer",
                          overflowWrap: "break-word",
                          wordBreak: "break-word",
                        }}
                      >
                        Remove Dual-Channel Kit (2x Sticks)
                      </button>
                    )}
                  </div>
                ) : (
                  /* Standard Mount Target Selector & Action Row */
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      alignItems: "center",
                      marginTop: "0.65rem",
                      flexWrap: "wrap",
                      width: "100%",
                    }}
                  >
                    {!isInstalled ? (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flex: "1 1 140px", minWidth: "120px" }}>
                          <label style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, whiteSpace: "nowrap" }}>Mount:</label>
                          <select
                            value={selectedTargetMount || ""}
                            onChange={(e) => setSelectedMounts({ ...selectedMounts, [comp.id]: e.target.value })}
                            style={{
                              flex: "1",
                              minWidth: "0",
                              padding: "0.35rem 0.5rem",
                              borderRadius: "6px",
                              background: "#1e293b",
                              color: "#f8fafc",
                              border: "1px solid #334155",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                            }}
                          >
                            {compatibleMounts.map((m) => (
                              <option key={m} value={m}>
                                {m} {occupiedMounts.has(m) ? "(Occupied)" : "(Free)"}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleInstall(comp.id)}
                          disabled={compatibleMounts.length === 0 || occupiedMounts.has(selectedTargetMount)}
                          style={{
                            flex: "1 1 130px",
                            padding: "0.45rem 0.8rem",
                            borderRadius: "7px",
                            background: !occupiedMounts.has(selectedTargetMount)
                              ? (!clearanceFit.fits ? "#dc2626" : "linear-gradient(135deg, #2563eb, #1d4ed8)")
                              : "#334155",
                            color: "#ffffff",
                            fontWeight: 800,
                            fontSize: "0.78rem",
                            border: "none",
                            cursor: !occupiedMounts.has(selectedTargetMount) ? "pointer" : "not-allowed",
                            boxShadow: !occupiedMounts.has(selectedTargetMount) ? "0 2px 8px rgba(37, 99, 235, 0.35)" : "none",
                            overflowWrap: "break-word",
                            wordBreak: "break-word",
                          }}
                        >
                          {!clearanceFit.fits ? "Install (Collision)" : "Install Part"}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRemove(comp.id)}
                          style={{
                            flex: "1 1 90px",
                            padding: "0.45rem 0.75rem",
                            borderRadius: "7px",
                            background: "#7f1d1d",
                            color: "#fecaca",
                            fontWeight: 700,
                            fontSize: "0.78rem",
                            border: "1px solid #dc2626",
                            cursor: "pointer",
                            overflowWrap: "break-word",
                            wordBreak: "break-word",
                          }}
                        >
                          Remove
                        </button>

                        {compatibleMounts.length > 1 && (
                          <select
                            value={selectedMounts[comp.id] || installedMount}
                            onChange={(e) => handleMove(comp.id, e.target.value)}
                            style={{
                              flex: "1 1 140px",
                              minWidth: "120px",
                              padding: "0.35rem 0.5rem",
                              borderRadius: "6px",
                              background: "#1e293b",
                              color: "#f8fafc",
                              border: "1px solid #334155",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                            }}
                          >
                            {compatibleMounts.map((m) => (
                              <option key={m} value={m} disabled={occupiedMounts.has(m) && m !== installedMount}>
                                Move: {m} {m === installedMount ? "(Current)" : occupiedMounts.has(m) ? "(Occupied)" : "(Free)"}
                              </option>
                            ))}
                          </select>
                        )}
                      </>
                    )}

                    {/* Direction Toggle for Fans */}
                    {isInstalled && comp.type === "FAN" && (
                      <button
                        type="button"
                        onClick={() => handleToggleFan(comp.id)}
                        style={{
                          flex: "1 1 120px",
                          padding: "0.45rem 0.75rem",
                          borderRadius: "6px",
                          background: fanConfig?.direction === "EXHAUST" ? "#7f1d1d" : "#065f46",
                          color: "#ffffff",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          border: "1px solid #334155",
                          cursor: "pointer",
                          overflowWrap: "break-word",
                          wordBreak: "break-word",
                        }}
                      >
                        {fanConfig?.direction === "EXHAUST" ? "🔥 Exhaust Flow" : "❄️ Intake Flow"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Live Status / Error Messages */}
      {statusMessage && (
        <div
          style={{
            marginTop: "0.7rem",
            padding: "0.5rem 0.75rem",
            borderRadius: "6px",
            background: "rgba(16, 185, 129, 0.18)",
            border: "1px solid #10b981",
            color: "#6ee7b7",
            fontSize: "0.76rem",
            fontWeight: 700,
            lineHeight: 1.4,
            overflowWrap: "break-word",
            wordBreak: "break-word",
          }}
        >
          ✅ {statusMessage}
        </div>
      )}
      {errorMessage && (
        <div
          style={{
            marginTop: "0.7rem",
            padding: "0.5rem 0.75rem",
            borderRadius: "6px",
            background: "rgba(239, 68, 68, 0.18)",
            border: "1px solid #ef4444",
            color: "#fca5a5",
            fontSize: "0.76rem",
            fontWeight: 700,
            lineHeight: 1.4,
            overflowWrap: "break-word",
            wordBreak: "break-word",
          }}
        >
          ❌ {errorMessage}
        </div>
      )}
    </section>
  );
}