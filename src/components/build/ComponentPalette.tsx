import { useState, useMemo } from "react";
import { useBuildStore } from "../../store/buildStore";
import { getActiveCaseProfile } from "../../domain/cases/getActiveCase";
import { componentRegistry } from "../../domain/data/components";
import { getCompatibleMountCandidates } from "../../domain/interaction/getCompatibleMounts";
import { installComponent } from "../../domain/commands/installComponent";
import { removeComponent } from "../../domain/commands/removeComponent";
import { moveComponent } from "../../domain/commands/moveComponent";
import { setFanDirection } from "../../domain/commands/setFanDirection";
import type { ComponentDefinition } from "../../domain/types/component";
import { useLanguage } from "../../i18n/LanguageContext";
import { commitDomainActions } from "../../domain/commands/commitDomainAction";
import { useTimeoutQueue } from "../useTimeoutQueue";
import { CatalogTabs, type TabCategory } from "./CatalogTabs";


export function ComponentPalette() {
  const { t, componentName, categoryName, caseName } = useLanguage();
  const state = useBuildStore((s) => s);
  const activeProfile = useMemo(() => getActiveCaseProfile(state), [state]);
  const [activeTab, setActiveTab] = useState<TabCategory>("GPU");
  const [selectedMounts, setSelectedMounts] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedDiagramSize, setSelectedDiagramSize] = useState<"120" | "140" | "160" | "AIO">("120");
  const [ramQuantity, setRamQuantity] = useState<1 | 2>(2);
  const schedule = useTimeoutQueue();

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
    return getCompatibleMountCandidates({
      componentId: component.id,
      currentMountId: installedMap.get(component.id) ?? "",
      state,
      caseProfile: activeProfile,
    }).map((candidate) => candidate.mountId);
  };

  const checkClearanceFit = (component: ComponentDefinition, mountId: string) => {
    const limit = activeProfile.clearanceLimits?.[mountId];
    if (!limit) return { fits: true, reason: "" };

    if (limit.maxDepth && component.dimensions.depth > limit.maxDepth) {
      return {
        fits: false,
        reason: t("clearance.depth", { value: component.dimensions.depth, max: limit.maxDepth }),
        excessMm: component.dimensions.depth - limit.maxDepth,
      };
    }
    if (limit.maxWidth && component.dimensions.width > limit.maxWidth) {
      return {
        fits: false,
        reason: t("clearance.width", { value: component.dimensions.width, max: limit.maxWidth }),
        excessMm: component.dimensions.width - limit.maxWidth,
      };
    }
    if (limit.maxHeight && component.dimensions.height > limit.maxHeight) {
      return {
        fits: false,
        reason: t("clearance.height", { value: component.dimensions.height, max: limit.maxHeight }),
        excessMm: component.dimensions.height - limit.maxHeight,
      };
    }
    return { fits: true, reason: "" };
  };

  const handleInstall = (componentId: string) => {
    const component = componentRegistry[componentId];
    if (!component) return;

    const availableMounts = getCompatibleMountsForComponent(component);
    const selectedMount = selectedMounts[componentId];
    const targetMount = selectedMount && availableMounts.includes(selectedMount)
      ? selectedMount
      : availableMounts.find((m) => !occupiedMounts.has(m)) ?? availableMounts[0];

    if (!targetMount) {
      setErrorMessage(t("catalog.noMount", { component: componentName(component.id, component.name), case: caseName(activeProfile.label) }));
      return;
    }

    try {
      installComponent({ componentId, mountId: targetMount });
      const fit = checkClearanceFit(component, targetMount);
      if (!fit.fits) {
        setStatusMessage(t("catalog.installedWarning", { component: componentName(component.id, component.name), reason: fit.reason }));
      } else {
        setStatusMessage(t("catalog.installed", { component: componentName(component.id, component.name), mount: targetMount }));
      }
      setErrorMessage(null);
      schedule(() => setStatusMessage(null), 4000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setStatusMessage(null);
      schedule(() => setErrorMessage(null), 4000);
    }
  };

  const handleInstallRamDual = () => {
    try {
      const actions = [];
      if (!occupiedMounts.has("dimm-a1")) actions.push({ type: "INSTALL_COMPONENT" as const, componentId: "ram-01", mountId: "dimm-a1" });
      if (!occupiedMounts.has("dimm-b1") && activeProfile.supportedMountIds.includes("dimm-b1")) actions.push({ type: "INSTALL_COMPONENT" as const, componentId: "ram-02", mountId: "dimm-b1" });
      commitDomainActions(actions, "Installed dual-channel RAM kit");
      setStatusMessage(t("catalog.ramInstalled"));
      setErrorMessage(null);
      schedule(() => setStatusMessage(null), 3000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setStatusMessage(null);
      schedule(() => setErrorMessage(null), 4000);
    }
  };

  const handleRemoveRamDual = () => {
    try {
      const actions = ["ram-01", "ram-02", "ram-03"]
        .filter((componentId) => installedMap.has(componentId))
        .map((componentId) => ({ type: "REMOVE_COMPONENT" as const, componentId }));
      commitDomainActions(actions, "Removed RAM kit");
      setStatusMessage(t("catalog.ramRemoved"));
      setErrorMessage(null);
      schedule(() => setStatusMessage(null), 3000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setStatusMessage(null);
      schedule(() => setErrorMessage(null), 4000);
    }
  };

  const handleRemove = (componentId: string) => {
    try {
      removeComponent({ componentId });
      setStatusMessage(t("catalog.removed", { component: componentName(componentId, componentRegistry[componentId]?.name ?? componentId) }));
      setErrorMessage(null);
      schedule(() => setStatusMessage(null), 3000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setStatusMessage(null);
      schedule(() => setErrorMessage(null), 4000);
    }
  };

  const handleMove = (componentId: string, targetMount: string) => {
    try {
      moveComponent({ componentId, mountId: targetMount });
      setStatusMessage(t("catalog.moved", { component: componentName(componentId, componentRegistry[componentId]?.name ?? componentId), mount: targetMount }));
      setErrorMessage(null);
      schedule(() => setStatusMessage(null), 3000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setStatusMessage(null);
      schedule(() => setErrorMessage(null), 4000);
    }
  };

  const handleToggleFan = (componentId: string) => {
    const currentCfg = state.fanConfigs.find((c) => c.componentId === componentId);
    const nextDir = currentCfg?.direction === "EXHAUST" ? "INTAKE" : "EXHAUST";
    setFanDirection({ componentId, direction: nextDir });
  };

  return (
    <section
      className="catalog-panel"
      aria-label={t("catalog.aria")}
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
        className="catalog-heading"
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
          {t("catalog.title")}
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
          {t("catalog.profile", { profile: caseName(activeProfile.formFactor) })}
        </span>
      </div>

      <CatalogTabs
        active={activeTab}
        onChange={setActiveTab}
        label={t("catalog.categories")}
        categoryName={categoryName}
      />

      {/* RAM QUANTITY & DUAL CHANNEL SELECTOR HEADER */}
      {activeTab === "RAM" && (
        <div
          className="ram-config"
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
            <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#60a5fa" }}>{t("catalog.ramConfig")}</span>
            <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "0.1rem" }}>
              {ramQuantity === 2 ? t("catalog.ramDual") : t("catalog.ramSingle")}
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
              {t("catalog.oneStick")}
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
              {t("catalog.twoSticks")}
            </button>
          </div>
        </div>
      )}

      {/* DIAGRAMS TAB */}
      {activeTab === "DIAGRAMS" && (
        <div
          role="tabpanel"
          id="catalog-panel-DIAGRAMS"
          aria-labelledby="catalog-tab-DIAGRAMS"
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
              {t("diagram.fan", { size: 120 })}
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
              {t("diagram.fan", { size: 140 })}
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
              {t("diagram.fan", { size: 160 })}
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
              {t("diagram.aio")}
            </button>
          </div>

          {selectedDiagramSize === "120" && (
            <div style={{ padding: "0.65rem", background: "#0c1320", borderRadius: "8px", border: "1px solid #1e3a8a" }}>
              <div style={{ fontWeight: 800, color: "#60a5fa", fontSize: "0.88rem" }}>{t("diagram.fanTitle", { size: 120 })}</div>
              <div style={{ fontSize: "0.76rem", color: "#cbd5e1", marginTop: "0.4rem", lineHeight: "1.5" }}>
                • {t("diagram.frame")}: <strong>120 × 120 × 25 mm</strong><br />
                • {t("diagram.spacing")}: <strong>105 × 105 mm</strong> (Ø 4.3mm)<br />
                • {t("diagram.speed")}: <strong>2000 RPM (PWM)</strong> · {t("diagram.airflow")}: <strong>60 CFM</strong><br />
                • {t("diagram.pressure")}: <strong>2.34 mm H2O</strong> · {t("diagram.noise")}: <strong>22.6 dBA</strong><br />
                • {t("diagram.impeller")}: <strong>{t("diagram.impeller120")}</strong>
              </div>
            </div>
          )}

          {selectedDiagramSize === "140" && (
            <div style={{ padding: "0.65rem", background: "#0c1320", borderRadius: "8px", border: "1px solid #1e3a8a" }}>
              <div style={{ fontWeight: 800, color: "#60a5fa", fontSize: "0.88rem" }}>{t("diagram.fanTitle", { size: 140 })}</div>
              <div style={{ fontSize: "0.76rem", color: "#cbd5e1", marginTop: "0.4rem", lineHeight: "1.5" }}>
                • {t("diagram.frame")}: <strong>140 × 140 × 25 mm</strong><br />
                • {t("diagram.spacing")}: <strong>125 × 125 mm</strong> (Ø 4.3mm)<br />
                • {t("diagram.speed")}: <strong>1600 RPM (PWM)</strong> · {t("diagram.airflow")}: <strong>85 CFM</strong><br />
                • {t("diagram.pressure")}: <strong>2.80 mm H2O</strong> · {t("diagram.noise")}: <strong>24.2 dBA</strong><br />
                • {t("diagram.impeller")}: <strong>{t("diagram.impeller140")}</strong>
              </div>
            </div>
          )}

          {selectedDiagramSize === "160" && (
            <div style={{ padding: "0.65rem", background: "#0c1320", borderRadius: "8px", border: "1px solid #1e3a8a" }}>
              <div style={{ fontWeight: 800, color: "#60a5fa", fontSize: "0.88rem" }}>{t("diagram.fan160Title")}</div>
              <div style={{ fontSize: "0.76rem", color: "#cbd5e1", marginTop: "0.4rem", lineHeight: "1.5" }}>
                • {t("diagram.frame")}: <strong>160 × 160 × 30 mm</strong><br />
                • {t("diagram.spacing")}: <strong>140 × 140 mm</strong><br />
                • {t("diagram.speed")}: <strong>1400 RPM (PWM)</strong> · {t("diagram.airflow")}: <strong>110 CFM</strong><br />
                • {t("diagram.pressure")}: <strong>3.42 mm H2O</strong> · {t("diagram.noise")}: <strong>26.8 dBA</strong><br />
                • {t("diagram.impeller")}: <strong>{t("diagram.impeller160")}</strong>
              </div>
            </div>
          )}

          {selectedDiagramSize === "AIO" && (
            <div style={{ padding: "0.65rem", background: "#0c1320", borderRadius: "8px", border: "1px solid #047857" }}>
              <div style={{ fontWeight: 800, color: "#34d399", fontSize: "0.88rem" }}>{t("diagram.aioTitle")}</div>
              <div style={{ fontSize: "0.76rem", color: "#cbd5e1", marginTop: "0.4rem", lineHeight: "1.5" }}>
                • <strong>{t("diagram.radiator")}</strong>: {t("diagram.radiatorSpec")}<br />
                • <strong>{t("diagram.tubes")}</strong>: {t("diagram.tubesSpec")}<br />
                • <strong>{t("diagram.pump")}</strong>: {t("diagram.pumpSpec")}<br />
                • <strong>{t("diagram.coldPlate")}</strong>: {t("diagram.coldPlateSpec")}<br />
                • <strong>{t("diagram.connectors")}</strong>: {t("diagram.connectorsSpec")}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Prominent Component Cards List */}
      {activeTab !== "DIAGRAMS" && (
        <div
          className="catalog-list"
          role="tabpanel"
          id={`catalog-panel-${activeTab}`}
          aria-labelledby={`catalog-tab-${activeTab}`}
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
            const selectedMount = selectedMounts[comp.id];
            const selectedTargetMount = selectedMount && compatibleMounts.includes(selectedMount)
              ? selectedMount
              : compatibleMounts.find((m) => !occupiedMounts.has(m)) ?? compatibleMounts[0];
            const fanConfig = state.fanConfigs.find((c) => c.componentId === comp.id);
            const clearanceFit = selectedTargetMount ? checkClearanceFit(comp, selectedTargetMount) : { fits: true, reason: "" };

            return (
              <div
                key={comp.id}
                className={`component-card${isInstalled ? " is-installed" : ""}${!clearanceFit.fits ? " has-warning" : ""}`}
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
                      {componentName(comp.id, comp.name)}
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
                        {comp.dimensions.width}×{comp.dimensions.height}×{comp.dimensions.depth} mm
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
                          {comp.power.consumption}W
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
                          {comp.power.capacity}W {t("catalog.capacity")}
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
                      ? (!clearanceFit.fits ? t("catalog.overfill", { mount: installedMount }) : `✓ ${installedMount}`)
                      : (!clearanceFit.fits ? t("catalog.inapplicable") : t("catalog.available"))}
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
                {activeTab === "RAM" && ramQuantity === 2 && comp.id === "ram-01" ? (
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
                        {t("catalog.installDual")}
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
                        {t("catalog.removeDual")}
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
                          <label style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, whiteSpace: "nowrap" }}>{t("catalog.mount")}</label>
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
                                {m} ({occupiedMounts.has(m) ? t("catalog.occupied") : t("catalog.free")})
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleInstall(comp.id)}
                          disabled={compatibleMounts.length === 0 || occupiedMounts.has(selectedTargetMount) || !clearanceFit.fits}
                          style={{
                            flex: "1 1 130px",
                            padding: "0.45rem 0.8rem",
                            borderRadius: "7px",
                            background: !occupiedMounts.has(selectedTargetMount) && clearanceFit.fits
                              ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
                              : "#334155",
                            color: "#ffffff",
                            fontWeight: 800,
                            fontSize: "0.78rem",
                            border: "none",
                            cursor: !occupiedMounts.has(selectedTargetMount) && clearanceFit.fits ? "pointer" : "not-allowed",
                            boxShadow: !occupiedMounts.has(selectedTargetMount) && clearanceFit.fits ? "0 2px 8px rgba(37, 99, 235, 0.35)" : "none",
                            overflowWrap: "break-word",
                            wordBreak: "break-word",
                          }}
                        >
                          {!clearanceFit.fits ? t("catalog.installCollision") : t("catalog.install")}
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
                          {t("catalog.remove")}
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
                                {t("catalog.move")}: {m} ({m === installedMount ? t("catalog.current") : occupiedMounts.has(m) ? t("catalog.occupied") : t("catalog.free")})
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
                        {fanConfig?.direction === "EXHAUST" ? t("catalog.exhaust") : t("catalog.intake")}
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
          {statusMessage}
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
          {errorMessage}
        </div>
      )}
    </section>
  );
}
