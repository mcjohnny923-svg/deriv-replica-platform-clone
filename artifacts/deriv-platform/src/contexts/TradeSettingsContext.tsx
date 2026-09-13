import { createContext, useContext, useState, type ReactNode } from 'react';

interface TradeSettingsState {
  selectedAsset: string;
  setSelectedAsset: (v: string) => void;
  tradeType: string;
  setTradeType: (v: string) => void;
  selectedDigit: number;
  setSelectedDigit: (v: number) => void;
  stake: string;
  setStake: (v: string) => void;
  duration: string;
  setDuration: (v: string) => void;
  durationType: string;
  setDurationType: (v: string) => void;
}

const TradeSettingsContext = createContext<TradeSettingsState | null>(null);

// Lives above the router, so Dashboard's chosen trade type/asset/stake/etc.
// survive navigating away and back (SPA route changes don't unmount this
// provider). A full page reload still resets it, since it's just in-memory
// React state, not persisted to storage - that's the intended behavior.
export function TradeSettingsProvider({ children }: { children: ReactNode }) {
  const [selectedAsset, setSelectedAsset] = useState('Volatility 75 Index');
  const [tradeType, setTradeType] = useState('rise_fall');
  const [selectedDigit, setSelectedDigit] = useState(5);
  const [stake, setStake] = useState('10');
  const [duration, setDuration] = useState('1');
  const [durationType, setDurationType] = useState('t');

  return (
    <TradeSettingsContext.Provider
      value={{
        selectedAsset, setSelectedAsset,
        tradeType, setTradeType,
        selectedDigit, setSelectedDigit,
        stake, setStake,
        duration, setDuration,
        durationType, setDurationType,
      }}
    >
      {children}
    </TradeSettingsContext.Provider>
  );
}

export function useTradeSettings(): TradeSettingsState {
  const ctx = useContext(TradeSettingsContext);
  if (!ctx) {
    throw new Error('useTradeSettings must be used within a TradeSettingsProvider');
  }
  return ctx;
}
