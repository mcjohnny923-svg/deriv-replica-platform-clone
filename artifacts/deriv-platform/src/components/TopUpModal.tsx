import { useNavigate } from 'react-router-dom';
import { Smartphone, Zap, CreditCard, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { DepositProvider } from '@/lib/payments-api';

interface TopUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TopUpModal = ({ open, onOpenChange }: TopUpModalProps) => {
  const navigate = useNavigate();

  const goToDeposit = (provider: DepositProvider) => {
    onOpenChange(false);
    navigate('/deposit', { state: { provider } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#151717] border-[#323738] text-white sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#323738] space-y-1">
          <DialogTitle className="text-xl font-bold text-white">Top Up Funds</DialogTitle>
          <DialogDescription className="text-gray-400">Choose payment method</DialogDescription>
        </DialogHeader>

        <div className="p-4 space-y-3">
          <button
            type="button"
            onClick={() => goToDeposit('mpesa')}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-[#323738] hover:bg-[#1c1f1f] transition-colors"
          >
            <div className="w-11 h-11 rounded-lg bg-[#232728] flex items-center justify-center shrink-0">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-white font-semibold">M-Pesa</div>
              <div className="text-gray-400 text-sm">Mobile Money</div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-500" />
          </button>

          <button
            type="button"
            onClick={() => goToDeposit('paystack')}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-[#323738] hover:bg-[#1c1f1f] transition-colors"
          >
            <div className="w-11 h-11 rounded-lg bg-[#232728] flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-white font-semibold">Paystack</div>
              <div className="text-gray-400 text-sm">Mobile Money</div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-500" />
          </button>

          <button
            type="button"
            onClick={() => goToDeposit('card')}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-[#323738] hover:bg-[#1c1f1f] transition-colors"
          >
            <div className="w-11 h-11 rounded-lg bg-[#232728] flex items-center justify-center shrink-0">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-white font-semibold">Credit / Debit Card</div>
              <div className="text-gray-400 text-sm">Visa, Mastercard</div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TopUpModal;
