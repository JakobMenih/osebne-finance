export function formatDateSL(d: string | Date) {
    const x = typeof d === "string" ? new Date(d) : d;
    const dd = String(x.getDate()).padStart(2, "0");
    const mm = String(x.getMonth() + 1).padStart(2, "0");
    const yyyy = x.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}
export function todayISO() {
    const x = new Date();
    return x.toISOString().slice(0, 10);
}
