export function hidden(): boolean { return localStorage.getItem('hideAmounts') === '1'; }
export function toggleHidden(): void {
    const v = hidden() ? '0' : '1';
    localStorage.setItem('hideAmounts', v);
    window.dispatchEvent(new Event('hide-amounts'));
}
export function fmtAmount(n: number, min = 2, max = 2) {
    return n.toLocaleString(undefined, { minimumFractionDigits: min, maximumFractionDigits: max });
}
