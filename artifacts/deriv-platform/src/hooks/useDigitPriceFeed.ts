import { useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '@/lib/api-config';
import { assetToMarketInfo } from '@/lib/trade-config';

const HISTORY_LENGTH = 1000;

function randomDigit() {
  return Math.floor(Math.random() * 10);
}

export interface DigitPriceFeed {
  price: number;
  priceChange: number;
  lastDigit: number;
  digitHistory: number[];
}

// Polls the backend's live price for the selected asset every second.
// This is the same value the backend uses to settle digit-contract trades,
// so what the user watches ticking on screen is exactly what determines
// their trade outcomes - no separate client-side random simulation.
export function useDigitPriceFeed(assetName: string, fallbackBase = 12547.89): DigitPriceFeed {
  const lastPriceRef = useRef(fallbackBase);
  const [price, setPrice] = useState(fallbackBase);
  const [priceChange, setPriceChange] = useState(0);
  const [digitHistory, setDigitHistory] = useState<number[]>(() =>
    Array.from({ length: HISTORY_LENGTH }, randomDigit),
  );
  const [lastDigit, setLastDigit] = useState<number>(digitHistory[digitHistory.length - 1]);

  useEffect(() => {
    let cancelled = false;
    const { symbol } = assetToMarketInfo(assetName);

    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/markets/tick?symbol=${encodeURIComponent(symbol)}`);
        if (!res.ok) return;
        const data: { price: number; digit: number; digitHistory: number[] } = await res.json();
        if (cancelled) return;

        const prevPrice = lastPriceRef.current;
        lastPriceRef.current = data.price;
        setPrice(data.price);
        setPriceChange(data.price - prevPrice);
        setLastDigit(data.digit);
        // Backend owns the rolling history for this asset - replace our
        // buffer with it entirely so switching assets shows the correct
        // distribution immediately, instead of slowly drifting from
        // whatever the previously selected asset's buffer looked like.
        setDigitHistory(data.digitHistory);
      } catch {
        // Network hiccup - keep showing the last known value, try again next tick.
      }
    };

    poll();
    const interval = setInterval(poll, 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [assetName]);

  return { price, priceChange, lastDigit, digitHistory };
}
