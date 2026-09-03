import type { Language } from "./LanguageContext";

export const KRW_PER_USD = 1_400;

export const formatCurrency = (amountKrw: number, language: Language) => {
  if (language === "en") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amountKrw / KRW_PER_USD);
  }

  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amountKrw);
};
