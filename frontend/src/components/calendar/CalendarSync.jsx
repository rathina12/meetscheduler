import { useState, useEffect } from 'react';
import { calendarAPI } from '../../services/api';
import { formatRelative } from '../../utils/helpers';
import { Link2, RefreshCw, CheckCircle, XCircle, AlertCircle, ExternalLink, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CalendarSync() {
  const [integration, setIntegration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => { loadIntegration(); }, []);

  const loadIntegration = async () => {
    setLoading(true);
    try {
      const { data } = await calendarAPI.getIntegrations();
      const google = (data.data || []).find(i => i.provider === 'GOOGLE');
      setIntegration(google || null);
    } catch {}
    setLoading(false);
  };

  const handleConnect = async () => {
    try {
      const { data } = await calendarAPI.getGoogleAuthUrl();
      window.location.href = data.authUrl;
    } catch { toast.error('Failed to get auth URL'); }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect Google Calendar?')) return;
    try {
      await calendarAPI.disconnect('google');
      toast.success('Disconnected');
      setIntegration(null);
    } catch {}
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data } = await calendarAPI.sync();
      toast.success(`Sync completed — ${data.data.synced} events`);
      loadIntegration();
    } catch { toast.error('Sync failed'); }
    setSyncing(false);
  };

  const isConnected = integration?.syncStatus === 'CONNECTED';

  return (
    <div>
      <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Calendar Sync</h1>
          <p className="text-muted text-sm">Connect Google Calendar for two-way sync</p>
        </div>
        {isConnected && (
          <button className="btn btn-primary" onClick={handleSync} disabled={syncing}>
            <RefreshCw size={16} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        )}
      </div>

      {/* Google "hasn't verified" explanation */}
      <div className="card" style={{ marginBottom: '20px', background: '#eff6ff',
        border: '1px solid #bfdbfe' }}>
        <div className="flex gap-3 items-start">
          <Info size={20} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: '8px', color: '#1e40af', fontSize: '0.95rem' }}>
              About "Google hasn't verified this app"
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#1e3a8a', lineHeight: 1.7 }}>
              This warning appears because the app is in <strong>development/testing mode</strong>.
              It does <strong>NOT</strong> mean the app is unsafe — it just means the app hasn't gone
              through Google's formal review process yet.
            </p>
            <p style={{ fontSize: '0.875rem', color: '#1e3a8a', lineHeight: 1.7, marginTop: '8px' }}>
              <strong>To bypass this:</strong> On the warning screen, click
              <strong> "Advanced"</strong> → then click
              <strong> "Go to MeetScheduler (unsafe)"</strong>.
              This is safe for your own app.
            </p>
            <p style={{ fontSize: '0.8rem', color: '#3b82f6', marginTop: '8px' }}>
              Or add your email as a Test User in Google Cloud Console → OAuth consent screen → Test users.
            </p>
          </div>
        </div>
      </div>

      {/* Google Calendar card */}
      <div className="card" style={{ maxWidth: '520px', marginBottom: '20px' }}>
        <div className="flex gap-3 items-center" style={{ marginBottom: '16px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '12px',
            background: '#e8f0fe', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '26px' }}>
            🗓️
          </div>
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: '4px' }}>Google Calendar</h3>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px',
              fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '99px',
              background: isConnected ? '#dcfce7' : '#f1f5f9',
              color: isConnected ? '#16a34a' : '#64748b' }}>
              {isConnected ? <CheckCircle size={12} /> : <XCircle size={12} />}
              {isConnected ? 'CONNECTED' : 'NOT CONNECTED'}
            </span>
          </div>
        </div>

        <p className="text-sm text-muted" style={{ marginBottom: '16px', lineHeight: 1.6 }}>
          Sync your MeetScheduler meetings with Google Calendar automatically.
          Events will appear in both apps.
        </p>

        {isConnected && integration?.lastSyncedAt && (
          <div style={{ padding: '10px', background: 'var(--bg)', borderRadius: '8px',
            marginBottom: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Last synced: {formatRelative(integration.lastSyncedAt)}
          </div>
        )}

        <div className="flex gap-2">
          {isConnected ? (
            <>
              <button className="btn btn-secondary btn-sm" onClick={handleSync} disabled={syncing}>
                <RefreshCw size={14} /> Sync
              </button>
              <button className="btn btn-sm" onClick={handleDisconnect}
                style={{ background: '#fee2e2', color: '#dc2626', border: 'none' }}>
                <XCircle size={14} /> Disconnect
              </button>
            </>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={handleConnect}>
              <Link2 size={14} /> Connect Google Calendar <ExternalLink size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Step-by-step fix for Google warning */}
      <div className="card">
        <h3 style={{ fontWeight: 600, marginBottom: '16px', fontSize: '0.95rem' }}>
          🔧 Step-by-step: Fix "Google hasn't verified this app"
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { n: '1', title: 'Click "Connect Google Calendar" above', desc: 'You will be redirected to Google login' },
            { n: '2', title: 'On Google warning screen — click "Advanced"', desc: 'The link is small, at the bottom left of the warning' },
            { n: '3', title: 'Click "Go to MeetScheduler (unsafe)"', desc: 'Despite the label, this is your own app and is safe' },
            { n: '4', title: 'Allow the calendar permissions', desc: 'Click "Allow" to grant calendar access' },
            { n: '5', title: 'You\'re connected!', desc: 'Status will show CONNECTED and you can sync meetings' },
          ].map(({ n, title, desc }) => (
            <div key={n} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%',
                background: 'var(--primary)', color: '#fff', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem',
                fontWeight: 700, flexShrink: 0 }}>{n}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '20px', padding: '12px', background: 'var(--bg)',
          borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <strong>Alternative:</strong> Go to{' '}
          <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer"
            style={{ color: 'var(--primary)' }}>console.cloud.google.com</a>
          {' '}→ OAuth consent screen → Test users → Add your email. This permanently removes the warning.
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
