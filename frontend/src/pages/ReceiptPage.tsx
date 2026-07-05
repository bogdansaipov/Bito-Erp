import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Order } from '../types';

export default function ReceiptPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data);
      } catch {
        setError('Order not found');
      }
    };
    fetchOrder();
    const interval = setInterval(fetchOrder, 3000);
    return () => clearInterval(interval);
  }, [id]);

  if (error) return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--red)',
    }}>
      {error}
    </div>
  );

  if (!order) return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-2)',
    }}>
      Loading...
    </div>
  );

  const isPaid = order.status === 'PAID';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 480,
        background: 'var(--surface)',
        border: `1px solid ${isPaid ? 'rgba(34,197,94,0.4)' : 'var(--border)'}`,
        borderRadius: 16,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '28px 28px 24px',
          borderBottom: '1px solid var(--border)',
          background: isPaid ? 'var(--green-dim)' : 'var(--orange-dim)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>{isPaid ? '✅' : '⏳'}</span>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>
                {isPaid ? 'Payment confirmed' : 'Awaiting payment'}
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                Order #{order._id.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            background: isPaid ? 'var(--green-dim)' : 'var(--orange-dim)',
            border: `1px solid ${isPaid ? 'var(--green)' : 'var(--orange)'}`,
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            color: isPaid ? 'var(--green)' : 'var(--orange)',
          }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: isPaid ? 'var(--green)' : 'var(--orange)',
              animation: isPaid ? 'none' : 'pulse 1.5s infinite',
            }} />
            {isPaid ? 'PAID' : 'PENDING PAYMENT'}
          </div>
          {!isPaid && (
            <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 10 }}>
              Waiting for payment confirmation. This page updates automatically.
            </p>
          )}
        </div>

        {/* Items */}
        <div style={{ padding: '20px 28px' }}>
          <p style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-3)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 12,
          }}>Items</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {order.items.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                    {item.quantity} × ${item.unitPrice.toFixed(2)}
                  </div>
                </div>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 700,
                  fontSize: 14,
                }}>
                  ${item.lineTotal.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid var(--border)',
          }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>Total</span>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 700,
              fontSize: 22,
              color: isPaid ? 'var(--green)' : 'var(--text)',
            }}>
              ${order.grandTotal.toFixed(2)}
            </span>
          </div>

          {order.paidAt && (
            <div style={{
              marginTop: 12,
              fontSize: 12,
              color: 'var(--text-2)',
              textAlign: 'right',
            }}>
              Paid {new Date(order.paidAt).toLocaleString()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px 24px' }}>
          <button
            onClick={() => navigate('/products')}
            style={{
              width: '100%',
              padding: '11px',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text)',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            ← Back to catalog
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}