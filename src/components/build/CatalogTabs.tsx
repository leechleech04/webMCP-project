import type { ReactNode } from "react";

export type TabCategory = "GPU" | "RADIATOR" | "FAN" | "MOTHERBOARD" | "CPU" | "RAM" | "STORAGE" | "PSU" | "DIAGRAMS";

const categories: Array<{ id: TabCategory; label: string }> = [
  { id: "GPU", label: "Graphics" }, { id: "RADIATOR", label: "Liquid Cooler" },
  { id: "FAN", label: "Fans & Air" }, { id: "MOTHERBOARD", label: "Motherboard" },
  { id: "CPU", label: "CPU" }, { id: "RAM", label: "Memory (RAM)" },
  { id: "STORAGE", label: "Storage" }, { id: "PSU", label: "Power Supply" },
  { id: "DIAGRAMS", label: "Diagrams" },
];

function CategoryIcon({ category }: { category: TabCategory }) {
  const paths: Record<TabCategory, ReactNode> = {
    GPU: <><rect x="3" y="6" width="18" height="12" rx="3" /><circle cx="9" cy="12" r="3" /><path d="M15 10h3M15 14h2M7 18v2M11 18v2" /></>,
    RADIATOR: <><rect x="4" y="3" width="16" height="18" rx="3" /><circle cx="12" cy="9" r="3.5" /><circle cx="12" cy="16" r="2.5" /></>,
    FAN: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="1.5" /><path d="M12 10c-1-4 1-6 3-5 2 2 1 5-3 7M14 12c4-1 6 1 5 3-2 2-5 1-7-3M12 14c1 4-1 6-3 5-2-2-1-5 3-7M10 12c-4 1-6-1-5-3 2-2 5-1 7 3" /></>,
    MOTHERBOARD: <><rect x="4" y="3" width="16" height="18" rx="2" /><rect x="8" y="7" width="7" height="7" rx="1" /><path d="M8 17h8M18 7v5M6 7v3" /></>,
    CPU: <><rect x="6" y="6" width="12" height="12" rx="2" /><rect x="9" y="9" width="6" height="6" rx="1" /><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" /></>,
    RAM: <><rect x="3" y="7" width="18" height="10" rx="2" /><path d="M7 10v4M11 10v4M15 10v4M18 10v4M7 17v2M11 17v2M15 17v2" /></>,
    STORAGE: <><rect x="5" y="3" width="14" height="18" rx="2" /><circle cx="12" cy="8" r="2" /><path d="M8 15h8M8 18h5" /></>,
    PSU: <><rect x="3" y="5" width="18" height="14" rx="3" /><circle cx="10" cy="12" r="4" /><path d="M16 10h2M16 14h2M10 8v8M6 12h8" /></>,
    DIAGRAMS: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5M9 12h6M9 16h6" /></>,
  };
  return <svg className="category-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[category]}</svg>;
}

export function CatalogTabs({ active, onChange, label, categoryName }: {
  active: TabCategory;
  onChange: (category: TabCategory) => void;
  label: string;
  categoryName: (id: string, fallback: string) => string;
}) {
  return (
    <div className="catalog-tabs" role="tablist" aria-label={label}>
      {categories.map((category) => {
        const selected = active === category.id;
        return (
          <button key={category.id} type="button" role="tab" id={`catalog-tab-${category.id}`} aria-selected={selected} aria-controls={`catalog-panel-${category.id}`} onClick={() => onChange(category.id)}>
            <span className="category-icon-wrap"><CategoryIcon category={category.id} /></span>
            <span>{categoryName(category.id, category.label)}</span>
          </button>
        );
      })}
    </div>
  );
}
