
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TradePanelProps {
  selectedMarket: string;
  tradeType: string;
  onTradeTypeChange: (type: string) => void;
}

const TradePanel = ({ selectedMarket, tradeType, onTradeTypeChange }: TradePanelProps) => {
  const [stake, setStake] = useState('10');
  const [duration, setDuration] = useState('5');
  const [payout, setPayout] = useState('18.50');

  const tradeTypes = [
    'Rise/Fall',
    'Higher/Lower',
    'Touch/No Touch',
    'In/Out',
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 h-fit">
      <h3 className="text-lg font-semibold text-white mb-6">Trade</h3>

      {/* Trade Type Selection */}
      <div className="space-y-4 mb-6">
        <Label className="text-gray-300">Trade Type</Label>
        <Select value={tradeType} onValueChange={onTradeTypeChange}>
          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-700 border-gray-600">
            {tradeTypes.map((type) => (
              <SelectItem key={type} value={type} className="text-white hover:bg-gray-600">
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Market Display */}
      <div className="mb-6">
        <Label className="text-gray-300">Market</Label>
        <div className="mt-2 p-3 bg-gray-700 rounded-lg">
          <div className="text-white font-medium">{selectedMarket}</div>
          <div className="text-gray-400 text-sm">Current: 1.0850</div>
        </div>
      </div>

      {/* Stake */}
      <div className="space-y-2 mb-6">
        <Label className="text-gray-300">Stake</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
          <Input
            type="number"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white pl-8"
          />
        </div>
        <div className="flex space-x-2">
          {['5', '10', '25', '50'].map((amount) => (
            <Button
              key={amount}
              variant="ghost"
              size="sm"
              onClick={() => setStake(amount)}
              className="text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600"
            >
              ${amount}
            </Button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-2 mb-6">
        <Label className="text-gray-300">Duration</Label>
        <Select value={duration} onValueChange={setDuration}>
          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-700 border-gray-600">
            <SelectItem value="1" className="text-white hover:bg-gray-600">1 minute</SelectItem>
            <SelectItem value="5" className="text-white hover:bg-gray-600">5 minutes</SelectItem>
            <SelectItem value="15" className="text-white hover:bg-gray-600">15 minutes</SelectItem>
            <SelectItem value="30" className="text-white hover:bg-gray-600">30 minutes</SelectItem>
            <SelectItem value="60" className="text-white hover:bg-gray-600">1 hour</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payout */}
      <div className="space-y-2 mb-6">
        <div className="flex justify-between">
          <Label className="text-gray-300">Potential Payout</Label>
          <span className="text-green-400 font-medium">${payout}</span>
        </div>
        <div className="text-xs text-gray-400">
          Potential Profit: ${(parseFloat(payout) - parseFloat(stake)).toFixed(2)}
        </div>
      </div>

      {/* Buy Buttons */}
      <div className="space-y-3">
        <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 font-medium">
          BUY RISE
          <div className="text-xs opacity-90 ml-2">1.0851</div>
        </Button>
        <Button className="w-full bg-red-600 hover:bg-red-700 text-white py-3 font-medium">
          BUY FALL
          <div className="text-xs opacity-90 ml-2">1.0849</div>
        </Button>
      </div>

      {/* Risk Warning */}
      <div className="mt-6 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
        <div className="text-yellow-400 text-xs">
          ⚠️ Risk Warning: Trading involves risk of loss
        </div>
      </div>
    </div>
  );
};

export default TradePanel;
