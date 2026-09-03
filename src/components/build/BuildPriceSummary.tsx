import { useEffect, useMemo, useState } from "react";
import { derivePriceSummary } from "../../domain/pricing/priceSummary";
import { fetchLivePrices, type LivePriceMap } from "../../domain/pricing/livePriceClient";
import { componentRegistry, getProductId } from "../../domain/data/components";
import type { ComponentDefinition } from "../../domain/types/component";
import { useLanguage } from "../../i18n/LanguageContext";
import { formatCurrency } from "../../i18n/formatCurrency";
import { useBuildStore } from "../../store/buildStore";

export function BuildPriceSummary() {
  const { language, t } = useLanguage();
  const state = useBuildStore((value) => value);
  const [livePrices, setLivePrices] = useState<LivePriceMap>({});
  const installedProducts = useMemo(() => [...new Set(state.placements.map((placement) => placement.productId ?? getProductId(placement.componentId)))]
    .map((productId) => componentRegistry[productId]).filter((product): product is ComponentDefinition => Boolean(product)), [state.placements]);
  const endpoint = import.meta.env.VITE_PRICE_API_URL as string | undefined;

  useEffect(() => {
    if (!endpoint || installedProducts.length === 0) {
      setLivePrices({});
      return;
    }
    const controller = new AbortController();
    void fetchLivePrices(installedProducts, endpoint, controller.signal).then(setLivePrices).catch((error) => {
      if (!controller.signal.aborted) console.warn("Live prices unavailable; using catalog estimates.", error);
    });
    return () => controller.abort();
  }, [endpoint, installedProducts]);

  const summary = useMemo(() => derivePriceSummary(state, undefined, livePrices), [state, livePrices]);

  return (
    <section className="price-summary" aria-labelledby="price-summary-title">
      <div className="build-actions-heading">
        <h3 id="price-summary-title">{t("price.title")}</h3>
        <span>{summary.selectedLines.length}</span>
      </div>
      <dl className="price-summary-values">
        <div>
          <dt>{t("price.selected")}</dt>
          <dd>{formatCurrency(summary.selectedTotal, language)}</dd>
        </div>
        <div>
          <dt>{summary.projectedMissingProducts.length > 0 ? t("price.completion") : t("price.estimatedPc")}</dt>
          <dd>{formatCurrency(summary.completionEstimate, language)}</dd>
        </div>
      </dl>
      {summary.projectedMissingProducts.length > 0 && (
        <p>{t("price.missing", { count: summary.projectedMissingProducts.length })}</p>
      )}
      <small>
        {summary.allLive ? t("price.live") : t("price.estimate")}
        {summary.updatedAt ? ` · ${summary.updatedAt}` : ""}
      </small>
    </section>
  );
}
