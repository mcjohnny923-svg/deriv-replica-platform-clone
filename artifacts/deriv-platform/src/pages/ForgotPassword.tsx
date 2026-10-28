import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { requestPasswordReset, confirmPasswordReset } from '@/lib/auth-api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      toast.success('If that email has an account, a code has been sent.');
      setStep('code');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await confirmPasswordReset({ email: email.trim(), code: code.trim(), newPassword });
      toast.success('Password changed. Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-2xl font-bold text-white text-center">Reset your password</h1>

        {step === 'email' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Enter your account email and we will send you a 6-digit code.
            </p>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button
              onClick={sendCode}
              disabled={loading || !email}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? 'Sending...' : 'Send code'}
            </Button>
          </div>
        )}

        {step === 'code' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Enter the code we sent to {email}. It expires in 15 minutes. Check your spam folder too.
            </p>
            <Input
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            />
            <Input
              type="password"
              placeholder="New password (min 8 characters)"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <Button
              onClick={reset}
              disabled={loading || code.length !== 6 || !newPassword || !confirm}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? 'Saving...' : 'Reset password'}
            </Button>
            <button
              type="button"
              onClick={() => setStep('email')}
              className="text-sm text-gray-400 hover:text-white w-full"
            >
              Send a new code
            </button>
          </div>
        )}

        <div className="text-center">
          <Link to="/login" className="text-sm text-red-500 hover:text-red-400">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
