
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MarketSelectionProps {
  selectedMarket: string;
  onMarketChange: (market: string) => void;
}

const MarketSelection = ({ selectedMarket, onMarketChange }: MarketSelectionProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const markets = [
    { symbol: 'EUR/USD', name: 'Euro/US Dollar', price: '1.0850', change: '+0.23%' },
    { symbol: 'GBP/USD', name: 'British Pound/US Dollar', price: '1.2650', change: '-0.15%' },
    { symbol: 'USD/JPY', name: 'US Dollar/Japanese Yen', price: '148.50', change: '+0.45%' },
    { symbol: 'AUD/USD', name: 'Australian Dollar/US Dollar', price: '0.6750', change: '+0.12%' },
    { symbol: 'US30', name: 'US Wall Street 30', price: '34,250', change: '+1.25%' },
    { symbol: 'DE30', name: 'Germany 30', price: '15,480', change: '+0.85%' },
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Markets</h3>
        <div className="relative">
          <Button
            variant="ghost"
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-300 hover:text-white"
          >
            {selectedMarket}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
          
          {isOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-gray-700 rounded-lg border border-gray-600 z-50">
              <div className="p-2">
                {markets.map((market) => (
                  <button
                    key={market.symbol}
                    onClick={() => {
                      onMarketChange(market.symbol);
                      setIsOpen(false);
                    }}
                    className="w-full text-left p-3 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">{market.symbol}</div>
                        <div className="text-gray-400 text-sm">{market.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-white">{market.price}</div>
                        <div className={`text-sm ${
                          market.change.startsWith('+') ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {market.change}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {markets.slice(0, 6).map((market) => (
          <button
            key={market.symbol}
            onClick={() => onMarketChange(market.symbol)}
            className={`p-3 rounded-lg border transition-colors ${
              selectedMarket === market.symbol
                ? 'bg-red-600 border-red-500'
                : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
            }`}
          >
            <div className="text-sm font-medium text-white">{market.symbol}</div>
            <div className="text-xs text-white mt-1">{market.price}</div>
            <div className={`text-xs mt-1 ${
              market.change.startsWith('+') ? 'text-green-400' : 'text-red-400'
            }`}>
              {market.change}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MarketSelection;
