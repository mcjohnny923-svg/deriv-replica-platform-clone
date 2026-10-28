import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  fetchVerificationDocs,
  fetchVerificationFile,
  reviewVerificationDoc,
  type AdminVerificationDoc,
} from '@/lib/admin-api';

const typeLabel = (t: string) => (t === 'identity' ? 'Proof of identity' : 'Proof of address');

const AdminVerification = ({ adminKey }: { adminKey: string }) => {
  const [rows, setRows] = useState<AdminVerificationDoc[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    try {
      setRows(await fetchVerificationDocs(adminKey));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load documents');
    }
  };

  useEffect(() => {
    load();
  }, [adminKey]);

  const view = async (row: AdminVerificationDoc) => {
    const w = window.open('', '_blank');
    try {
      const f = await fetchVerificationFile(adminKey, row.id);
      const bytes = Uint8Array.from(atob(f.data), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: f.mimeType }));
      if (w) w.location.href = url;
    } catch (err) {
      if (w) w.close();
      toast.error(err instanceof Error ? err.message : 'Failed to open file');
    }
  };

  const review = async (row: AdminVerificationDoc, action: 'approve' | 'reject') => {
    let reason: string | undefined;
    if (action === 'reject') {
      const r = window.prompt('Reason for rejecting (the user will see this):');
      if (!r || !r.trim()) return;
      reason = r.trim();
    } else if (!window.confirm('Approve ' + typeLabel(row.docType) + ' for ' + row.email + '?')) {
      return;
    }
    setBusyId(row.id);
    try {
      await reviewVerificationDoc(adminKey, row.id, action, reason);
      toast.success(action === 'approve' ? 'Approved' : 'Rejected');
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
        Verification documents ({pending.length} pending)
      </h2>

      {pending.length === 0 && (
        <div className="text-sm text-gray-400 dark:text-gray-500">No documents waiting for review.</div>
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
              {typeLabel(r.docType)} · {r.fileName} · {new Date(r.createdAt).toLocaleString()}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => view(r)}
              className="px-3 py-1.5 rounded bg-gray-200 dark:bg-[#323738] text-gray-900 dark:text-white text-sm"
            >
              View
            </button>
            <button
              disabled={busyId === r.id}
              onClick={() => review(r, 'approve')}
              className="px-3 py-1.5 rounded bg-green-600 hover:bg-green-700 text-white text-sm disabled:opacity-50"
            >
              Approve
            </button>
            <button
              disabled={busyId === r.id}
              onClick={() => review(r, 'reject')}
              className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-sm disabled:opacity-50"
            >
              Reject
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
              {r.email} · {typeLabel(r.docType)} · {r.status === 'approved' ? 'Approved' : 'Rejected'}
              {r.rejectReason ? ' (' + r.rejectReason + ')' : ''}
              {r.reviewedAt ? ' · ' + new Date(r.reviewedAt).toLocaleString() : ''}
            </div>
          ))}
        </details>
      )}
    </div>
  );
};

export default AdminVerification;
