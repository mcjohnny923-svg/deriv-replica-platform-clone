import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { initiateWithdraw, getExchangeRate } from '@/lib/payments-api';

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: number | undefined;
}

const WithdrawModal = ({ open, onOpenChange, accountId }: WithdrawModalProps) => {
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [submittedAmount, setSubmittedAmount] = useState('');

  useEffect(() => {
    if (!open) return;
    getExchangeRate()
      .then((res) => setRate(res.rate))
      .catch(() => setRate(null));
  }, [open]);

  useEffect(() => {
    if (!open) {
      setAmount('');
      setSubmitting(false);
      setSucceeded(false);
      setSubmittedAmount('');
    }
  }, [open]);

  const amountNum = Number(amount);
  const isValidAmount = amount !== '' && Number.isFinite(amountNum) && amountNum >= 5;
  const kesEquivalent = rate && isValidAmount ? amountNum * rate : null;

  const handleSubmit = async () => {
    if (!accountId || !isValidAmount) return;
    setSubmitting(true);
    try {
      await initiateWithdraw({ accountId, amountUsd: amountNum });
      setSubmittedAmount(amountNum.toFixed(2));
      setSucceeded(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Withdrawal failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#151717] border-[#323738] text-white sm:max-w-md p-0 overflow-hidden">
        {succeeded ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-9 w-9 text-green-500" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Withdrawal successful!</h3>
            <p className="text-gray-400 text-sm">
              Your withdrawal request of ${submittedAmount} has been submitted.
            </p>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-full mt-6 py-3 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#323738] space-y-1">
              <DialogTitle className="text-xl font-bold text-white">Withdraw Funds</DialogTitle>
              <DialogDescription className="text-gray-400">Minimum withdrawal is $5.00</DialogDescription>
            </DialogHeader>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="withdraw-amount" className="text-sm text-gray-400">
                  Amount (USD)
                </label>
                <input
                  id="withdraw-amount"
                  type="number"
                  min="5"
                  step="0.01"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="5.00"
                  className="w-full bg-[#0e0e0e] border border-[#323738] rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:border-gray-500"
                />
                <div className="text-sm text-gray-400 min-h-[1.25rem]">
                  {kesEquivalent !== null
                    ? `≈ KES ${kesEquivalent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : amount && !isValidAmount
                      ? 'Minimum withdrawal is $5.00'
                      : rate === null
                        ? 'Loading exchange rate…'
                        : ''}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isValidAmount || submitting}
                className="w-full py-3 rounded-lg bg-red-500 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-600 transition-colors"
              >
                {submitting ? 'Submitting…' : 'Request Withdrawal'}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawModal;
