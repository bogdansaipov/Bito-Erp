import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate(res.data.user.role === 'ADMIN' ? '/report' : '/products');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: 420,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 40,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 52,
            height: 52,
            background: 'var(--accent)',
            borderRadius: 14,
            marginBottom: 16,
            fontSize: 24,
          }}>🏪</div>
          <h1 style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text)',
            letterSpacing: '-0.3px',
          }}>BITO POS</h1>
          <p style={{ color: 'var(--text-2)', marginTop: 4, fontSize: 13 }}>
            Sign in to your workspace
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            color: '#ef4444',
            fontSize: 13,
            marginBottom: 20,
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-2)',
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="you@company.com"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text)',
                fontSize: 14,
                outline: 'none',
                fontFamily: 'Inter, sans-serif',
              }}
            />
          </div>
          <div>
            <label style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-2)',
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text)',
                fontSize: 14,
                outline: 'none',
                fontFamily: 'Inter, sans-serif',
              }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              marginTop: 8,
              padding: '12px',
              background: loading ? 'var(--surface-2)' : 'var(--accent)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>

        {/* Demo credentials */}
        <div style={{
          marginTop: 28,
          padding: 16,
          background: 'var(--surface-2)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)',
        }}>
          <p style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-3)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 8,
          }}>Demo accounts</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { label: 'Cashier', email: 'cashier@coffee.com' },
              { label: 'Admin', email: 'admin@coffee.com' },
            ].map(({ label, email: e }) => (
              <button
                key={e}
                onClick={() => { setEmail(e); setPassword('password123'); }}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 10px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  color: 'var(--text-2)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{label}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{e}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}