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
                // Set default from and to if possible
                if (fxList.length > 0) {
                    setFromCurrency(fxList[0].base);
                    setToCurrency(fxList[0].quote);
                }
            } catch {
                // ignore errors or handle as needed
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
        // find rate for selected pair
        const rateObj = rates.find(r => r.base === fromCurrency && r.quote === toCurrency);
        if (rateObj) {
            setResult(+(amt * rateObj.rate).toFixed(4));
        } else {
            // If no direct rate, try inverse or set null
            const inverse = rates.find(r => r.base === toCurrency && r.quote === fromCurrency);
            if (inverse) {
                setResult(+(amt / inverse.rate).toFixed(4));
            } else {
                setResult(null);
            }
        }
    }, [amount, fromCurrency, toCurrency, rates]);

    // derive list of unique currencies from rates
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
