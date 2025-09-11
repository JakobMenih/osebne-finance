import { useAuth } from "@/store/auth";

export default function Amount({ value }: { value: number }) {
    const { user } = useAuth();
    const show = user?.showAmounts ?? true;
    const curr = user?.defaultCurrency || "EUR";
    if (!show) return <span>****</span>;
    const f = new Intl.NumberFormat(undefined, { style: "currency", currency: curr, maximumFractionDigits: 2 });
    return <span>{f.format(value)}</span>;
}
