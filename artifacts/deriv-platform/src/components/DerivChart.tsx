import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChartData {
  time: string;
  price: number;
}

interface DerivChartProps {
  selectedAsset: string;
  onAssetChange: (asset: string) => void;
}

interface AssetGroup {
  label: string;
  assets: string[];
}

const DerivChart = ({ selectedAsset, onAssetChange }: DerivChartProps) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
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

  const timeframes = ['1T', '5T', '15T', '30T', '1H', '4H', '1D'];
  const [selectedTimeframe, setSelectedTimeframe] = useState('1T');

  useEffect(() => {
    // Generate sample data
    const generateData = () => {
      const data: ChartData[] = [];
      let basePrice = currentPrice;
      
      for (let i = 0; i < 200; i++) {
        basePrice += (Math.random() - 0.5) * 50;
        data.push({
          time: new Date(Date.now() - (200 - i) * 60000).toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          price: Math.max(0, basePrice)
        });
      }
      
      return data;
    };

    setChartData(generateData());

    // Simulate real-time updates
    const interval = setInterval(() => {
      setCurrentPrice(prev => {
        const change = (Math.random() - 0.5) * 20;
        const newPrice = Math.max(0, prev + change);
        setPriceChange(change);
        return newPrice;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedAsset]);

  return (
    <div className="flex-1 bg-[#0e0e0e] p-4">
      {/* Asset selector and price info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
              className="flex items-center space-x-2 px-4 py-2 bg-[#323738] rounded hover:bg-[#414647] transition-colors"
            >
              <span className="font-medium text-white">{selectedAsset}</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
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
                        {asset === selectedAsset && (
                          <span className="text-red-500 text-sm">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold text-white">
              {currentPrice.toFixed(2)}
            </div>
            <div className={`flex items-center space-x-1 px-2 py-1 rounded text-sm ${
              priceChange >= 0 
                ? 'text-green-400 bg-green-400/10' 
                : 'text-red-400 bg-red-400/10'
            }`}>
              {priceChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Timeframe selector */}
        <div className="flex space-x-1 bg-[#323738] rounded p-1">
          {timeframes.map((tf) => (
            <Button
              key={tf}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTimeframe(tf)}
              className={`px-3 py-1 text-xs ${
                selectedTimeframe === tf
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'text-gray-300 hover:text-white hover:bg-[#414647]'
              }`}
            >
              {tf}
            </Button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-96 bg-[#151717] rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              domain={['dataMin - 50', 'dataMax + 50']}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#EF4444" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#EF4444' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DerivChart;
