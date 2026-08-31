import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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
    }
  }, [open]);

  const amountNum = Number(amount);
  const isValidAmount = amount !== '' && Number.isFinite(amountNum) && amountNum >= 5;
  const kesEquivalent = rate && isValidAmount ? amountNum * rate : null;

  const handleSubmit = async () => {
    if (!accountId || !isValidAmount) return;
    setSubmitting(true);
    try {
      const result = await initiateWithdraw({ accountId, amountUsd: amountNum });
      toast.success(result.message);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Withdrawal failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#151717] border-[#323738] text-white sm:max-w-md p-0 overflow-hidden">
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
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawModal;
