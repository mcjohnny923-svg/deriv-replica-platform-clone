import { useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  TRADE_TYPES,
  DIGITS,
  calculatePayout,
  isDigitContract,
  needsDigitSelector,
} from '@/lib/trade-config';

interface MobileTradeDrawerProps {
  tradeType: string;
  onTradeTypeChange: (value: string) => void;
  selectedDigit: number;
  onDigitChange: (digit: number) => void;
  stake: string;
  onStakeChange: (stake: string) => void;
  duration: string;
  onDurationChange: (duration: string) => void;
}

const MobileTradeDrawer = ({
  tradeType,
  onTradeTypeChange,
  selectedDigit,
  onDigitChange,
  stake,
  onStakeChange,
  duration,
  onDurationChange,
}: MobileTradeDrawerProps) => {
  const [expanded, setExpanded] = useState(true);
  const [equalsChecked, setEqualsChecked] = useState(false);

  const currentIndex = TRADE_TYPES.findIndex((t) => t.value === tradeType);
  const currentLabel = TRADE_TYPES[currentIndex]?.label ?? 'Rise/Fall';
  const digitContract = isDigitContract(tradeType);
  const digitSelector = needsDigitSelector(tradeType);
  const payout = calculatePayout(tradeType, stake);

  const cycleTradeType = (direction: 1 | -1) => {
    const nextIndex =
      (currentIndex + direction + TRADE_TYPES.length) % TRADE_TYPES.length;
    onTradeTypeChange(TRADE_TYPES[nextIndex].value);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#151717] border-t border-[#323738] md:hidden">
      {/* Collapse handle */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex justify-center py-2"
      >
        <ChevronDown
          className={`h-5 w-5 text-gray-400 transition-transform ${expanded ? '' : 'rotate-180'}`}
        />
      </button>

      {expanded && (
        <div className="pb-4">
          {/* Trade type switcher */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#323738]">
            <button type="button" onClick={() => cycleTradeType(-1)}>
              <ChevronLeft className="h-5 w-5 text-gray-400" />
            </button>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-red-500" />
              <span className="text-white font-semibold text-base">{currentLabel}</span>
            </div>
            <button type="button" onClick={() => cycleTradeType(1)}>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Digit picker row, only for Matches/Differs and Over/Under */}
          {digitSelector && (
            <div className="grid grid-cols-5 gap-2 px-4 pb-3">
              {DIGITS.map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => onDigitChange(digit)}
                  className={`py-2 rounded text-sm font-medium border transition-colors ${
                    selectedDigit === digit
                      ? 'bg-[#323738] border-white text-white'
                      : 'bg-[#0e0e0e] border-[#323738] text-gray-300'
                  }`}
                >
                  {digit}
                </button>
              ))}
            </div>
          )}

          {/* Duration / stake row */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#323738]">
            <div className="text-white text-sm">
              {duration} {digitContract ? 'tick' : 'min'}
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-white font-semibold">{stake}</span>
              <span className="text-white font-semibold">USD</span>
            </div>
            <span className="text-gray-400 text-sm">Stake</span>
          </div>

          {/* Equals checkbox, only for non-digit contracts */}
          {!digitContract && (
            <div className="flex items-center space-x-3 px-4 py-3 border-t border-[#323738]">
              <Checkbox
                id="equals-mobile"
                checked={equalsChecked}
                onCheckedChange={(checked) => setEqualsChecked(!!checked)}
                className="border-red-500 data-[state=checked]:bg-red-500"
              />
              <label htmlFor="equals-mobile" className="text-white text-sm font-medium">
                Equals
              </label>
              <span className="text-gray-400 text-xs">
                Win payout if exit spot is also equal to entry spot.
              </span>
            </div>
          )}

          {/* Buy buttons */}
          <div className="grid grid-cols-2 gap-2 px-4 pt-2">
            {tradeType === 'matches_differs' && (
              <>
                <button className="bg-teal-700/40 border border-teal-500 rounded-lg py-4 text-teal-300 font-semibold">
                  Matches
                  <div className="text-xs opacity-80">USD {payout}</div>
                </button>
                <button className="bg-red-900/40 border border-red-500 rounded-lg py-4 text-red-300 font-semibold">
                  Differs
                  <div className="text-xs opacity-80">USD {payout}</div>
                </button>
              </>
            )}
            {tradeType === 'even_odd' && (
              <>
                <button className="bg-teal-700/40 border border-teal-500 rounded-lg py-4 text-teal-300 font-semibold">
                  Even
                  <div className="text-xs opacity-80">USD {payout}</div>
                </button>
                <button className="bg-red-900/40 border border-red-500 rounded-lg py-4 text-red-300 font-semibold">
                  Odd
                  <div className="text-xs opacity-80">USD {payout}</div>
                </button>
              </>
            )}
            {tradeType === 'over_under' && (
              <>
                <button className="bg-teal-700/40 border border-teal-500 rounded-lg py-4 text-teal-300 font-semibold">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="h-4 w-4" /> Over
                  </div>
                  <div className="text-xs opacity-80">Payout {payout} USD</div>
                </button>
                <button className="bg-red-900/40 border border-red-500 rounded-lg py-4 text-red-300 font-semibold">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingDown className="h-4 w-4" /> Under
                  </div>
                  <div className="text-xs opacity-80">Payout {payout} USD</div>
                </button>
              </>
            )}
            {!digitContract && (
              <>
                <button className="bg-teal-700/40 border border-teal-500 rounded-lg py-4 text-teal-300 font-semibold flex items-center justify-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Rise
                </button>
                <button className="bg-red-900/40 border border-red-500 rounded-lg py-4 text-red-300 font-semibold flex items-center justify-center gap-2">
                  <TrendingDown className="h-4 w-4" /> Fall
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileTradeDrawer;
