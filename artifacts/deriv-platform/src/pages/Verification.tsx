import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import DerivHeader from '@/components/DerivHeader';
import DerivSidebar from '@/components/DerivSidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import {
  getVerificationStatus,
  uploadVerificationDoc,
  type VerificationStatus,
} from '@/lib/verification-api';

const SLOTS = [
  { type: 'identity', title: 'Proof of identity', hint: 'National ID, passport or driving licence' },
  {
    type: 'address',
    title: 'Proof of address',
    hint: 'Utility bill or bank statement dated within the last 3 months',
  },
] as const;

const MAX_BYTES = 5 * 1024 * 1024;

const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = () => reject(new Error('Could not read the file'));
    r.readAsDataURL(file);
  });

const badge = (status: string) => {
  if (status === 'approved') return 'bg-green-600/20 text-green-500';
  if (status === 'rejected') return 'bg-red-600/20 text-red-500';
  return 'bg-yellow-600/20 text-yellow-500';
};

const label = (status: string) =>
  status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Pending review';

const Verification = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  const load = async () => {
    try {
      setStatus(await getVerificationStatus());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleFile = async (type: 'identity' | 'address', file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error('File must be under 5 MB');
      return;
    }
    setUploading(type);
    try {
      const data = await toBase64(file);
      await uploadVerificationDoc({ docType: type, fileName: file.name, data });
      toast.success('Document submitted for review');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0e0e0e] text-gray-900 dark:text-white flex flex-col">
      <DerivHeader onMenuClick={() => setIsSidebarOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <DerivSidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex-1 overflow-y-auto pb-20 md:pb-6">
          <div className="max-w-2xl mx-auto p-4 space-y-4">
            <h1 className="text-2xl font-bold">Verification</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Upload clear photos or PDFs (JPG, PNG or PDF, max 5 MB). Your documents are private and
              are only seen by our verification team. Rejected documents are deleted immediately, and approved documents are deleted 30 days after approval.
            </p>

            {SLOTS.map((slot) => {
              const doc = status ? status[slot.type] : null;
              const canUpload = !doc || doc.status === 'rejected';
              return (
                <div
                  key={slot.type}
                  className="bg-white dark:bg-[#151717] rounded-lg p-4 border border-gray-200 dark:border-[#323738]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{slot.title}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">{slot.hint}</div>
                    </div>
                    <span
                      className={
                        'text-xs px-2 py-1 rounded ' +
                        (doc ? badge(doc.status) : 'bg-gray-200 dark:bg-[#323738] text-gray-500')
                      }
                    >
                      {doc ? label(doc.status) : 'Not submitted'}
                    </span>
                  </div>

                  {doc && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      {doc.fileName === 'deleted' ? 'File removed after review' : doc.fileName} · {new Date(doc.createdAt).toLocaleDateString()}
                    </div>
                  )}
                  {doc?.status === 'rejected' && doc.rejectReason && (
                    <div className="text-xs text-red-500 mt-2">Reason: {doc.rejectReason}</div>
                  )}

                  {canUpload && (
                    <label className="mt-3 inline-block">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        className="hidden"
                        disabled={uploading === slot.type}
                        onChange={(e) => {
                          handleFile(slot.type, e.target.files?.[0]);
                          e.target.value = '';
                        }}
                      />
                      <span className="cursor-pointer inline-block px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white text-sm">
                        {uploading === slot.type
                          ? 'Uploading...'
                          : doc?.status === 'rejected'
                            ? 'Upload again'
                            : 'Upload document'}
                      </span>
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <MobileBottomNav onMenuClick={() => setIsSidebarOpen(true)} />
    </div>
  );
};

export default Verification;
