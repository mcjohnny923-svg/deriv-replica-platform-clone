import { useState } from 'react';
import { ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  durationType: string;
  onDurationTypeChange: (type: string) => void;
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
  durationType,
  onDurationTypeChange,
}: MobileTradeDrawerProps) => {
  const [expanded, setExpanded] = useState(true);
  const [equalsChecked, setEqualsChecked] = useState(false);

  const currentLabel = TRADE_TYPES.find((t) => t.value === tradeType)?.label ?? 'Rise/Fall';
  const digitContract = isDigitContract(tradeType);
  const digitSelector = needsDigitSelector(tradeType);
  const payout = calculatePayout(tradeType, stake);

  const durationUnitLabel = { t: 'Ticks', s: 'Seconds', m: 'Minutes' }[durationType] ?? 'Ticks';

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
          {/* Trade type dropdown */}
          <div className="px-4 py-3 border-t border-[#323738]">
            <Select value={tradeType} onValueChange={onTradeTypeChange}>
              <SelectTrigger className="w-full bg-transparent border-none text-white text-base font-semibold justify-center gap-2 [&>svg]:hidden">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-red-500" />
                  <SelectValue>{currentLabel}</SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-[#323738] border-[#414647]">
                {TRADE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-white hover:bg-[#414647]">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          {/* Duration / stake row, both editable */}
          <div className="flex items-center gap-3 px-4 py-3 border-t border-[#323738]">
            <div className="flex-1">
              <label className="block text-[11px] text-gray-400 mb-1">Duration</label>
              <div className="flex gap-1">
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => onDurationChange(e.target.value)}
                  min="1"
                  className="bg-[#0e0e0e] border-[#323738] text-white h-9 text-sm"
                />
                <Select value={durationType} onValueChange={onDurationTypeChange}>
                  <SelectTrigger className="w-24 bg-[#0e0e0e] border-[#323738] text-white h-9 text-sm">
                    <SelectValue>{durationUnitLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-[#323738] border-[#414647]">
                    <SelectItem value="t" className="text-white hover:bg-[#414647]">Ticks</SelectItem>
                    <SelectItem value="s" className="text-white hover:bg-[#414647]">Seconds</SelectItem>
                    <SelectItem value="m" className="text-white hover:bg-[#414647]">Minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-[11px] text-gray-400 mb-1 text-right">Stake</label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                  USD
                </span>
                <Input
                  type="number"
                  value={stake}
                  onChange={(e) => onStakeChange(e.target.value)}
                  min="1"
                  step="0.01"
                  className="bg-[#0e0e0e] border-[#323738] text-white h-9 text-sm pl-10"
                />
              </div>
            </div>
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
