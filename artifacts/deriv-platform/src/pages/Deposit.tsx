
import { useState } from 'react';
import { CreditCard, Building, Smartphone, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import TradingSidebar from '@/components/TradingSidebar';

const Deposit = () => {
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [amount, setAmount] = useState('100');

  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      fee: 'No fee',
      time: 'Instant',
      description: 'Visa, Mastercard, American Express'
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: Building,
      fee: 'No fee',
      time: '1-3 business days',
      description: 'Direct bank transfer'
    },
    {
      id: 'ewallet',
      name: 'E-Wallet',
      icon: Smartphone,
      fee: 'No fee',
      time: 'Instant',
      description: 'PayPal, Skrill, Neteller'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      <TradingSidebar />
      
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Deposit Funds</h1>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Deposit Form */}
            <div className="lg:col-span-2">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-semibold mb-6">Add Money to Your Account</h2>

                {/* Amount Selection */}
                <div className="mb-6">
                  <Label className="text-gray-300 mb-3 block">Deposit Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white pl-8 text-lg"
                      placeholder="100"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {['50', '100', '250', '500'].map((preset) => (
                      <Button
                        key={preset}
                        variant="ghost"
                        onClick={() => setAmount(preset)}
                        className="bg-gray-700 hover:bg-gray-600 text-gray-300"
                      >
                        ${preset}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="mb-6">
                  <Label className="text-gray-300 mb-4 block">Payment Method</Label>
                  <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
                    <div className="space-y-3">
                      {paymentMethods.map((method) => (
                        <div key={method.id} className="relative">
                          <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
                          <label
                            htmlFor={method.id}
                            className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                              selectedMethod === method.id
                                ? 'border-red-500 bg-red-500/10'
                                : 'border-gray-600 bg-gray-700 hover:bg-gray-600'
                            }`}
                          >
                            <method.icon className="h-6 w-6 text-gray-400 mr-4" />
                            <div className="flex-1">
                              <div className="font-medium text-white">{method.name}</div>
                              <div className="text-sm text-gray-400">{method.description}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-400">{method.fee}</div>
                              <div className="text-xs text-gray-500">{method.time}</div>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                {/* Card Details (if card selected) */}
                {selectedMethod === 'card' && (
                  <div className="space-y-4 mb-6 p-4 bg-gray-700 rounded-lg">
                    <div>
                      <Label className="text-gray-300">Card Number</Label>
                      <Input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        className="mt-1 bg-gray-600 border-gray-500 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Expiry Date</Label>
                        <Input
                          type="text"
                          placeholder="MM/YY"
                          className="mt-1 bg-gray-600 border-gray-500 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">CVV</Label>
                        <Input
                          type="text"
                          placeholder="123"
                          className="mt-1 bg-gray-600 border-gray-500 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-300">Cardholder Name</Label>
                      <Input
                        type="text"
                        placeholder="John Doe"
                        className="mt-1 bg-gray-600 border-gray-500 text-white"
                      />
                    </div>
                  </div>
                )}

                <Button className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-lg">
                  Deposit ${amount}
                </Button>
              </div>
            </div>

            {/* Deposit Info */}
            <div className="space-y-6">
              {/* Security Info */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Security & Safety
                </h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>• SSL encrypted transactions</li>
                  <li>• PCI DSS compliant</li>
                  <li>• Funds segregated in tier-1 banks</li>
                  <li>• Regulated by financial authorities</li>
                </ul>
              </div>

              {/* Deposit Limits */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Deposit Limits</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Minimum</span>
                    <span className="text-white">$10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Maximum (Daily)</span>
                    <span className="text-white">$10,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Maximum (Monthly)</span>
                    <span className="text-white">$50,000</span>
                  </div>
                </div>
              </div>

              {/* Recent Deposits */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Recent Deposits</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-white font-medium">$500.00</div>
                      <div className="text-xs text-gray-400">Credit Card</div>
                    </div>
                    <div className="text-xs text-gray-400">2 days ago</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-white font-medium">$250.00</div>
                      <div className="text-xs text-gray-400">Bank Transfer</div>
                    </div>
                    <div className="text-xs text-gray-400">1 week ago</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Deposit;
