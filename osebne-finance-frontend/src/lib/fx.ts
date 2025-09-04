import { get } from './api';

type RateMap = Record<string, number>;
const cache = new Map<string, RateMap>();

function key(base: string, symbols: string[], date?: string) {
  return `${base}|${symbols.sort().join(',')}|${date || ''}`;
}

export async function getRates(base: string, symbols: string[], date?: string): Promise<RateMap> {
  const k = key(base, symbols, date);
  if (cache.has(k)) return cache.get(k)!;
  const params = new URLSearchParams({ base, symbols: symbols.join(',') });
  if (date) params.set('date', date);
  const data = await get(`/fx?${params.toString()}`);
  cache.set(k, data.rates || data);
  return cache.get(k)!;
}

export async function convert(amount: number, from: string, to: string, date?: string) {
  if (from === to) return amount;
  const rates = await getRates(from, [to], date);
  const r = rates[to];
  if (!r) throw new Error(`Tečaj ${from}->${to} ni na voljo.`);
  return amount * r;
}
