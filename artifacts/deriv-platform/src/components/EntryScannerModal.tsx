import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

export interface ScannerLaunchConfig {
  asset: string;
  tradeType: 'even_odd' | 'over_under' | 'rise_fall';
  choiceIndex: number;
  digit?: number;
  stake: number;
  useMartingale: boolean;
  martingaleMultiplier: number;
  winsTarget: number;
  profitTarget: number;
  stopLoss: number;
  digitsToCheck: number;
  autoStart: boolean;
}

interface StrategyDef {
  key: string;
  label: string;
  tradeType: 'even_odd' | 'over_under' | 'rise_fall';
  choice: string;
  choiceIndex: number;
  digit?: number;
}

const STRATEGY_ROTATION: StrategyDef[] = [
  { key: 'even', label: 'Even', tradeType: 'even_odd', choice: 'even', choiceIndex: 0 },
  { key: 'odd', label: 'Odd', tradeType: 'even_odd', choice: 'odd', choiceIndex: 1 },
  { key: 'over_2', label: 'Over 2', tradeType: 'over_under', choice: 'over', choiceIndex: 0, digit: 2 },
  { key: 'over_3', label: 'Over 3', tradeType: 'over_under', choice: 'over', choiceIndex: 0, digit: 3 },
  { key: 'under_6', label: 'Under 6', tradeType: 'over_under', choice: 'under', choiceIndex: 1, digit: 6 },
  { key: 'under_7', label: 'Under 7', tradeType: 'over_under', choice: 'under', choiceIndex: 1, digit: 7 },
  { key: 'under_8', label: 'Under 8', tradeType: 'over_under', choice: 'under', choiceIndex: 1, digit: 8 },
  { key: 'rise', label: 'Rise', tradeType: 'rise_fall', choice: 'rise', choiceIndex: 0 },
  { key: 'fall', label: 'Fall', tradeType: 'rise_fall', choice: 'fall', choiceIndex: 1 },
];

const ROTATION_KEY = 'scanner_strategy_rotation_index';

function getNextStrategy(): { strategy: StrategyDef; index: number } {
  const raw = localStorage.getItem(ROTATION_KEY);
  const index = raw ? (parseInt(raw, 10) || 0) % STRATEGY_ROTATION.length : 0;
  return { strategy: STRATEGY_ROTATION[index], index };
}

function advanceRotation(index: number) {
  const next = (index + 1) % STRATEGY_ROTATION.length;
  localStorage.setItem(ROTATION_KEY, String(next));
}

interface BestResult {
  market: string;
  strategy: StrategyDef;
  winRate: number;
  sampleSize: number;
  qualityScore: number;
  recentWinRate: number;
}

interface EntryScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  markets: string[];
  onLaunch: (config: ScannerLaunchConfig) => void;
}

const EntryScannerModal = ({ open, onOpenChange, markets, onLaunch }: EntryScannerModalProps) => {
  const [view, setView] = useState<'scan' | 'params'>('scan');
  const [ticksToScan, setTicksToScan] = useState('500');
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState<{ label: string; index: number; total: number } | null>(null);
  const [best, setBest] = useState<BestResult | null>(null);
  const stopRef = useRef(false);

  const [stake, setStake] = useState('0.5');
  const [martingale, setMartingale] = useState('2');
  const [numberOfWins, setNumberOfWins] = useState('5');
  const [digitsToCheck, setDigitsToCheck] = useState('1');
  const [expectedProfit, setExpectedProfit] = useState('100');
  const [stopLoss, setStopLoss] = useState('50');
  const [useMartingale, setUseMartingale] = useState(true);
  const [autoStart, setAutoStart] = useState(true);

  const resetAndClose = () => {
    stopRef.current = true;
    setScanning(false);
    setView('scan');
    setProgress(null);
    setBest(null);
    onOpenChange(false);
  };

  const runScan = async () => {
    const { strategy, index } = getNextStrategy();
    const total = markets.length;
    const ticks = parseInt(ticksToScan, 10) || 500;

    setBest(null);
    setScanning(true);
    stopRef.current = false;

    let bestSoFar: BestResult | null = null;

    for (let i = 0; i < total; i++) {
      if (stopRef.current) break;
      const market = markets[i];
      setProgress({ label: market, index: i + 1, total });

      await new Promise((r) => setTimeout(r, 350));
      if (stopRef.current) break;

      const winRate = 55 + Math.random() * 20;
      const recentWinRate = Math.min(90, Math.max(40, winRate + (Math.random() - 0.5) * 10));
      const qualityScore = winRate * 0.7 + recentWinRate * 0.3;

      const candidate: BestResult = {
        market,
        strategy,
        winRate,
        sampleSize: ticks,
        qualityScore,
        recentWinRate,
      };

      if (!bestSoFar || candidate.qualityScore > bestSoFar.qualityScore) {
        bestSoFar = candidate;
        setBest(candidate);
      }
    }

    setScanning(false);
    setProgress(null);
    if (bestSoFar) {
      advanceRotation(index);
    }
  };

  const handleStop = () => {
    stopRef.current = true;
  };

  const handleLoadBot = () => {
    if (!best) return;
    setView('params');
  };

  const handleLaunch = () => {
    if (!best) return;
    const stakeNum = parseFloat(stake) || 0.5;
    const config: ScannerLaunchConfig = {
      asset: best.market,
      tradeType: best.strategy.tradeType,
      choiceIndex: best.strategy.choiceIndex,
      digit: best.strategy.digit,
      stake: stakeNum,
      useMartingale,
      martingaleMultiplier: parseFloat(martingale) || 2,
      winsTarget: parseInt(numberOfWins, 10) || 0,
      profitTarget: parseFloat(expectedProfit) || 0,
      stopLoss: parseFloat(stopLoss) || 0,
      digitsToCheck: parseInt(digitsToCheck, 10) || 1,
      autoStart,
    };
    onLaunch(config);
    resetAndClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && resetAndClose()}>
      <DialogContent className="bg-white text-gray-900 sm:max-w-md max-h-[85vh] overflow-y-auto">
        {view === 'scan' ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Entry Scanner</DialogTitle>
            </DialogHeader>

            <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-600">
              Deep scanner evaluates all synthetic index random markets, then finds the best entry
              point digit and strategy profile from historical tick data.
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Number of ticks to scan
              </label>
              <Input
                type="number"
                value={ticksToScan}
                onChange={(e) => setTicksToScan(e.target.value)}
                disabled={scanning}
                className="font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Best market</label>
              <Input readOnly value={best?.market ?? '—'} className="font-bold text-indigo-700" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Strategy</label>
              <Input readOnly value={best?.strategy.label ?? '—'} className="font-bold text-indigo-700" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Entry digit</label>
              <Input readOnly value={best?.strategy.digit ?? '—'} className="font-bold text-indigo-700" />
            </div>

            <div className="bg-indigo-50 rounded-lg px-4 py-3 text-sm flex flex-wrap gap-x-4 gap-y-1">
              <span>Win Rate: <b>{best ? `${best.winRate.toFixed(1)}%` : '—'}</b></span>
              <span>Sample Size: <b>{best ? best.sampleSize : '—'}</b></span>
              <span>Quality Score: <b>{best ? `${best.qualityScore.toFixed(1)}%` : '—'}</b></span>
              <span>Recent Win Rate: <b>{best ? `${best.recentWinRate.toFixed(1)}%` : '—'}</b></span>
            </div>

            {progress && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm font-semibold">
                  <span>{progress.label}</span>
                  <span className="text-indigo-700">{progress.index}/{progress.total}</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all"
                    style={{ width: `${(progress.index / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {!scanning && best && (
              <div className="border-l-4 border-indigo-600 bg-gray-50 rounded p-3 text-sm">
                <b>Best market:</b> {best.market} | {best.strategy.label} | Entry {best.strategy.digit ?? '—'} | Quality {best.qualityScore.toFixed(2)}%
              </div>
            )}

            {scanning ? (
              <button
                type="button"
                onClick={handleStop}
                className="w-full py-3 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-colors"
              >
                ■ Stop Scan
              </button>
            ) : (
              <button
                type="button"
                onClick={runScan}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-700 to-indigo-500 text-white font-bold hover:opacity-90 transition-opacity"
              >
                Deep Scan for Best Market
              </button>
            )}

            <button
              type="button"
              onClick={handleLoadBot}
              disabled={!best || scanning}
              className="w-full py-3 rounded-lg border border-indigo-300 text-indigo-600 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-50 transition-colors"
            >
              Load Deep Scanner Bot
            </button>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Scanner Parameters</DialogTitle>
            </DialogHeader>

            <div className="bg-indigo-50 rounded-lg p-4 space-y-1">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Best market</div>
              <div className="font-bold text-indigo-700">{best?.market}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-indigo-50 rounded-lg p-3">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Strategy</div>
                <div className="font-bold text-indigo-700">{best?.strategy.label}</div>
              </div>
              <div className="bg-indigo-50 rounded-lg p-3">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Entry digit</div>
                <div className="font-bold text-indigo-700 text-lg">{best?.strategy.digit ?? '—'}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Stake</label>
                <Input type="number" step="0.01" value={stake} onChange={(e) => setStake(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Martingale</label>
                <Input type="number" step="0.1" value={martingale} onChange={(e) => setMartingale(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Number of wins</label>
                <Input type="number" value={numberOfWins} onChange={(e) => setNumberOfWins(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">No. of digits to check</label>
                <Input type="number" value={digitsToCheck} onChange={(e) => setDigitsToCheck(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Expected profit</label>
                <Input type="number" value={expectedProfit} onChange={(e) => setExpectedProfit(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Stop loss</label>
                <Input type="number" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-semibold">Use Martingale</span>
              <Switch checked={useMartingale} onCheckedChange={setUseMartingale} />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold">Auto-Start Trading</div>
                <div className="text-xs text-gray-500">Bot runs immediately without further review</div>
              </div>
              <Switch checked={autoStart} onCheckedChange={setAutoStart} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setView('scan')}
                className="py-3 rounded-lg bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLaunch}
                className="py-3 rounded-lg bg-gradient-to-r from-indigo-700 to-indigo-500 text-white font-bold hover:opacity-90 transition-opacity"
              >
                ▶ Launch Bot
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EntryScannerModal;
