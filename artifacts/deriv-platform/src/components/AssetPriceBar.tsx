import { useState, useEffect } from 'react';
import { ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';

interface AssetPriceBarProps {
  selectedAsset: string;
  onAssetChange: (asset: string) => void;
}

interface AssetGroup {
  label: string;
  assets: string[];
}

const AssetPriceBar = ({ selectedAsset, onAssetChange }: AssetPriceBarProps) => {
  const [currentPrice, setCurrentPrice] = useState(12547.89);
  const [priceChange, setPriceChange] = useState(+12.34);
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);

  const assetGroups: AssetGroup[] = [
    {
      label: 'Continuous Indices',
      assets: [
        'Volatility 10 Index',
        'Volatility 25 Index',
        'Volatility 50 Index',
        'Volatility 75 Index',
        'Volatility 100 Index',
      ],
    },
    {
      label: '1s Indices',
      assets: [
        'Volatility 10 (1s) Index',
        'Volatility 15 (1s) Index',
        'Volatility 25 (1s) Index',
        'Volatility 30 (1s) Index',
        'Volatility 50 (1s) Index',
        'Volatility 75 (1s) Index',
        'Volatility 90 (1s) Index',
        'Volatility 100 (1s) Index',
      ],
    },
    {
      label: 'Forex',
      assets: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD'],
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPrice((prev) => {
        const change = (Math.random() - 0.5) * 3;
        const newPrice = Math.max(0, prev + change);
        setPriceChange(change);
        return newPrice;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedAsset]);

  const percentChange = ((priceChange / currentPrice) * 100).toFixed(2);

  return (
    <div className="flex items-center gap-2 px-3 sm:px-4 py-3 bg-[#0e0e0e] border-b border-[#232728]">
      <div className="relative shrink-0">
        <button
          onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-[#323738] rounded hover:bg-[#414647] transition-colors max-w-[150px] sm:max-w-none"
        >
          <span className="font-medium text-white text-xs sm:text-sm truncate">{selectedAsset}</span>
          <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
        </button>

        {isAssetDropdownOpen && (
          <div className="absolute top-full left-0 mt-1 w-72 max-h-96 overflow-y-auto bg-[#323738] border border-[#414647] rounded-lg shadow-lg z-50">
            {assetGroups.map((group) => (
              <div key={group.label}>
                <div className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-400 sticky top-0 bg-[#323738]">
                  {group.label}
                </div>
                {group.assets.map((asset) => (
                  <button
                    key={asset}
                    onClick={() => {
                      onAssetChange(asset);
                      setIsAssetDropdownOpen(false);
                    }}
                    className={`flex items-center justify-between w-full text-left px-4 py-2.5 hover:bg-[#414647] text-white transition-colors ${
                      asset === selectedAsset ? 'bg-[#414647]/60' : ''
                    }`}
                  >
                    <span>{asset}</span>
                    {asset === selectedAsset && <span className="text-red-500 text-sm">✓</span>}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2 min-w-0">
        <span className="text-base sm:text-lg font-bold text-white truncate">
          {currentPrice.toFixed(2)}
        </span>
        <span
          className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-xs shrink-0 ${
            priceChange >= 0 ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
          }`}
        >
          {priceChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          <span>
            {priceChange >= 0 ? '+' : ''}
            {priceChange.toFixed(2)} ({percentChange}%)
          </span>
        </span>
      </div>
    </div>
  );
};

export default AssetPriceBar;
