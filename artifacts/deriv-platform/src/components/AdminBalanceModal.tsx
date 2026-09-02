import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { adjustUserBalance, type AdminAccount } from '@/lib/admin-api';

interface AdminBalanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminKey: string;
  userId: number;
  userEmail: string;
  accounts: AdminAccount[];
  onSuccess: () => void;
}

const AdminBalanceModal = ({
  open,
  onOpenChange,
  adminKey,
  userId,
  userEmail,
  accounts,
  onSuccess,
}: AdminBalanceModalProps) => {
  const [accountId, setAccountId] = useState<number | ''>(accounts[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const amountNum = Number(amount);
  const isValid = accountId !== '' && amount !== '' && Number.isFinite(amountNum) && amountNum !== 0;

  const handleSubmit = async () => {
    if (!isValid || accountId === '') return;
    setSubmitting(true);
    try {
      await adjustUserBalance(adminKey, userId, {
        accountId: Number(accountId),
        amount: amountNum,
        note: note.trim() || undefined,
      });
      toast.success(`Balance ${amountNum >= 0 ? 'credited' : 'debited'} for ${userEmail}`);
      setAmount('');
      setNote('');
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to adjust balance');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#151717] border-[#323738] text-white sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#323738] space-y-1">
          <DialogTitle className="text-xl font-bold text-white">Adjust Balance</DialogTitle>
          <DialogDescription className="text-gray-400">{userEmail}</DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Account</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(Number(e.target.value))}
              className="w-full bg-[#0e0e0e] border border-[#323738] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-500"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.type.toUpperCase()} — {a.currency} {a.balance}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Amount (positive credits, negative debits)</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 50 or -20"
              className="w-full bg-[#0e0e0e] border border-[#323738] rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:border-gray-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Bank transfer top-up"
              className="w-full bg-[#0e0e0e] border border-[#323738] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-500"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="w-full py-3 rounded-lg bg-red-500 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-600 transition-colors"
          >
            {submitting ? 'Submitting…' : 'Apply'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminBalanceModal;
