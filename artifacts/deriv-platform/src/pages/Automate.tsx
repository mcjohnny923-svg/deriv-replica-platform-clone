import { useState } from 'react';
import DerivHeader from '@/components/DerivHeader';
import DerivSidebar from '@/components/DerivSidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { TRADE_TYPES, DIGITS } from '@/lib/trade-config';
import EntryScannerModal from '@/components/EntryScannerModal';
import DigitStatsDisplay from '@/components/DigitStatsDisplay';
import { useDigitPriceFeed } from '@/hooks/useDigitPriceFeed';
import { useBotEngine, type Strategy } from '@/contexts/BotEngineContext';

const VOLATILITY_ASSETS = [
  'Volatility 10 Index',
  'Volatility 25 Index',
  'Volatility 50 Index',
  'Volatility 75 Index',
  'Volatility 100 Index',
  'Volatility 10 (1s) Index',
  'Volatility 15 (1s) Index',
  'Volatility 25 (1s) Index',
  'Volatility 30 (1s) Index',
  'Volatility 50 (1s) Index',
  'Volatility 75 (1s) Index',
  'Volatility 90 (1s) Index',
  'Volatility 100 (1s) Index',
];

const Automate = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const {
    selectedAsset, setSelectedAsset,
    tradeType, setTradeType,
    choiceIndex, setChoiceIndex,
    selectedDigit, setSelectedDigit,
    durationValue, setDurationValue,
    baseStake, setBaseStake,
    allowEquals, setAllowEquals,
    strategy, setStrategy,
    stakeMultiplier, setStakeMultiplier,
    maxStake, setMaxStake,
    profitThreshold, setProfitThreshold,
    lossThreshold, setLossThreshold,
    isRunning, runningPL, tradesRun, currentStake,
    totalStake, totalPayout, contractsWon, contractsLost, digitFlash,
    balanceRefreshKey,
    digitSelector, digitFlashEligible, choices,
    handleRun, handleResetStats, applyScannerLaunch,
  } = useBotEngine();

  const priceFeed = useDigitPriceFeed(selectedAsset);

  return (
    <div className="h-[100dvh] bg-gray-50 dark:bg-[#0e0e0e] text-gray-900 dark:text-white flex flex-col overflow-hidden">
      <DerivHeader onMenuClick={() => setIsSidebarOpen(true)} balanceRefreshKey={balanceRefreshKey} />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <DerivSidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden pb-16 md:pb-0">
          {/* Scrollable content */}
          <div className="flex-1 min-h-0 overflow-y-auto pb-4">
            <div className="max-w-lg md:max-w-5xl mx-auto md:mx-0 p-4 space-y-3 md:space-y-0 flex flex-col md:grid md:grid-cols-3 md:gap-3 md:items-start">
              {isRunning && (
                <div className="md:col-span-3 bg-white dark:bg-[#151717] border border-gray-200 dark:border-[#323738] rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400">Running P/L ({tradesRun} trades)</div>
                    <div className={`text-lg font-bold ${runningPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {runningPL >= 0 ? '+' : ''}{runningPL.toFixed(2)} USD
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400">Current stake</div>
                    <div className="text-gray-900 dark:text-white font-medium">USD {currentStake}</div>
                  </div>
                </div>
              )}

              <div className="order-2 md:order-none md:col-start-1 md:row-start-2">
                <DigitStatsDisplay
                  selectedDigit={digitSelector ? selectedDigit : null}
                  flash={digitFlashEligible ? digitFlash : null}
                  digitHistory={priceFeed.digitHistory}
                  lastDigit={priceFeed.lastDigit}
                  desktopTwoRow
                />
              </div>

              <div className="order-3 md:order-none md:col-start-2 md:row-start-1">
                <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1 mb-1.5">Strategy parameters</div>
                <div className="bg-white dark:bg-[#151717] border border-gray-200 dark:border-[#323738] rounded-lg divide-y divide-[#323738]">
                  <div className="p-3">
                    <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1.5">Strategy</label>
                    <Select value={strategy} onValueChange={(v) => setStrategy(v as Strategy)} disabled={isRunning}>
                      <SelectTrigger className="bg-gray-100 dark:bg-[#323738] border-gray-300 dark:border-[#414647] text-gray-900 dark:text-white h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-100 dark:bg-[#323738] border-gray-300 dark:border-[#414647]">
                        <SelectItem value="martingale" className="text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-[#414647]">Martingale</SelectItem>
                        <SelectItem value="dalembert" className="text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-[#414647]">D'Alembert</SelectItem>
                        <SelectItem value="oscars_grind" className="text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-[#414647]">Oscar's Grind</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {strategy === 'martingale' ? (
                    <div className="p-3 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1.5">Stake ×multiplier</label>
                        <Input
                          type="number"
                          value={stakeMultiplier}
                          onChange={(e) => setStakeMultiplier(e.target.value)}
                          disabled={isRunning}
                          className="bg-gray-100 dark:bg-[#323738] border-gray-300 dark:border-[#414647] text-gray-900 dark:text-white h-9"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1.5">Max stake (USD)</label>
                        <Input
                          type="number"
                          value={maxStake}
                          onChange={(e) => setMaxStake(e.target.value)}
                          disabled={isRunning}
                          placeholder="No limit"
                          className="bg-gray-100 dark:bg-[#323738] border-gray-300 dark:border-[#414647] text-gray-900 dark:text-white h-9"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-3 text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400">
                        {strategy === 'dalembert'
                          ? 'Increases stake by the base stake amount after a loss, decreases by the same amount after a win (never below base stake).'
                          : "Keeps stake flat after a loss, increases by the base stake amount after a win."}
                      </div>
                      <div className="p-3">
                        <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1.5">Max stake (USD)</label>
                        <Input
                          type="number"
                          value={maxStake}
                          onChange={(e) => setMaxStake(e.target.value)}
                          disabled={isRunning}
                          placeholder="No limit"
                          className="bg-gray-100 dark:bg-[#323738] border-gray-300 dark:border-[#414647] text-gray-900 dark:text-white h-9"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="order-4 md:order-none md:col-start-3 md:row-start-1">
                <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1 mb-1.5">Risk management</div>
                <div className="bg-white dark:bg-[#151717] border border-gray-200 dark:border-[#323738] rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1.5">Profit target (USD)</label>
                      <Input
                        type="number"
                        value={profitThreshold}
                        onChange={(e) => setProfitThreshold(e.target.value)}
                        disabled={isRunning}
                        className="bg-gray-100 dark:bg-[#323738] border-gray-300 dark:border-[#414647] text-gray-900 dark:text-white h-9"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1.5">Loss limit (USD)</label>
                      <Input
                        type="number"
                        value={lossThreshold}
                        onChange={(e) => setLossThreshold(e.target.value)}
                        disabled={isRunning}
                        className="bg-gray-100 dark:bg-[#323738] border-gray-300 dark:border-[#414647] text-gray-900 dark:text-white h-9"
                      />
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">Stops automatically when cumulative profit/loss reaches either value.</div>
                </div>
              </div>

              <div className="order-1 md:order-none md:col-start-1 md:row-start-1">
                <div className="bg-white dark:bg-[#151717] border border-gray-200 dark:border-[#323738] rounded-lg divide-y divide-[#323738]">
                  <div className="p-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1.5">Volatility</label>
                      <Select value={selectedAsset} onValueChange={setSelectedAsset} disabled={isRunning}>
                        <SelectTrigger className="bg-gray-100 dark:bg-[#323738] border-gray-300 dark:border-[#414647] text-gray-900 dark:text-white h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-100 dark:bg-[#323738] border-gray-300 dark:border-[#414647] max-h-72">
                          {VOLATILITY_ASSETS.map((asset) => (
                            <SelectItem key={asset} value={asset} className="text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-[#414647]">
                              {asset}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1.5">Trade type</label>
                      <Select value={tradeType} onValueChange={setTradeType} disabled={isRunning}>
                        <SelectTrigger className="bg-gray-100 dark:bg-[#323738] border-gray-300 dark:border-[#414647] text-gray-900 dark:text-white h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-100 dark:bg-[#323738] border-gray-300 dark:border-[#414647]">
                          {TRADE_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value} className="text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-[#414647]">
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="p-3">
                    <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1.5">Direction</label>
                    <div className="grid grid-cols-2 gap-2">
                      {choices.map((choice, idx) => (
                        <button
                          key={choice}
                          disabled={isRunning}
                          onClick={() => setChoiceIndex(idx)}
                          className={`py-1.5 rounded border text-sm font-medium capitalize disabled:opacity-50 ${
                            choiceIndex === idx
                              ? 'bg-red-600 border-red-500 text-white'
                              : 'bg-gray-100 dark:bg-[#323738] border-gray-300 dark:border-[#414647] text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          {choice}
                        </button>
                      ))}
                    </div>
                  </div>

                  {digitSelector && (
                    <div className="p-3">
                      <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1.5">Digit</label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {DIGITS.map((d) => (
                          <button
                            key={d}
                            disabled={isRunning}
                            onClick={() => setSelectedDigit(d)}
                            className={`py-1.5 rounded border text-sm font-medium disabled:opacity-50 ${
                              selectedDigit === d
                                ? 'bg-red-600 border-red-500 text-white'
                                : 'bg-gray-100 dark:bg-[#323738] border-gray-300 dark:border-[#414647] text-gray-600 dark:text-gray-300'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1.5">Duration (ticks)</label>
                      <Input
                        type="number"
                        value={durationValue}
                        onChange={(e) => setDurationValue(e.target.value)}
                        disabled={isRunning}
                        className="bg-gray-100 dark:bg-[#323738] border-gray-300 dark:border-[#414647] text-gray-900 dark:text-white h-9"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1.5">Base stake (USD)</label>
                      <Input
                        type="number"
                        value={baseStake}
                        onChange={(e) => setBaseStake(e.target.value)}
                        disabled={isRunning}
                        className="bg-gray-100 dark:bg-[#323738] border-gray-300 dark:border-[#414647] text-gray-900 dark:text-white h-9"
                      />
                    </div>
                  </div>

                  <div className="p-3 flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Allow equals</span>
                    <Switch checked={allowEquals} onCheckedChange={setAllowEquals} disabled={isRunning} />
                  </div>
                </div>
              </div>

              <div className="order-5 md:order-none md:col-start-2 md:col-span-2 md:row-start-2">
                <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1 mb-1.5">Bot statistics</div>
                <div className="bg-white dark:bg-[#151717] border border-gray-200 dark:border-[#323738] rounded-lg p-3 space-y-3">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-[11px] text-gray-400 dark:text-gray-500 dark:text-gray-400">Total stake</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{totalStake.toFixed(2)} USD</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-400 dark:text-gray-500 dark:text-gray-400">Total payout</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{totalPayout.toFixed(2)} USD</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-400 dark:text-gray-500 dark:text-gray-400">No. of runs</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{tradesRun}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-400 dark:text-gray-500 dark:text-gray-400">Contracts lost</div>
                      <div className="text-sm font-semibold text-red-400">{contractsLost}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-400 dark:text-gray-500 dark:text-gray-400">Contracts won</div>
                      <div className="text-sm font-semibold text-green-400">{contractsWon}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-400 dark:text-gray-500 dark:text-gray-400">Total profit/loss</div>
                      <div className={`text-sm font-semibold ${runningPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {runningPL >= 0 ? '+' : ''}{runningPL.toFixed(2)} USD
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetStats}
                    className="w-full py-2 rounded-lg border border-gray-300 dark:border-[#414647] text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#232728] transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Run button, always visible above the bottom nav */}
          <div className="md:hidden shrink-0 p-4 border-t border-gray-200 dark:border-[#323738] bg-gray-50 dark:bg-[#0e0e0e]">
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

      {/* Floating AI Entry Scanner button */}
      <button
        type="button"
        onClick={() => setScannerOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg flex items-center justify-center text-white font-bold text-sm hover:scale-105 transition-transform"
      >
        AI
        <span className="absolute top-1 right-1 w-3 h-3 bg-green-400 border-2 border-gray-200 dark:border-[#0e0e0e] rounded-full" />
      </button>

      <div className="hidden md:block fixed bottom-6 right-24 z-40">
        <Button
          onClick={handleRun}
          className={`px-6 py-3 text-base font-semibold rounded-full shadow-lg ${
            isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {isRunning ? 'Stop' : 'Run'}
        </Button>
      </div>

      <EntryScannerModal
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        markets={VOLATILITY_ASSETS}
        onLaunch={applyScannerLaunch}
      />
    </div>
  );
};

export default Automate;
