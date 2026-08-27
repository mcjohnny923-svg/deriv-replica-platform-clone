import { TRADE_TYPES } from '@/lib/trade-config';

interface TradeTypeNavBarProps {
  tradeType: string;
  onTradeTypeChange: (value: string) => void;
}

const TradeTypeNavBar = ({ tradeType, onTradeTypeChange }: TradeTypeNavBarProps) => {
  return (
    <div
      className="flex gap-2 overflow-x-auto px-3 py-2 bg-[#151717] border-b border-[#323738] [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {TRADE_TYPES.map((type) => (
        <button
          key={type.value}
          type="button"
          onClick={() => onTradeTypeChange(type.value)}
          className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
            tradeType === type.value
              ? 'bg-red-600 border-red-500 text-white'
              : 'bg-[#0e0e0e] border-[#323738] text-gray-300 hover:bg-[#323738]'
          }`}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
};

export default TradeTypeNavBar;
