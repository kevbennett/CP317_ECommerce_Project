import { useEffect, useMemo, useState } from 'react'

type CartItem = {
  id: number
  name: string
  price: number
  image?: string
  quantity: number
}

const CART_STORAGE_KEY = 'cart'

function safeParseCart(raw: string | null): CartItem[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((item) => ({
        id: Number(item.id),
        name: String(item.name ?? ''),
        price: Number(item.price),
        image: item.image ? String(item.image) : undefined,
        quantity: Math.max(1, Number(item.quantity ?? 1)),
      }))
      .filter(
        (item) =>
          Number.isFinite(item.id) &&
          item.name.length > 0 &&
          Number.isFinite(item.price) &&
          Number.isFinite(item.quantity)
      )
  } catch {
    return []
  }
}

function loadCart(): CartItem[] {
  return safeParseCart(window.localStorage.getItem(CART_STORAGE_KEY))
}

function saveCart(items: CartItem[]) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
}

function navigateTo(path: '/' | '/products' | '/cart') {
  if (window.location.pathname === path) return
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function CartPage() {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    setItems(loadCart())
  }, [])

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [items])

  const updateQty = (id: number, qty: number) => {
    const next = items.map((item) =>
      item.id === id ? { ...item, quantity: Math.max(1, qty) } : item
    )
    setItems(next)
    saveCart(next)
  }

  const removeItem = (id: number) => {
    const next = items.filter((item) => item.id !== id)
    setItems(next)
    saveCart(next)
  }

  const clearCart = () => {
    setItems([])
    saveCart([])
  }

  return (
    <section className="content-panel">
      <p className="eyebrow">Cart</p>
      <h1>Shopping cart</h1>
      <p className="subhead">Review your items, update quantities, or remove products.</p>

      {items.length === 0 ? (
        <div style={{ marginTop: '1.25rem' }}>
          <p className="state-message">Your cart is empty.</p>
          <button className="primary-link" onClick={() => navigateTo('/products')}>
            Browse products
          </button>
        </div>
      ) : (
        <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem' }}>
          {/* Items */}
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {items.map((item) => (
              <article
                key={item.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '96px 1fr auto',
                  gap: '0.9rem',
                  alignItems: 'center',
                  border: '1px solid #d6e1db',
                  borderRadius: '14px',
                  padding: '0.85rem',
                  background: '#ffffff',
                }}
              >
                <div
                  style={{
                    width: 96,
                    height: 72,
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: '#e5efea',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <span style={{ color: '#60766d', fontSize: 12 }}>No image</span>
                  )}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, color: '#12342a' }}>{item.name}</div>
                  <div style={{ color: '#43534d', marginTop: 4 }}>
                    ${item.price.toFixed(2)} each
                  </div>

                  <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <button
                      className="secondary-link"
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                    >
                      −
                    </button>

                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateQty(item.id, Number(e.target.value || 1))}
                      style={{
                        width: 72,
                        padding: '0.55rem 0.6rem',
                        borderRadius: 10,
                        border: '1px solid #c7d8d0',
                        fontWeight: 700,
                      }}
                    />

                    <button
                      className="secondary-link"
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                    >
                      +
                    </button>

                    <button
                      className="secondary-link"
                      onClick={() => removeItem(item.id)}
                      style={{ borderColor: '#e1b7b7', color: '#9a1a1a' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#12342a' }}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                  <div style={{ color: '#43534d', fontSize: 12, marginTop: 4 }}>Line total</div>
                </div>
              </article>
            ))}
          </div>

          {/* Summary */}
          <div
            style={{
              border: '1px solid #d6e1db',
              borderRadius: 16,
              padding: '1.1rem',
              background: '#ffffff',
              boxShadow: '0 8px 18px rgba(15, 35, 27, 0.06)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ fontWeight: 800, color: '#12342a' }}>Subtotal</div>
              <div style={{ fontWeight: 800, color: '#12342a' }}>${subtotal.toFixed(2)}</div>
            </div>

            <div style={{ marginTop: 12 }} className="cta-row">
              <button className="secondary-link" onClick={() => navigateTo('/products')}>
                Continue shopping
              </button>
              <button className="secondary-link" onClick={clearCart}>
                Clear cart
              </button>
              <button
                className="primary-link"
                onClick={() => alert('Checkout coming soon (Sprint 2).')}
              >
                Proceed to checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default CartPage
