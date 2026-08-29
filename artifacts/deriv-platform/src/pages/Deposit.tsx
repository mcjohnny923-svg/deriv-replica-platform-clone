import { useState, useRef, useEffect } from 'react';
import { Smartphone, Shield, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DerivHeader from '@/components/DerivHeader';
import DerivSidebar from '@/components/DerivSidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import {
  getStoredAccount,
  updateStoredAccountBalance,
  getStoredUser,
  updateStoredUserPhone,
  setPhoneNumber,
} from '@/lib/auth-api';
import { initiateDeposit, checkDepositStatus, type DepositProvider } from '@/lib/payments-api';

type FlowState = 'form' | 'waiting' | 'success' | 'failed';

function maskPhone(phone: string): string {
  return `${phone.slice(0, 3)}${'•'.repeat(phone.length - 5)}${phone.slice(-2)}`;
}

const PROVIDERS: { value: DepositProvider; label: string }[] = [
  { value: 'mpesa', label: 'M-Pesa Direct' },
  { value: 'paystack', label: 'Paystack' },
];

const Deposit = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [balanceRefreshKey, setBalanceRefreshKey] = useState(0);
  const account = getStoredAccount();
  const [storedPhone, setStoredPhone] = useState(getStoredUser()?.phoneNumber ?? null);

  const [phoneInput, setPhoneInput] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  const [provider, setProvider] = useState<DepositProvider>('mpesa');
  const [amountKes, setAmountKes] = useState('1300');
  const [flowState, setFlowState] = useState<FlowState>('form');
  const [resultMessage, setResultMessage] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const balance = account
    ? `${account.currency} ${Number(account.balance).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : '—';

  const estimatedUsd = (parseFloat(amountKes) / 130).toFixed(2);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleSavePhone = async () => {
    if (!/^254\d{9}$/.test(phoneInput)) {
      toast.error('Phone number must be in 2547XXXXXXXX format.');
      return;
    }
    setSavingPhone(true);
    try {
      await setPhoneNumber(phoneInput);
      updateStoredUserPhone(phoneInput);
      setStoredPhone(phoneInput);
      toast.success('M-Pesa number saved.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save phone number');
    } finally {
      setSavingPhone(false);
    }
  };

  const handleSubmit = async () => {
    if (!account) {
      toast.error('Please log in first.');
      return;
    }
    const kes = parseFloat(amountKes);
    if (!kes || kes <= 0) {
      toast.error('Enter a valid amount.');
      return;
    }

    try {
      const result = await initiateDeposit({
        accountId: account.id,
        amountKes: kes,
        provider,
      });
      setFlowState('waiting');
      toast.success('Request sent — approve it on your phone.');

      pollRef.current = setInterval(async () => {
        try {
          const status = await checkDepositStatus(result.checkoutRequestId);
          if (status.status === 'completed') {
            if (pollRef.current) clearInterval(pollRef.current);
            if (status.newBalance) updateStoredAccountBalance(status.newBalance);
            setBalanceRefreshKey((k) => k + 1);
            setResultMessage(`Deposit of USD ${status.amount} confirmed.`);
            setFlowState('success');
          } else if (status.status === 'failed') {
            if (pollRef.current) clearInterval(pollRef.current);
            setResultMessage('Payment was not completed. You can try again.');
            setFlowState('failed');
          }
        } catch {
          // transient error, keep polling
        }
      }, 3000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start deposit');
    }
  };

  const resetFlow = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setFlowState('form');
    setResultMessage('');
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white flex flex-col">
      <DerivHeader onMenuClick={() => setIsSidebarOpen(true)} balanceRefreshKey={balanceRefreshKey} />
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

            {!storedPhone && (
              <div className="bg-[#151717] rounded-lg p-4 border border-[#323738]">
                <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Link your M-Pesa number
                </h2>
                <p className="text-xs text-gray-500 mb-3">
                  This is set once and used for all future deposits — no need to type it every time.
                </p>
                <Input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="2547XXXXXXXX"
                  className="bg-[#323738] border-[#414647] text-white mb-3"
                />
                <Button
                  onClick={handleSavePhone}
                  disabled={savingPhone}
                  className="w-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                >
                  {savingPhone ? 'Saving...' : 'Save Number'}
                </Button>
              </div>
            )}

            {storedPhone && flowState === 'form' && (
              <div className="bg-[#151717] rounded-lg p-4 border border-[#323738]">
                <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Deposit — {maskPhone(storedPhone)}
                </h2>

                {/* Provider tabs */}
                <div className="flex gap-2 mb-5">
                  {PROVIDERS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setProvider(p.value)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                        provider === p.value
                          ? 'bg-red-600 border-red-500 text-white'
                          : 'bg-[#323738] border-[#414647] text-gray-300 hover:bg-[#414647]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="mb-6">
                  <Label className="text-gray-300 mb-2 block text-xs">Amount (KES)</Label>
                  <Input
                    type="number"
                    value={amountKes}
                    onChange={(e) => setAmountKes(e.target.value)}
                    className="bg-[#323738] border-[#414647] text-white text-lg"
                    placeholder="1300"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    ≈ USD {isNaN(Number(estimatedUsd)) ? '0.00' : estimatedUsd} credited to your account
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {['650', '1300', '3250', '6500'].map((preset) => (
                      <Button
                        key={preset}
                        variant="ghost"
                        onClick={() => setAmountKes(preset)}
                        className="bg-[#323738] hover:bg-[#414647] text-gray-300 text-sm"
                      >
                        {preset}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-base"
                >
                  {provider === 'paystack' ? 'Pay with Paystack' : 'Send M-Pesa Request'}
                </Button>
              </div>
            )}

            {flowState === 'waiting' && (
              <div className="bg-[#151717] rounded-lg p-8 border border-[#323738] text-center">
                <Loader2 className="h-10 w-10 text-red-500 animate-spin mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">Check your phone</h3>
                <p className="text-gray-400 text-sm">
                  Enter your M-Pesa PIN on the prompt sent to {storedPhone ? maskPhone(storedPhone) : 'your phone'} to approve the payment of KES {amountKes}.
                </p>
                <p className="text-gray-500 text-xs mt-4">This page updates automatically once confirmed.</p>
              </div>
            )}

            {flowState === 'success' && (
              <div className="bg-[#151717] rounded-lg p-8 border border-[#323738] text-center">
                <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">Deposit successful</h3>
                <p className="text-gray-400 text-sm mb-4">{resultMessage}</p>
                <Button onClick={resetFlow} className="bg-red-600 hover:bg-red-700 text-white">
                  Make another deposit
                </Button>
              </div>
            )}

            {flowState === 'failed' && (
              <div className="bg-[#151717] rounded-lg p-8 border border-[#323738] text-center">
                <XCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">Deposit not completed</h3>
                <p className="text-gray-400 text-sm mb-4">{resultMessage}</p>
                <Button onClick={resetFlow} className="bg-red-600 hover:bg-red-700 text-white">
                  Try again
                </Button>
              </div>
            )}

            <div className="bg-[#151717] rounded-lg p-4 border border-[#323738]">
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Security & Safety
              </h3>
              <ul className="space-y-1.5 text-xs text-gray-400">
                <li>• Payments processed via M-Pesa STK push (direct or via Paystack)</li>
                <li>• You approve every payment with your own PIN</li>
                <li>• Your M-Pesa number is linked once, only to your account</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <MobileBottomNav onMenuClick={() => setIsSidebarOpen(true)} />
    </div>
  );
};

export default Deposit;
