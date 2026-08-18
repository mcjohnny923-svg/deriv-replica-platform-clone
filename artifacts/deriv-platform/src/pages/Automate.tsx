import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import DerivHeader from '@/components/DerivHeader';
import DerivSidebar from '@/components/DerivSidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  TRADE_TYPES,
  needsDigitSelector,
  DIGITS,
  assetToMarketInfo,
  directionFor,
} from '@/lib/trade-config';
import { getStoredAccount, updateStoredAccountBalance } from '@/lib/auth-api';
import { buyTrade, getTradeHistory, type Trade } from '@/lib/trades-api';

type Strategy = 'martingale' | 'dalembert' | 'oscars_grind';

const CHOICES_BY_TYPE: Record<string, [string, string]> = {
  rise_fall: ['rise', 'fall'],
  higher_lower: ['rise', 'fall'],
  touch_notouch: ['rise', 'fall'],
  in_out: ['rise', 'fall'],
  matches_differs: ['matches', 'differs'],
  even_odd: ['even', 'odd'],
  over_under: ['over', 'under'],
};

const Automate = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [balanceRefreshKey, setBalanceRefreshKey] = useState(0);

  const [selectedAsset] = useState('Volatility 75 Index');
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

  const [isRunning, setIsRunning] = useState(false);
  const [runningPL, setRunningPL] = useState(0);
  const [tradesRun, setTradesRun] = useState(0);
  const [currentStake, setCurrentStake] = useState('2');

  const runningRef = useRef(false);

  const digitSelector = needsDigitSelector(tradeType);
  const choices = CHOICES_BY_TYPE[tradeType] ?? ['rise', 'fall'];

  const bumpBalanceRefresh = () => setBalanceRefreshKey((k) => k + 1);

  const waitForSettlement = useCallback(async (tradeId: number, accountId: number): Promise<Trade | null> => {
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      const { closedTrades } = await getTradeHistory(accountId);
      const settled = closedTrades.find((t) => t.id === tradeId);
      if (settled) return settled;
    }
    return null;
  }, []);

  const nextStakeAfterLoss = (current: number): number => {
    const multiplier = parseFloat(stakeMultiplier) || 2;
    const unit = parseFloat(baseStake) || 1;
    if (strategy === 'martingale') return current * multiplier;
    if (strategy === 'dalembert') return current + unit;
    return parseFloat(baseStake);
  };

  const nextStakeAfterWin = (current: number): number => {
    const unit = parseFloat(baseStake) || 1;
    if (strategy === 'dalembert') return Math.max(unit, current - unit);
    if (strategy === 'oscars_grind') return current + unit;
    return parseFloat(baseStake);
  };

  const runLoop = useCallback(async () => {
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
    setCurrentStake(stake.toFixed(2));

    while (runningRef.current) {
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

      // Deduct stake from displayed balance immediately
      updateStoredAccountBalance(placed.newBalance);
      bumpBalanceRefresh();

      const settled = await waitForSettlement(placed.trade.id, account.id);
      if (!settled || !runningRef.current) break;

      const won = settled.status === 'won';
      const profit = won ? Number(settled.payout ?? 0) - Number(settled.stake) : -Number(settled.stake);
      cumulativePL += profit;
      count += 1;
      setRunningPL(cumulativePL);
      setTradesRun(count);

      // Balance already credited server-side on win — refresh header to show it
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
    }

    runningRef.current = false;
    setIsRunning(false);
  }, [
    baseStake, maxStake, selectedAsset, choiceIndex, choices, tradeType, digitSelector,
    selectedDigit, durationValue, durationUnit, waitForSettlement, profitThreshold, lossThreshold, strategy, stakeMultiplier,
  ]);

  const handleRun = () => {
    if (isRunning) {
      runningRef.current = false;
      setIsRunning(false);
      toast('Stopped by user.');
      return;
    }
    setRunningPL(0);
    setTradesRun(0);
    runningRef.current = true;
    setIsRunning(true);
    runLoop();
  };

  return (
    <div className="h-screen bg-[#0e0e0e] text-white flex flex-col overflow-hidden">
      <DerivHeader onMenuClick={() => setIsSidebarOpen(true)} balanceRefreshKey={balanceRefreshKey} />
      <div className="flex flex-1 overflow-hidden">
        <DerivSidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto pb-4">
            <div className="max-w-lg mx-auto p-4 space-y-4">
              {isRunning && (
                <div className="bg-[#151717] border border-[#323738] rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <div className="text-xs text-gray-400">Running P/L ({tradesRun} trades)</div>
                    <div className={`text-lg font-bold ${runningPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {runningPL >= 0 ? '+' : ''}{runningPL.toFixed(2)} USD
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Current stake</div>
                    <div className="text-white font-medium">USD {currentStake}</div>
                  </div>
                </div>
              )}

              <div className="bg-[#151717] border border-[#323738] rounded-lg divide-y divide-[#323738]">
                <div className="p-4">
                  <label className="block text-sm text-gray-300 mb-2">Trade type</label>
                  <Select value={tradeType} onValueChange={setTradeType} disabled={isRunning}>
                    <SelectTrigger className="bg-[#323738] border-[#414647] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#323738] border-[#414647]">
                      {TRADE_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value} className="text-white hover:bg-[#414647]">
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4">
                  <label className="block text-sm text-gray-300 mb-2">Direction</label>
                  <div className="grid grid-cols-2 gap-2">
                    {choices.map((choice, idx) => (
                      <button
                        key={choice}
                        disabled={isRunning}
                        onClick={() => setChoiceIndex(idx)}
                        className={`py-2 rounded border text-sm font-medium capitalize disabled:opacity-50 ${
                          choiceIndex === idx
                            ? 'bg-red-600 border-red-500 text-white'
                            : 'bg-[#323738] border-[#414647] text-gray-300'
                        }`}
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                </div>

                {digitSelector && (
                  <div className="p-4">
                    <label className="block text-sm text-gray-300 mb-2">Digit</label>
                    <div className="grid grid-cols-5 gap-2">
                      {DIGITS.map((d) => (
                        <button
                          key={d}
                          disabled={isRunning}
                          onClick={() => setSelectedDigit(d)}
                          className={`py-2 rounded border text-sm font-medium disabled:opacity-50 ${
                            selectedDigit === d
                              ? 'bg-red-600 border-red-500 text-white'
                              : 'bg-[#323738] border-[#414647] text-gray-300'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-4">
                  <label className="block text-sm text-gray-300 mb-1">Duration</label>
                  <Input
                    type="number"
                    value={durationValue}
                    onChange={(e) => setDurationValue(e.target.value)}
                    disabled={isRunning}
                    className="bg-[#323738] border-[#414647] text-white"
                  />
                  <div className="text-xs text-gray-500 mt-1">ticks</div>
                </div>

                <div className="p-4">
                  <label className="block text-sm text-gray-300 mb-1">Base stake</label>
                  <Input
                    type="number"
                    value={baseStake}
                    onChange={(e) => setBaseStake(e.target.value)}
                    disabled={isRunning}
                    className="bg-[#323738] border-[#414647] text-white"
                  />
                  <div className="text-xs text-gray-500 mt-1">USD</div>
                </div>

                <div className="p-4 flex items-center justify-between">
                  <span className="text-sm text-gray-300">Allow equals</span>
                  <Switch checked={allowEquals} onCheckedChange={setAllowEquals} disabled={isRunning} />
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-300 px-1 mb-2">Strategy parameters</div>
                <div className="bg-[#151717] border border-[#323738] rounded-lg divide-y divide-[#323738]">
                  <div className="p-4">
                    <label className="block text-sm text-gray-300 mb-2">Strategy</label>
                    <Select value={strategy} onValueChange={(v) => setStrategy(v as Strategy)} disabled={isRunning}>
                      <SelectTrigger className="bg-[#323738] border-[#414647] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#323738] border-[#414647]">
                        <SelectItem value="martingale" className="text-white hover:bg-[#414647]">Martingale</SelectItem>
                        <SelectItem value="dalembert" className="text-white hover:bg-[#414647]">D'Alembert</SelectItem>
                        <SelectItem value="oscars_grind" className="text-white hover:bg-[#414647]">Oscar's Grind</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {strategy === 'martingale' && (
                    <div className="p-4">
                      <label className="block text-sm text-gray-300 mb-1">Stake multiplier</label>
                      <Input
                        type="number"
                        value={stakeMultiplier}
                        onChange={(e) => setStakeMultiplier(e.target.value)}
                        disabled={isRunning}
                        className="bg-[#323738] border-[#414647] text-white"
                      />
                      <div className="text-xs text-gray-500 mt-1">×{stakeMultiplier || '2'} after a loss, resets after a win</div>
                    </div>
                  )}

                  {strategy === 'dalembert' && (
                    <div className="p-4 text-xs text-gray-400">
                      Increases stake by the base stake amount after a loss, decreases by the same amount after a win (never below base stake).
                    </div>
                  )}

                  {strategy === 'oscars_grind' && (
                    <div className="p-4 text-xs text-gray-400">
                      Keeps stake flat after a loss, increases by the base stake amount after a win.
                    </div>
                  )}

                  <div className="p-4">
                    <label className="block text-sm text-gray-300 mb-1">Max stake</label>
                    <Input
                      type="number"
                      value={maxStake}
                      onChange={(e) => setMaxStake(e.target.value)}
                      disabled={isRunning}
                      placeholder="No limit"
                      className="bg-[#323738] border-[#414647] text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-300 px-1 mb-2">Risk management</div>
                <div className="bg-[#151717] border border-[#323738] rounded-lg divide-y divide-[#323738]">
                  <div className="p-4">
                    <label className="block text-sm text-gray-300 mb-1">Profit threshold</label>
                    <Input
                      type="number"
                      value={profitThreshold}
                      onChange={(e) => setProfitThreshold(e.target.value)}
                      disabled={isRunning}
                      className="bg-[#323738] border-[#414647] text-white"
                    />
                    <div className="text-xs text-gray-500 mt-1">USD — stops when cumulative profit reaches this</div>
                  </div>
                  <div className="p-4">
                    <label className="block text-sm text-gray-300 mb-1">Loss threshold</label>
                    <Input
                      type="number"
                      value={lossThreshold}
                      onChange={(e) => setLossThreshold(e.target.value)}
                      disabled={isRunning}
                      className="bg-[#323738] border-[#414647] text-white"
                    />
                    <div className="text-xs text-gray-500 mt-1">USD — stops when cumulative loss reaches this</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Run button, always visible above the bottom nav */}
          <div className="shrink-0 p-4 border-t border-[#323738] bg-[#0e0e0e]">
            <Button
              onClick={handleRun}
              className={`w-full py-6 text-base font-semibold ${
                isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isRunning ? 'Stop' : 'Run'}
            </Button>
          </div>
        </div>
      </div>
      <MobileBottomNav onMenuClick={() => setIsSidebarOpen(true)} />
    </div>
  );
};

export default Automate;
