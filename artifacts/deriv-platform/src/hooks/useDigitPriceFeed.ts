import { useEffect, useRef, useState } from 'react';

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

// One shared "live price" generator per asset. Ticks every second, and the
// hundredths-place digit of the price (matching what's displayed, e.g.
// 12545.97 -> 7) drives both the price readout and the digit stats circles,
// so they always agree with each other.
export function useDigitPriceFeed(seedKey: string, basePrice = 12547.89): DigitPriceFeed {
  const priceRef = useRef(basePrice);
  const [price, setPrice] = useState(basePrice);
  const [priceChange, setPriceChange] = useState(0);
  const [digitHistory, setDigitHistory] = useState<number[]>(() =>
    Array.from({ length: HISTORY_LENGTH }, randomDigit),
  );
  const [lastDigit, setLastDigit] = useState<number>(digitHistory[digitHistory.length - 1]);

  // Reseed when the selected asset changes
  useEffect(() => {
    const seeded = basePrice + (Math.random() - 0.5) * 200;
    priceRef.current = seeded;
    setPrice(seeded);
    setDigitHistory(Array.from({ length: HISTORY_LENGTH }, randomDigit));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedKey]);

  useEffect(() => {
    const interval = setInterval(() => {
      const change = (Math.random() - 0.5) * 3;
      const newPrice = Math.max(0, priceRef.current + change);
      priceRef.current = newPrice;
      setPrice(newPrice);
      setPriceChange(change);

      const cents = Math.round(newPrice * 100);
      const digit = Math.abs(cents % 10);
      setLastDigit(digit);
      setDigitHistory((prev) => [...prev.slice(1), digit]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return { price, priceChange, lastDigit, digitHistory };
}
