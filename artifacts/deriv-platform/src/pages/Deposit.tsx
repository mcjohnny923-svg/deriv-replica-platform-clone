import { useState } from 'react';
import { CreditCard, Building, Smartphone, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import DerivHeader from '@/components/DerivHeader';
import DerivSidebar from '@/components/DerivSidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { getStoredAccount } from '@/lib/auth-api';

const Deposit = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [amount, setAmount] = useState('100');
  const account = getStoredAccount();

  const balance = account
    ? `${account.currency} ${Number(account.balance).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : '—';

  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      fee: 'No fee',
      time: 'Instant',
      description: 'Visa, Mastercard, American Express',
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: Building,
      fee: 'No fee',
      time: '1-3 business days',
      description: 'Direct bank transfer',
    },
    {
      id: 'ewallet',
      name: 'E-Wallet',
      icon: Smartphone,
      fee: 'No fee',
      time: 'Instant',
      description: 'PayPal, Skrill, Neteller',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white flex flex-col">
      <DerivHeader onMenuClick={() => setIsSidebarOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <DerivSidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="flex-1 overflow-y-auto pb-20 md:pb-6">
          <div className="max-w-2xl mx-auto p-4 space-y-4">
            <h1 className="text-2xl font-bold">Deposit Funds</h1>

            <div className="bg-[#151717] rounded-lg p-4 border border-[#323738]">
              <div className="text-xs text-gray-400">Current balance</div>
              <div className="text-lg font-bold text-white">{balance}</div>
              <div className="text-xs text-gray-400 capitalize mt-0.5">{account?.type ?? '—'} account</div>
            </div>

            <div className="bg-[#151717] rounded-lg p-4 border border-[#323738]">
              <h2 className="text-sm font-semibold text-gray-300 mb-4">Add Money to Your Account</h2>

              {/* Amount Selection */}
              <div className="mb-6">
                <Label className="text-gray-300 mb-2 block text-xs">Deposit Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-[#323738] border-[#414647] text-white pl-8 text-lg"
                    placeholder="100"
                  />
                </div>
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {['50', '100', '250', '500'].map((preset) => (
                    <Button
                      key={preset}
                      variant="ghost"
                      onClick={() => setAmount(preset)}
                      className="bg-[#323738] hover:bg-[#414647] text-gray-300 text-sm"
                    >
                      ${preset}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mb-6">
                <Label className="text-gray-300 mb-3 block text-xs">Payment Method</Label>
                <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
                  <div className="space-y-2">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="relative">
                        <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
                        <label
                          htmlFor={method.id}
                          className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                            selectedMethod === method.id
                              ? 'border-red-500 bg-red-500/10'
                              : 'border-[#414647] bg-[#323738] hover:bg-[#414647]'
                          }`}
                        >
                          <method.icon className="h-5 w-5 text-gray-400 mr-3 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white">{method.name}</div>
                            <div className="text-xs text-gray-400 truncate">{method.description}</div>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <div className="text-xs text-gray-400">{method.fee}</div>
                            <div className="text-[10px] text-gray-500">{method.time}</div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {selectedMethod === 'card' && (
                <div className="space-y-3 mb-6 p-3 bg-[#323738] rounded-lg">
                  <div>
                    <Label className="text-gray-300 text-xs">Card Number</Label>
                    <Input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      className="mt-1 bg-[#0e0e0e] border-[#414647] text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-gray-300 text-xs">Expiry Date</Label>
                      <Input
                        type="text"
                        placeholder="MM/YY"
                        className="mt-1 bg-[#0e0e0e] border-[#414647] text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-xs">CVV</Label>
                      <Input
                        type="text"
                        placeholder="123"
                        className="mt-1 bg-[#0e0e0e] border-[#414647] text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-300 text-xs">Cardholder Name</Label>
                    <Input
                      type="text"
                      placeholder="Full name on card"
                      className="mt-1 bg-[#0e0e0e] border-[#414647] text-white"
                    />
                  </div>
                </div>
              )}

              <Button className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-base">
                Deposit ${amount}
              </Button>
            </div>

            <div className="bg-[#151717] rounded-lg p-4 border border-[#323738]">
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Security & Safety
              </h3>
              <ul className="space-y-1.5 text-xs text-gray-400">
                <li>• SSL encrypted transactions</li>
                <li>• PCI DSS compliant</li>
                <li>• Funds segregated in tier-1 banks</li>
                <li>• Regulated by financial authorities</li>
              </ul>
            </div>

            <div className="bg-[#151717] rounded-lg p-4 border border-[#323738]">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Deposit Limits</h3>
              <div className="space-y-2 text-xs">
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
          </div>
        </div>
      </div>
      <MobileBottomNav onMenuClick={() => setIsSidebarOpen(true)} />
    </div>
  );
};

export default Deposit;
