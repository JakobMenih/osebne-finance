import { useEffect, useState } from 'react';
import { getFxRates, type FxRate } from '../lib/api';

export default function FxConverter() {
    const [rates, setRates] = useState<FxRate[]>([]);
    const [fromCurrency, setFromCurrency] = useState('');
    const [toCurrency, setToCurrency] = useState('');
    const [amount, setAmount] = useState('');
    const [result, setResult] = useState<number | null>(null);

    useEffect(() => {
        const loadRates = async () => {
            try {
                const fxList = await getFxRates();
                setRates(fxList);
                if (fxList.length > 0) {
                    setFromCurrency(fxList[0].base);
                    setToCurrency(fxList[0].quote);
                }
            } catch {
            }
        };
        loadRates();
    }, []);

    useEffect(() => {
        if (!amount || !fromCurrency || !toCurrency) {
            setResult(null);
            return;
        }
        const amt = parseFloat(amount);
        if (isNaN(amt)) {
            setResult(null);
            return;
        }
        const baseCurrency = 'EUR';
        if (fromCurrency === toCurrency) {
            setResult(+(amt.toFixed(4)));
        } else {
            const direct = rates.find(r => r.base === fromCurrency && r.quote === toCurrency);
            if (direct) {
                setResult(+(amt * direct.rate).toFixed(4));
            } else {
                const inverse = rates.find(r => r.base === toCurrency && r.quote === fromCurrency);
                if (inverse) {
                    setResult(+(amt / inverse.rate).toFixed(4));
                } else {
                    let fromToBaseRate: number | null = null;
                    let baseToTargetRate: number | null = null;
                    if (fromCurrency === baseCurrency) {
                        fromToBaseRate = 1;
                    } else {
                        const baseToFrom = rates.find(r => r.base === baseCurrency && r.quote === fromCurrency);
                        if (baseToFrom) {
                            fromToBaseRate = 1 / baseToFrom.rate;
                        }
                    }
                    if (toCurrency === baseCurrency) {
                        baseToTargetRate = 1;
                    } else {
                        const baseToTo = rates.find(r => r.base === baseCurrency && r.quote === toCurrency);
                        if (baseToTo) {
                            baseToTargetRate = baseToTo.rate;
                        }
                    }
                    if (fromToBaseRate != null && baseToTargetRate != null) {
                        setResult(+(amt * fromToBaseRate * baseToTargetRate).toFixed(4));
                    } else {
                        setResult(null);
                    }
                }
            }
        }
    }, [amount, fromCurrency, toCurrency, rates]);

    const currencyOptions = Array.from(new Set(rates.flatMap(r => [r.base, r.quote])));

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Pretvornik valut</h2>
            <div className="flex items-center gap-2 mb-4">
                <select
                    value={fromCurrency}
                    onChange={e => setFromCurrency(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1"
                >
                    {currencyOptions.map(cur => (
                        <option key={cur} value={cur}>{cur}</option>
                    ))}
                </select>
                <span className="px-2">→</span>
                <select
                    value={toCurrency}
                    onChange={e => setToCurrency(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1"
                >
                    {currencyOptions.map(cur => (
                        <option key={cur} value={cur}>{cur}</option>
                    ))}
                </select>
                <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="Znesek"
                    className="border border-gray-300 rounded px-2 py-1 w-32"
                />
            </div>
            {result !== null && (
                <div>
                    Rezultat: <strong>{result}</strong> {toCurrency}
                </div>
            )}
        </div>
    );
}
