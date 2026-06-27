import { useState } from 'react';
import { Mail, X, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function EmailVerificationBanner() {
  const { user, emailVerified, resendVerificationEmail, refreshAuthUser } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');

  if (!user || emailVerified || dismissed) return null;

  const handleResend = async () => {
    setSending(true);
    setMessage('');
    try {
      await resendVerificationEmail();
      setMessage('Verification email sent. Check your inbox.');
    } catch (err) {
      setMessage(err.message || 'Failed to send verification email.');
    } finally {
      setSending(false);
    }
  };

  const handleRefresh = async () => {
    setChecking(true);
    setMessage('');
    try {
      const updated = await refreshAuthUser();
      if (updated?.emailVerified) {
        setMessage('Email verified successfully.');
      } else {
        setMessage('Email not verified yet. Check your inbox.');
      }
    } catch (err) {
      setMessage(err.message || 'Could not refresh verification status.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 md:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Mail className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-amber-900">Verify your email address</p>
            <p className="text-xs text-amber-800 mt-0.5">
              We sent a link to <span className="font-medium">{user.email}</span>.
              Please verify to secure your account.
            </p>
            {message && <p className="text-xs text-amber-700 mt-1">{message}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResend}
            disabled={sending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-amber-300 text-amber-900 rounded-lg hover:bg-amber-100 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${sending ? 'animate-spin' : ''}`} />
            {sending ? 'Sending…' : 'Resend email'}
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={checking}
            className="px-3 py-1.5 text-xs font-medium text-amber-900 hover:underline disabled:opacity-50"
          >
            {checking ? 'Checking…' : 'I verified'}
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1.5 text-amber-700 hover:bg-amber-100 rounded-lg"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
