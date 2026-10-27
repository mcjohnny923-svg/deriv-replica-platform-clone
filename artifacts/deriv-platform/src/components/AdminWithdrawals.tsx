import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  fetchPartnerWithdrawals,
  resolvePartnerWithdrawal,
  type AdminPartnerWithdrawal,
} from '@/lib/admin-api';

const AdminWithdrawals = ({ adminKey }: { adminKey: string }) => {
  const [rows, setRows] = useState<AdminPartnerWithdrawal[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    try {
      setRows(await fetchPartnerWithdrawals(adminKey));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load requests');
    }
  };

  useEffect(() => {
    load();
  }, [adminKey]);

  const resolve = async (row: AdminPartnerWithdrawal, action: 'paid' | 'return') => {
    const msg =
      action === 'paid'
        ? 'Confirm you have paid USD ' + row.amount + ' to ' + row.email + '?'
        : 'Return USD ' + row.amount + ' to ' + row.email + "'s available balance?";
    if (!window.confirm(msg)) return;
    setBusyId(row.id);
    try {
      await resolvePartnerWithdrawal(adminKey, row.id, action);
      toast.success(action === 'paid' ? 'Marked as paid' : 'Returned to partner');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusyId(null);
    }
  };

  const pending = rows.filter((r) => r.status === 'pending');
  const history = rows.filter((r) => r.status !== 'pending');

  return (
    <div className="mb-6 bg-white dark:bg-[#151717] rounded-lg border border-gray-200 dark:border-[#323738] p-4">
      <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">
        Withdrawal requests ({pending.length} pending)
      </h2>

      {pending.length === 0 && (
        <div className="text-sm text-gray-400 dark:text-gray-500">No pending requests.</div>
      )}

      {pending.map((r) => (
        <div
          key={r.id}
          className="flex flex-wrap items-center justify-between gap-3 py-3 border-t border-gray-200 dark:border-[#323738]"
        >
          <div className="text-sm">
            <div className="font-medium text-gray-900 dark:text-white">
              {r.email}
              {r.fullName ? ' · ' + r.fullName : ''}
            </div>
            <div className="text-gray-400 dark:text-gray-500">
              Phone: {r.phoneNumber ?? 'none on file'} · {new Date(r.createdAt).toLocaleString()}
            </div>
          </div>
          <div className="text-lg font-bold text-green-500">${r.amount}</div>
          <div className="flex gap-2">
            <button
              disabled={busyId === r.id}
              onClick={() => resolve(r, 'paid')}
              className="px-3 py-1.5 rounded bg-green-600 hover:bg-green-700 text-white text-sm disabled:opacity-50"
            >
              Mark as paid
            </button>
            <button
              disabled={busyId === r.id}
              onClick={() => resolve(r, 'return')}
              className="px-3 py-1.5 rounded bg-gray-200 dark:bg-[#323738] text-gray-900 dark:text-white text-sm disabled:opacity-50"
            >
              Return to partner
            </button>
          </div>
        </div>
      ))}

      {history.length > 0 && (
        <details className="mt-3">
          <summary className="text-xs text-gray-400 dark:text-gray-500 cursor-pointer">
            History ({history.length})
          </summary>
          {history.map((r) => (
            <div key={r.id} className="text-xs text-gray-500 dark:text-gray-400 py-1">
              {r.email} · ${r.amount} · {r.status === 'paid' ? 'Paid' : 'Returned'}
              {r.resolvedAt ? ' · ' + new Date(r.resolvedAt).toLocaleString() : ''}
            </div>
          ))}
        </details>
      )}
    </div>
  );
};

export default AdminWithdrawals;
