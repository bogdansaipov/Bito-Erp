import { useState } from 'react';
import api from '../api/axios';
import { ReportResult } from '../types';
import { useAuth } from '../context/AuthContext';

export default function ReportPage() {
  const [from, setFrom] = useState('2024-01-01');
  const [to, setTo] = useState('2026-12-31');
  const [report, setReport] = useState<ReportResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { logout, user } = useAuth();

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/reports/sales', { params: { from, to } });
      setReport(res.data);
    } catch {
      setError('Failed to fetch report. Make sure you have paid orders in this date range.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* Sidebar */}
      <div style={{
        width: 220,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: 20,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 34, height: 34,
            background: 'var(--accent)',
            borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>🏪</div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>BITO POS</span>
        </div>

        <nav style={{ flex: 1 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px',
            background: 'var(--accent-dim)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--accent)',
            fontWeight: 600, fontSize: 13,
          }}>
            <span>📊</span> Sales Report
          </div>
        </nav>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Admin
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 12 }}>
            {user?.email}
          </div>
          <button
            onClick={logout}
            style={{
              width: '100%', padding: '8px 12px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-2)', cursor: 'pointer',
              fontSize: 13, fontFamily: 'Inter, sans-serif',
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
        <div style={{ maxWidth: 900 }}>

          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Sales Report</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 28 }}>
            Aggregated revenue and margin data for your business
          </p>

          {/* Date range picker */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28,
            padding: 16,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
          }}>
            <span style={{ fontSize: 13, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>Date range</span>
            <input
              type="date"
              value={from}
              onChange={e => setFrom(e.target.value)}
              style={{
                padding: '8px 12px',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text)',
                fontSize: 13,
                outline: 'none',
                fontFamily: 'Inter, sans-serif',
              }}
            />
            <span style={{ color: 'var(--text-3)' }}>→</span>
            <input
              type="date"
              value={to}
              onChange={e => setTo(e.target.value)}
              style={{
                padding: '8px 12px',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text)',
                fontSize: 13,
                outline: 'none',
                fontFamily: 'Inter, sans-serif',
              }}
            />
            <button
              onClick={fetchReport}
              disabled={loading}
              style={{
                padding: '8px 20px',
                background: 'var(--accent)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: 'white',
                fontWeight: 600,
                fontSize: 13,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
                opacity: loading ? 0.7 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              {loading ? 'Loading...' : 'Generate'}
            </button>
          </div>

          {error && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 'var(--radius-sm)',
              color: '#ef4444',
              fontSize: 13,
              marginBottom: 20,
            }}>{error}</div>
          )}

          {report && (
            <>
              {/* Summary cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
                marginBottom: 28,
              }}>
                {[
                  {
                    label: 'Total Revenue',
                    value: `$${report.totalRevenue.toFixed(2)}`,
                    icon: '💰',
                    color: 'var(--accent)',
                  },
                  {
                    label: 'Total Margin',
                    value: `$${report.totalMargin.toFixed(2)}`,
                    sub: report.totalRevenue > 0
                      ? `${((report.totalMargin / report.totalRevenue) * 100).toFixed(1)}% margin rate`
                      : '',
                    icon: '📈',
                    color: 'var(--green)',
                  },
                ].map(card => (
                  <div key={card.label} style={{
                    padding: 20,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 18 }}>{card.icon}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>
                        {card.label}
                      </span>
                    </div>
                    <div style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 28,
                      fontWeight: 700,
                      color: card.color,
                    }}>
                      {card.value}
                    </div>
                    {card.sub && (
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                        {card.sub}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Top products table */}
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700 }}>Top Products by Volume</h3>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-2)' }}>
                      {['#', 'Product', 'Units Sold', 'Revenue', 'Margin'].map(h => (
                        <th key={h} style={{
                          padding: '10px 20px',
                          textAlign: h === 'Product' || h === '#' ? 'left' : 'right',
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--text-3)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.topProducts.map((p, i) => {
                      const marginRate = p.totalRevenue > 0
                        ? ((p.totalMargin / p.totalRevenue) * 100).toFixed(1)
                        : '0.0';
                      return (
                        <tr
                          key={p.productId}
                          style={{
                            borderBottom: '1px solid var(--border)',
                            transition: 'background 0.1s',
                          }}
                        >
                          <td style={{
                            padding: '14px 20px',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: 12,
                            color: 'var(--text-3)',
                          }}>
                            {String(i + 1).padStart(2, '0')}
                          </td>
                          <td style={{ padding: '14px 20px', fontWeight: 500 }}>
                            {p.title}
                          </td>
                          <td style={{
                            padding: '14px 20px',
                            textAlign: 'right',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: 13,
                          }}>
                            {p.totalQuantity}
                          </td>
                          <td style={{
                            padding: '14px 20px',
                            textAlign: 'right',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: 13,
                            color: 'var(--accent)',
                          }}>
                            ${p.totalRevenue.toFixed(2)}
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            <div style={{
                              fontFamily: 'JetBrains Mono, monospace',
                              fontSize: 13,
                              color: 'var(--green)',
                              fontWeight: 600,
                            }}>
                              ${p.totalMargin.toFixed(2)}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                              {marginRate}%
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {report.topProducts.length === 0 && (
                  <div style={{
                    padding: 40,
                    textAlign: 'center',
                    color: 'var(--text-3)',
                    fontSize: 13,
                  }}>
                    No paid orders found in this date range
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}