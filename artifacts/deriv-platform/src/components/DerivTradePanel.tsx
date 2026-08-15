import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown } from 'lucide-react';
import {
  TRADE_TYPES,
  DIGITS,
  calculatePayout,
  isDigitContract,
  needsDigitSelector,
} from '@/lib/trade-config';

interface DerivTradePanelProps {
  selectedAsset: string;
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

const DerivTradePanel = ({
  selectedAsset,
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
}: DerivTradePanelProps) => {
  const digitContract = isDigitContract(tradeType);
  const digitSelector = needsDigitSelector(tradeType);
  const payout = calculatePayout(tradeType, stake);

  return (
    <div className="h-full bg-[#151717] border-l border-[#323738]">
      {/* Header */}
      <div className="p-4 border-b border-[#323738]">
        <h3 className="text-lg font-semibold text-white">Trade</h3>
      </div>

      <div className="p-4 space-y-6">
        {/* Trade Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Trade type
          </label>
          <Select value={tradeType} onValueChange={onTradeTypeChange}>
            <SelectTrigger className="bg-[#323738] border-[#414647] text-white">
              <SelectValue />
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

        {/* Asset Display */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Asset
          </label>
          <div className="p-3 bg-[#323738] rounded border border-[#414647]">
            <div className="text-white font-medium text-sm">{selectedAsset}</div>
          </div>
        </div>

        {/* Digit selector, only for Matches/Differs and Over/Under */}
        {digitSelector && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {tradeType === 'matches_differs' ? 'Digit to match' : 'Digit barrier'}
            </label>
            <div className="grid grid-cols-5 gap-2">
              {DIGITS.map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => onDigitChange(digit)}
                  className={`py-2 rounded text-sm font-medium border transition-colors ${
                    selectedDigit === digit
                      ? 'bg-red-600 border-red-500 text-white'
                      : 'bg-[#323738] border-[#414647] text-gray-300 hover:bg-[#414647]'
                  }`}
                >
                  {digit}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stake */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Stake
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
              USD
            </span>
            <Input
              type="number"
              value={stake}
              onChange={(e) => onStakeChange(e.target.value)}
              className="bg-[#323738] border-[#414647] text-white pl-12"
              min="1"
              step="0.01"
            />
          </div>
          <div className="flex space-x-2 mt-2">
            {['5', '10', '25', '50'].map((amount) => (
              <Button
                key={amount}
                variant="ghost"
                size="sm"
                onClick={() => onStakeChange(amount)}
                className="text-xs bg-[#323738] text-gray-300 hover:text-white hover:bg-[#414647] border border-[#414647]"
              >
                {amount}
              </Button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Duration
          </label>
          <div className="flex space-x-2">
            <Input
              type="number"
              value={duration}
              onChange={(e) => onDurationChange(e.target.value)}
              className="bg-[#323738] border-[#414647] text-white flex-1"
              min="1"
            />
            <Select value={durationType} onValueChange={onDurationTypeChange}>
              <SelectTrigger className="w-24 bg-[#323738] border-[#414647] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#323738] border-[#414647]">
                <SelectItem value="t" className="text-white hover:bg-[#414647]">Ticks</SelectItem>
                <SelectItem value="s" className="text-white hover:bg-[#414647]">Seconds</SelectItem>
                <SelectItem value="m" className="text-white hover:bg-[#414647]">Minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Payout info */}
        <div className="p-3 bg-[#323738] rounded border border-[#414647]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-300">Payout</span>
            <span className="text-sm font-medium text-white">USD {payout}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Profit</span>
            <span className="text-sm font-medium text-green-400">
              USD {(parseFloat(payout) - parseFloat(stake || '0')).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Purchase buttons */}
        <div className="space-y-3">
          {tradeType === 'matches_differs' && (
            <>
              <Button className="w-full bg-green-500 hover:bg-green-600 text-white py-4 font-medium text-base">
                Matches
              </Button>
              <Button className="w-full bg-red-500 hover:bg-red-600 text-white py-4 font-medium text-base">
                Differs
              </Button>
            </>
          )}

          {tradeType === 'even_odd' && (
            <>
              <Button className="w-full bg-green-500 hover:bg-green-600 text-white py-4 font-medium text-base">
                Even
              </Button>
              <Button className="w-full bg-red-500 hover:bg-red-600 text-white py-4 font-medium text-base">
                Odd
              </Button>
            </>
          )}

          {tradeType === 'over_under' && (
            <>
              <Button className="w-full bg-green-500 hover:bg-green-600 text-white py-4 font-medium text-base">
                Over
              </Button>
              <Button className="w-full bg-red-500 hover:bg-red-600 text-white py-4 font-medium text-base">
                Under
              </Button>
            </>
          )}

          {!digitContract && (
            <>
              <Button className="w-full bg-green-500 hover:bg-green-600 text-white py-4 font-medium text-base">
                <div className="flex items-center justify-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Rise</span>
                </div>
                <div className="text-xs opacity-90 ml-2">12,559.23</div>
              </Button>

              <Button className="w-full bg-red-500 hover:bg-red-600 text-white py-4 font-medium text-base">
                <div className="flex items-center justify-center space-x-2">
                  <TrendingDown className="h-5 w-5" />
                  <span>Fall</span>
                </div>
                <div className="text-xs opacity-90 ml-2">12,536.55</div>
              </Button>
            </>
          )}
        </div>

        {/* Risk warning */}
        <div className="p-3 bg-yellow-900/20 border border-yellow-700/50 rounded text-xs text-yellow-200">
          <div className="font-medium mb-1">⚠️ Risk warning</div>
          <div>Trading is risky. You may lose all your capital.</div>
        </div>
      </div>
    </div>
  );
};

export default DerivTradePanel;
