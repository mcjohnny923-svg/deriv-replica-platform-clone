
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartData {
  time: string;
  price: number;
}

interface TradingChartProps {
  market: string;
}

const TradingChart = ({ market }: TradingChartProps) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [currentPrice, setCurrentPrice] = useState(1.0850);
  const [priceChange, setPriceChange] = useState(+0.0023);

  useEffect(() => {
    // Generate sample data
    const generateData = () => {
      const data: ChartData[] = [];
      let basePrice = 1.0850;
      
      for (let i = 0; i < 100; i++) {
        basePrice += (Math.random() - 0.5) * 0.01;
        data.push({
          time: new Date(Date.now() - (100 - i) * 60000).toLocaleTimeString(),
          price: parseFloat(basePrice.toFixed(4))
        });
      }
      
      return data;
    };

    setChartData(generateData());

    // Simulate real-time updates
    const interval = setInterval(() => {
      setCurrentPrice(prev => {
        const change = (Math.random() - 0.5) * 0.01;
        const newPrice = prev + change;
        setPriceChange(change);
        return parseFloat(newPrice.toFixed(4));
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [market]);

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white">{market}</h3>
          <div className="flex items-center space-x-4 mt-2">
            <span className="text-2xl font-bold text-white">{currentPrice}</span>
            <span className={`text-sm px-2 py-1 rounded ${
              priceChange >= 0 ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
            }`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(4)}
            </span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600">1M</button>
          <button className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600">5M</button>
          <button className="px-3 py-1 bg-red-600 text-white rounded text-sm">15M</button>
          <button className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600">1H</button>
          <button className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600">1D</button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
            <YAxis stroke="#9CA3AF" fontSize={12} domain={['dataMin - 0.01', 'dataMax + 0.01']} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff'
              }} 
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#EF4444" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TradingChart;
