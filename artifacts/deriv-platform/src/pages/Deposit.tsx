import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

const KES_PER_USD = 130;
const PAYSTACK_INLINE_SRC = 'https://js.paystack.co/v1/inline.js';

const PROVIDER_LABELS: Record<DepositProvider, string> = {
  mpesa: 'M-Pesa',
  paystack: 'Paystack',
  card: 'Card',
};

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: {
        key: string;
        email: string;
        amount: number;
        currency: string;
        ref: string;
        onClose?: () => void;
        callback?: (response: { reference: string }) => void;
      }) => { openIframe: () => void };
    };
  }
}

function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${PAYSTACK_INLINE_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Paystack')));
      return;
    }
    const script = document.createElement('script');
    script.src = PAYSTACK_INLINE_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Paystack'));
    document.body.appendChild(script);
  });
}

function maskPhone(phone: string): string {
  return `${phone.slice(0, 3)}${'•'.repeat(phone.length - 5)}${phone.slice(-2)}`;
}

const Deposit = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const provider: DepositProvider =
    (location.state as { provider?: DepositProvider } | null)?.provider ?? 'mpesa';
  const isCard = provider === 'card';

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [balanceRefreshKey, setBalanceRefreshKey] = useState(0);
  const account = getStoredAccount();
  const [storedPhone, setStoredPhone] = useState(getStoredUser()?.phoneNumber ?? null);

  const [phoneInput, setPhoneInput] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  const [amountUsd, setAmountUsd] = useState('10');
  const [flowState, setFlowState] = useState<FlowState>('form');
  const [resultMessage, setResultMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const balance = account
    ? `${account.currency} ${Number(account.balance).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : '—';

  const parsedUsd = parseFloat(amountUsd);
  const kesAmount = Number.isFinite(parsedUsd) && parsedUsd > 0 ? parsedUsd * KES_PER_USD : 0;
  const kesDisplay = kesAmount.toLocaleString('en-US', { maximumFractionDigits: 0 });

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

  const startPolling = (reference: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const status = await checkDepositStatus(reference);
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
  };

  const handleSubmit = async () => {
    if (!account) {
      toast.error('Please log in first.');
      return;
    }
    if (!parsedUsd || parsedUsd <= 0) {
      toast.error('Enter a valid amount.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await initiateDeposit({
        accountId: account.id,
        amountKes: kesAmount,
        provider,
      });

      if (isCard) {
        if (!result.publicKey || !result.email) {
          toast.error('Card payments are not available right now.');
          return;
        }
        await loadPaystackScript();
        if (!window.PaystackPop) {
          toast.error('Could not load the card payment popup. Please try again.');
          return;
        }

        window.PaystackPop.setup({
          key: result.publicKey,
          email: result.email,
          amount: Math.round(kesAmount * 100),
          currency: 'KES',
          ref: result.checkoutRequestId,
          onClose: () => {
            // user closed the popup without paying — stay on the form
          },
          callback: () => {
            setFlowState('waiting');
            toast.success('Confirming your payment...');
            startPolling(result.checkoutRequestId);
          },
        }).openIframe();
      } else {
        setFlowState('waiting');
        toast.success('Request sent — approve it on your phone.');
        startPolling(result.checkoutRequestId);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start deposit');
    } finally {
      setSubmitting(false);
    }
  };

  const resetFlow = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setFlowState('form');
    setResultMessage('');
  };

  const buttonLabel = isCard ? 'Pay with Card' : provider === 'paystack' ? 'Pay with Paystack' : 'Send M-Pesa Request';
  const showPhoneGate = !isCard && !storedPhone;
  const showForm = (isCard || storedPhone) && flowState === 'form';

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

            {showPhoneGate && (
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

            {showForm && (
              <div className="bg-[#151717] rounded-lg p-4 border border-[#323738]">
                <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center">
                  <Smartphone className="h-4 w-4 mr-2" />
                  {PROVIDER_LABELS[provider]}
                  {!isCard && storedPhone ? ` — ${maskPhone(storedPhone)}` : ''}
                </h2>

                <div className="mb-6">
                  <Label className="text-gray-300 mb-2 block text-xs">Amount (USD)</Label>
                  <Input
                    type="number"
                    value={amountUsd}
                    onChange={(e) => setAmountUsd(e.target.value)}
                    className="bg-[#323738] border-[#414647] text-white text-lg"
                    placeholder="10"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    = {kesDisplay} KES will be charged (rate: {KES_PER_USD} KES/USD)
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {['5', '10', '25', '50'].map((preset) => (
                      <Button
                        key={preset}
                        variant="ghost"
                        onClick={() => setAmountUsd(preset)}
                        className="bg-[#323738] hover:bg-[#414647] text-gray-300 text-sm"
                      >
                        ${preset}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-base disabled:opacity-50"
                >
                  {submitting ? 'Please wait...' : buttonLabel}
                </Button>

                <button
                  type="button"
                  onClick={() => navigate('/deposit', { state: null, replace: true })}
                  className="w-full text-center text-xs text-gray-500 hover:text-gray-300 mt-3"
                >
                  Change payment method
                </button>
              </div>
            )}

            {flowState === 'waiting' && (
              <div className="bg-[#151717] rounded-lg p-8 border border-[#323738] text-center">
                <Loader2 className="h-10 w-10 text-red-500 animate-spin mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">
                  {isCard ? 'Confirming your payment' : 'Check your phone'}
                </h3>
                <p className="text-gray-400 text-sm">
                  {isCard
                    ? `We're confirming your card payment of KES ${kesDisplay} — this usually takes a few seconds.`
                    : `Enter your M-Pesa PIN on the prompt sent to ${storedPhone ? maskPhone(storedPhone) : 'your phone'} to approve the payment of KES ${kesDisplay}.`}
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
                <li>• Payments processed via M-Pesa STK push or Paystack card checkout</li>
                <li>• Card details are entered directly on Paystack's secure popup — we never see them</li>
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
