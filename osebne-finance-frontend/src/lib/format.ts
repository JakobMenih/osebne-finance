export const currencySymbols: Record<string, string> = {
    EUR: "€",
    USD: "$",
    GBP: "£",
    CHF: "CHF",
    JPY: "¥",
    HRK: "€",
    RSD: "дин",
    BAM: "KM",
    HUF: "Ft",
    PLN: "zł",
    CZK: "Kč",
    DKK: "kr",
    SEK: "kr",
    NOK: "kr",
    AUD: "A$",
    CAD: "C$",
    CNY: "¥",
};

export function money(value: number, currency: string) {
    const sym = currencySymbols[currency] || currency;
    const n = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    return `${n} ${sym}`;
}
