import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import { toast } from 'sonner';
import {
  needsDigitSelector,
  isDigitContract,
  getOutcomeDigit,
  assetToMarketInfo,
  directionFor,
} from '@/lib/trade-config';
import { getStoredAccount, updateStoredAccountBalance } from '@/lib/auth-api';
import { buyTrade, getTradeHistory, type Trade } from '@/lib/trades-api';
import type { ScannerLaunchConfig } from '@/components/EntryScannerModal';
import type { DigitFlashEvent } from '@/components/DigitStatsDisplay';

export type Strategy = 'martingale' | 'dalembert' | 'oscars_grind' | 'flat';

export const CHOICES_BY_TYPE: Record<string, [string, string]> = {
  rise_fall: ['rise', 'fall'],
  higher_lower: ['rise', 'fall'],
  touch_notouch: ['rise', 'fall'],
  in_out: ['rise', 'fall'],
  matches_differs: ['matches', 'differs'],
  even_odd: ['even', 'odd'],
  over_under: ['over', 'under'],
};

interface BotEngineState {
  selectedAsset: string;
  setSelectedAsset: (v: string) => void;
  tradeType: string;
  setTradeType: (v: string) => void;
  choiceIndex: number;
  setChoiceIndex: (v: number) => void;
  selectedDigit: number;
  setSelectedDigit: (v: number) => void;
  durationValue: string;
  setDurationValue: (v: string) => void;
  durationUnit: 't' | 's' | 'm';
  baseStake: string;
  setBaseStake: (v: string) => void;
  allowEquals: boolean;
  setAllowEquals: (v: boolean) => void;

  strategy: Strategy;
  setStrategy: (v: Strategy) => void;
  stakeMultiplier: string;
  setStakeMultiplier: (v: string) => void;
  maxStake: string;
  setMaxStake: (v: string) => void;
  profitThreshold: string;
  setProfitThreshold: (v: string) => void;
  lossThreshold: string;
  setLossThreshold: (v: string) => void;
  winsTarget: number;
  setWinsTarget: (v: number) => void;

  isRunning: boolean;
  runningPL: number;
  tradesRun: number;
  currentStake: string;
  totalStake: number;
  totalPayout: number;
  contractsWon: number;
  contractsLost: number;
  digitFlash: DigitFlashEvent | null;

  balanceRefreshKey: number;

  digitSelector: boolean;
  digitFlashEligible: boolean;
  choices: [string, string];

  handleRun: () => void;
  handleResetStats: () => void;
  applyScannerLaunch: (config: ScannerLaunchConfig) => void;
}

const BotEngineContext = createContext<BotEngineState | null>(null);

// Lives above the router so the bot loop, its running state, and its
// accumulated stats survive navigating away from and back to the Automate
// page - previously all of this lived in the page component's local state
// and was wiped out on unmount, making a still-running bot look "stopped"
// the moment you left the page.
export function BotEngineProvider({ children }: { children: ReactNode }) {
  const [selectedAsset, setSelectedAsset] = useState('Volatility 75 Index');
  const [tradeType, setTradeType] = useState('rise_fall');
  const [choiceIndex, setChoiceIndex] = useState(0);
  const [selectedDigit, setSelectedDigit] = useState(5);
  const [durationValue, setDurationValue] = useState('5');
  const [durationUnit] = useState<'t' | 's' | 'm'>('t');
  const [baseStake, setBaseStake] = useState('2');
  const [allowEquals, setAllowEquals] = useState(false);

  const [strategy, setStrategy] = useState<Strategy>('martingale');
  const [stakeMultiplier, setStakeMultiplier] = useState('2');
  const [maxStake, setMaxStake] = useState('');
  const [profitThreshold, setProfitThreshold] = useState('10');
  const [lossThreshold, setLossThreshold] = useState('10');
  const [winsTarget, setWinsTarget] = useState(0);

  const [isRunning, setIsRunning] = useState(false);
  const [runningPL, setRunningPL] = useState(0);
  const [tradesRun, setTradesRun] = useState(0);
  const [currentStake, setCurrentStake] = useState('2');
  const [totalStake, setTotalStake] = useState(0);
  const [totalPayout, setTotalPayout] = useState(0);
  const [contractsWon, setContractsWon] = useState(0);
  const [contractsLost, setContractsLost] = useState(0);
  const [digitFlash, setDigitFlash] = useState<DigitFlashEvent | null>(null);
  const [pendingAutoStart, setPendingAutoStart] = useState(false);
  const [balanceRefreshKey, setBalanceRefreshKey] = useState(0);

  const runningRef = useRef(false);
  const runGenerationRef = useRef(0);

  const digitSelector = needsDigitSelector(tradeType);
  const digitFlashEligible = isDigitContract(tradeType);
  const choices = CHOICES_BY_TYPE[tradeType] ?? ['rise', 'fall'];

  const bumpBalanceRefresh = () => setBalanceRefreshKey((k) => k + 1);

  const waitForSettlement = useCallback(async (tradeId: number, accountId: number): Promise<Trade | null> => {
    for (let i = 0; i < 180; i++) {
      await new Promise((r) => setTimeout(r, 500));
      const { closedTrades } = await getTradeHistory(accountId);
      const settled = closedTrades.find((t) => t.id === tradeId);
      if (settled) return settled;
    }
    return null;
  }, []);

  const nextStakeAfterLoss = (current: number): number => {
    const multiplier = parseFloat(stakeMultiplier) || 2;
    const unit = parseFloat(baseStake) || 1;
    if (strategy === 'flat') return unit;
    if (strategy === 'martingale') return current * multiplier;
    if (strategy === 'dalembert') return current + unit;
    return parseFloat(baseStake);
  };

  const nextStakeAfterWin = (current: number): number => {
    const unit = parseFloat(baseStake) || 1;
    if (strategy === 'flat') return unit;
    if (strategy === 'dalembert') return Math.max(unit, current - unit);
    if (strategy === 'oscars_grind') return current + unit;
    return parseFloat(baseStake);
  };

  const runLoop = useCallback(async (myGeneration: number) => {
    const account = getStoredAccount();
    if (!account) {
      toast.error('Please log in first.');
      setIsRunning(false);
      runningRef.current = false;
      return;
    }

    let stake = parseFloat(baseStake) || 1;
    let cumulativePL = 0;
    let count = 0;
    let winsCount = 0;
    let stakeSum = 0;
    let payoutSum = 0;
    let wonCount = 0;
    let lostCount = 0;
    setCurrentStake(stake.toFixed(2));

    while (runningRef.current && runGenerationRef.current === myGeneration) {
      const cap = parseFloat(maxStake);
      if (cap && stake > cap) {
        toast.error('Max stake reached, stopping.');
        break;
      }

      const { symbol, category } = assetToMarketInfo(selectedAsset);
      const choice = choices[choiceIndex];
      const direction = directionFor(tradeType, choice);

      let placed;
      try {
        placed = await buyTrade({
          accountId: account.id,
          marketSymbol: symbol,
          marketDisplayName: selectedAsset,
          marketCategory: category,
          tradeType,
          direction,
          digit: digitSelector ? selectedDigit : undefined,
          stake,
          durationValue: parseFloat(durationValue) || 1,
          durationUnit,
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Trade failed, stopping.');
        break;
      }

      updateStoredAccountBalance(placed.newBalance);
      bumpBalanceRefresh();
      stakeSum += stake;
      setTotalStake(stakeSum);

      const settled = await waitForSettlement(placed.trade.id, account.id);
      if (!settled || !runningRef.current || runGenerationRef.current !== myGeneration) break;

      const won = settled.status === 'won';
      const profit = won ? Number(settled.payout ?? 0) - Number(settled.stake) : -Number(settled.stake);
      cumulativePL += profit;
      count += 1;
      if (won) winsCount += 1;
      setRunningPL(cumulativePL);
      setTradesRun(count);

      if (digitFlashEligible) {
        const outcomeDigit = getOutcomeDigit(settled.exitPrice);
        if (outcomeDigit !== null) {
          setDigitFlash({ digit: outcomeDigit, won, key: Date.now() });
        }
      }

      if (won) {
        wonCount += 1;
        payoutSum += Number(settled.payout ?? 0);
      } else {
        lostCount += 1;
      }
      setContractsWon(wonCount);
      setContractsLost(lostCount);
      setTotalPayout(payoutSum);

      bumpBalanceRefresh();

      stake = won ? nextStakeAfterWin(stake) : nextStakeAfterLoss(stake);
      setCurrentStake(stake.toFixed(2));

      const profitCap = parseFloat(profitThreshold);
      const lossCap = parseFloat(lossThreshold);
      if (profitCap && cumulativePL >= profitCap) {
        toast.success(`Profit threshold reached: +${cumulativePL.toFixed(2)} USD`);
        break;
      }
      if (lossCap && cumulativePL <= -lossCap) {
        toast.error(`Loss threshold reached: ${cumulativePL.toFixed(2)} USD`);
        break;
      }
      if (winsTarget && winsCount >= winsTarget) {
        toast.success(`Target of ${winsTarget} wins reached.`);
        break;
      }
    }

    if (runGenerationRef.current === myGeneration) {
      runningRef.current = false;
      setIsRunning(false);
    }
  }, [
    baseStake, maxStake, selectedAsset, choiceIndex, choices, tradeType, digitSelector,
    selectedDigit, durationValue, durationUnit, waitForSettlement, profitThreshold, lossThreshold,
    strategy, stakeMultiplier, winsTarget, digitFlashEligible,
  ]);

  const handleRun = useCallback(() => {
    if (isRunning) {
      runGenerationRef.current += 1;
      runningRef.current = false;
      setIsRunning(false);
      toast('Stopped by user.');
      return;
    }
    setRunningPL(0);
    setTradesRun(0);
    setTotalStake(0);
    setTotalPayout(0);
    setContractsWon(0);
    setContractsLost(0);
    const myGeneration = ++runGenerationRef.current;
    runningRef.current = true;
    setIsRunning(true);
    runLoop(myGeneration);
  }, [isRunning, runLoop]);

  const handleResetStats = () => {
    runGenerationRef.current += 1;
    runningRef.current = false;
    setIsRunning(false);
    setRunningPL(0);
    setTradesRun(0);
    setTotalStake(0);
    setTotalPayout(0);
    setContractsWon(0);
    setContractsLost(0);
    setCurrentStake(baseStake);
  };

  useEffect(() => {
    if (pendingAutoStart) {
      setPendingAutoStart(false);
      handleRun();
    }
  }, [pendingAutoStart, handleRun]);

  const applyScannerLaunch = (config: ScannerLaunchConfig) => {
    if (isRunning) {
      toast.error('Stop the current bot before launching a new one.');
      return;
    }
    setSelectedAsset(config.asset);
    setTradeType(config.tradeType);
    setChoiceIndex(config.choiceIndex);
    if (config.digit !== undefined) setSelectedDigit(config.digit);
    setBaseStake(config.stake.toFixed(2));
    setStrategy(config.useMartingale ? 'martingale' : 'flat');
    setStakeMultiplier(config.martingaleMultiplier.toString());
    setWinsTarget(config.winsTarget);
    setProfitThreshold(config.profitTarget.toString());
    setLossThreshold(config.stopLoss.toString());
    setMaxStake('');

    if (config.autoStart) {
      setPendingAutoStart(true);
      toast.success('Deep Scanner Bot launched.');
    } else {
      toast.success('Deep Scanner settings loaded — review and press Run.');
    }
  };

  return (
    <BotEngineContext.Provider
      value={{
        selectedAsset, setSelectedAsset,
        tradeType, setTradeType,
        choiceIndex, setChoiceIndex,
        selectedDigit, setSelectedDigit,
        durationValue, setDurationValue,
        durationUnit,
        baseStake, setBaseStake,
        allowEquals, setAllowEquals,
        strategy, setStrategy,
        stakeMultiplier, setStakeMultiplier,
        maxStake, setMaxStake,
        profitThreshold, setProfitThreshold,
        lossThreshold, setLossThreshold,
        winsTarget, setWinsTarget,
        isRunning, runningPL, tradesRun, currentStake,
        totalStake, totalPayout, contractsWon, contractsLost, digitFlash,
        balanceRefreshKey,
        digitSelector, digitFlashEligible, choices,
        handleRun, handleResetStats, applyScannerLaunch,
      }}
    >
      {children}
    </BotEngineContext.Provider>
  );
}

export function useBotEngine(): BotEngineState {
  const ctx = useContext(BotEngineContext);
  if (!ctx) {
    throw new Error('useBotEngine must be used within a BotEngineProvider');
  }
  return ctx;
}
