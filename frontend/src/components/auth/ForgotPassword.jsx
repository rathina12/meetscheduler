import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // In production: call POST /api/auth/forgot-password
    await new Promise(r => setTimeout(r, 1000));
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Calendar size={28} /> MeetScheduler
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle size={56} style={{ color: '#10b981', margin: '0 auto 16px', display: 'block' }} />
            <h2 style={{ fontWeight: 700, marginBottom: '8px' }}>Check your email</h2>
            <p className="text-muted text-sm" style={{ marginBottom: '24px', lineHeight: 1.6 }}>
              If an account exists for <strong>{email}</strong>, we've sent a password reset link.
              Check your inbox and spam folder.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex', justifyContent: 'center' }}>
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="auth-title">Forgot password?</h1>
            <p className="auth-subtitle">Enter your email and we'll send a reset link</p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="email" className="form-input" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    style={{ paddingLeft: '38px' }} required />
                </div>
              </div>

              <button className="btn btn-primary w-full" type="submit" disabled={loading}
                style={{ justifyContent: 'center', padding: '12px' }}>
                {loading ? 'Sending...' : '📧 Send Reset Link'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link to="/login" style={{ color: 'var(--text-muted)', fontSize: '0.875rem',
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
