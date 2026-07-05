import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Product, CartItem } from '../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products', {
        params: { search, page: 1, limit: 20 }
      });
      setProducts(res.data.data);
    } catch {
      setError('Failed to fetch products');
    }
  };

  useEffect(() => { fetchProducts(); }, [search]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product._id);
      if (existing) {
        if (existing.quantity >= product.stockCount) return prev;
        return prev.map(i =>
          i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, {
        productId: product._id,
        title: product.title,
        price: product.price,
        quantity: 1,
      }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev
      .map(i => i.productId === productId ? { ...i, quantity: i.quantity + delta } : i)
      .filter(i => i.quantity > 0)
    );
  };

  const grandTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const checkout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/orders', {
        items: cart.map(i => ({ productId: i.productId, quantity: i.quantity }))
      });
      navigate(`/receipt/${res.data._id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Checkout failed';
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || message);
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
            width: 34,
            height: 34,
            background: 'var(--accent)',
            borderRadius: 9,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
          }}>🏪</div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.2px' }}>BITO POS</span>
        </div>

        <nav style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 12px',
            background: 'var(--accent-dim)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--accent)',
            fontWeight: 600,
            fontSize: 13,
            marginBottom: 4,
          }}>
            <span>🛍️</span> Products
          </div>
        </nav>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>Signed in as</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 12 }}>
            {user?.email}
          </div>
          <button
            onClick={logout}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-2)',
              cursor: 'pointer',
              fontSize: 13,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Products */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Catalog</h2>
            <p style={{ color: 'var(--text-2)', fontSize: 13 }}>
              {products.length} items available
            </p>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <span style={{
              position: 'absolute', left: 12, top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: 14,
            }}>🔍</span>
            <input
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 36px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text)',
                fontSize: 14,
                outline: 'none',
                fontFamily: 'Inter, sans-serif',
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 'var(--radius-sm)',
              color: '#ef4444',
              fontSize: 13,
              marginBottom: 16,
            }}>{error}</div>
          )}

          {/* Product grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 14,
          }}>
            {products.map(p => {
              const inCart = cart.find(i => i.productId === p._id);
              const outOfStock = p.stockCount === 0;
              return (
                <div
                  key={p._id}
                  style={{
                    background: 'var(--surface)',
                    border: `1px solid ${inCart ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius)',
                    padding: 16,
                    transition: 'border-color 0.15s',
                  }}
                >
                  <div style={{
                    fontSize: 28,
                    marginBottom: 10,
                    opacity: outOfStock ? 0.4 : 1,
                  }}>
                    {p.title === 'Espresso' ? '☕' :
                     p.title === 'Cappuccino' ? '🧋' :
                     p.title === 'Croissant' ? '🥐' :
                     p.title === 'Water Bottle' ? '💧' :
                     p.title === 'USB Cable' ? '🔌' :
                     p.title === 'Phone Case' ? '📱' : '📦'}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{p.title}</div>
                  <div style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'var(--accent)',
                    fontFamily: 'JetBrains Mono, monospace',
                    marginBottom: 4,
                  }}>
                    ${p.price.toFixed(2)}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: p.stockCount <= 5 ? 'var(--orange)' : 'var(--text-3)',
                    marginBottom: 12,
                  }}>
                    {outOfStock ? '❌ Out of stock' : `${p.stockCount} in stock`}
                  </div>

                  {!outOfStock && (
                    <button
                      onClick={() => addToCart(p)}
                      style={{
                        width: '100%',
                        padding: '7px',
                        background: inCart ? 'var(--accent)' : 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        color: inCart ? 'white' : 'var(--text)',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: 'Inter, sans-serif',
                        transition: 'all 0.15s',
                      }}
                    >
                      {inCart ? `In cart (${inCart.quantity})` : '+ Add to cart'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Cart panel */}
        <div style={{
          width: 300,
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}>
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>
              Cart
              {cart.length > 0 && (
                <span style={{
                  marginLeft: 8,
                  fontSize: 11,
                  background: 'var(--accent)',
                  color: 'white',
                  borderRadius: 20,
                  padding: '2px 8px',
                }}>
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </h3>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {cart.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--text-3)',
              }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🛒</div>
                <div style={{ fontSize: 13 }}>Cart is empty</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Add items from the catalog</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {cart.map(item => (
                  <div
                    key={item.productId}
                    style={{
                      padding: 12,
                      background: 'var(--surface-2)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                      {item.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => updateQty(item.productId, -1)}
                          style={{
                            width: 24, height: 24,
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 4,
                            color: 'var(--text)',
                            cursor: 'pointer',
                            fontSize: 14,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >−</button>
                        <span style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 13,
                          fontWeight: 600,
                          minWidth: 20,
                          textAlign: 'center',
                        }}>{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.productId, 1)}
                          style={{
                            width: 24, height: 24,
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 4,
                            color: 'var(--text)',
                            cursor: 'pointer',
                            fontSize: 14,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >+</button>
                      </div>
                      <span style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--accent)',
                      }}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div style={{
              padding: 16,
              borderTop: '1px solid var(--border)',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}>
                <span style={{ color: 'var(--text-2)', fontSize: 13 }}>Total</span>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 20,
                  fontWeight: 700,
                }}>
                  ${grandTotal.toFixed(2)}
                </span>
              </div>
              <button
                onClick={checkout}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: loading ? 'var(--surface-2)' : 'var(--accent)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {loading ? 'Processing...' : `Checkout — $${grandTotal.toFixed(2)}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}