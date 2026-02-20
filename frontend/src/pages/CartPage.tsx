import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, Divider, Empty, InputNumber, List, Space, Typography } from 'antd'

type CartItem = {
  id: number
  name: string
  price: number
  qty: number
}

const CART_KEY = 'cart'

function safeParseCart(raw: string | null): CartItem[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Light validation so bad data doesn’t break the page
    return parsed
      .filter((x) => x && typeof x === 'object')
      .map((x: any) => ({
        id: Number(x.id),
        name: String(x.name ?? ''),
        price: Number(x.price),
        qty: Number(x.qty),
      }))
      .filter((x) => Number.isFinite(x.id) && x.name.length > 0 && Number.isFinite(x.price) && Number.isFinite(x.qty))
  } catch {
    return []
  }
}

function loadCart(): CartItem[] {
  return safeParseCart(localStorage.getItem(CART_KEY))
}

function saveCart(cart: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
}

function formatMoney(value: number): string {
  // Avoid Intl to keep it simple/portable
  return `$${value.toFixed(2)}`
}

function CartPage() {
  const { Title, Text } = Typography

  const [cart, setCart] = useState<CartItem[]>([])
  const [error, setError] = useState<string | null>(null)

  // Load cart on first render
  useEffect(() => {
    try {
      setCart(loadCart())
    } catch {
      setError('Could not load cart data.')
      setCart([])
    }
  }, [])

  // Keep localStorage in sync whenever cart changes
  useEffect(() => {
    try {
      saveCart(cart)
    } catch {
      // If storage fails (rare), keep UI working
      setError('Could not save cart changes (storage error).')
    }
  }, [cart])

  const subtotal = useMemo(() => {
    let sum = 0
    for (const item of cart) {
      sum += item.price * item.qty
    }
    return sum
  }, [cart])

  const itemCount = useMemo(() => {
    let count = 0
    for (const item of cart) count += item.qty
    return count
  }, [cart])

  const updateQty = (id: number, nextQty: number) => {
    // Clamp to [1, 99] to avoid weird values
    const qty = Math.max(1, Math.min(99, Math.floor(nextQty || 1)))
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, qty } : item)))
  }

  const removeItem = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  const clearCart = () => {
    setCart([])
  }

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Text type="secondary">CART</Text>
        <Title level={2} style={{ marginTop: 8, marginBottom: 0 }}>
          Shopping Cart
        </Title>
        <Text type="secondary">
          {itemCount} item{itemCount === 1 ? '' : 's'}
        </Text>
      </Card>

      {error && (
        <Alert
          type="warning"
          showIcon
          message={error}
          style={{ marginBottom: 16 }}
        />
      )}

      {cart.length === 0 ? (
        <Card>
          <Empty description="Your cart is empty." />
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
            <Button type="primary" onClick={() => navigateTo('/products')}>
              Browse Products
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <List
              dataSource={cart}
              rowKey={(item) => String(item.id)}
              renderItem={(item) => {
                const lineTotal = item.price * item.qty
                return (
                  <List.Item
                    actions={[
                      <Button danger onClick={() => removeItem(item.id)} key="remove">
                        Remove
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space direction="vertical" size={0}>
                          <Text strong>{item.name}</Text>
                          <Text type="secondary">{formatMoney(item.price)} each</Text>
                        </Space>
                      }
                      description={
                        <Space size="large" wrap>
                          <Space>
                            <Text>Qty:</Text>
                            <InputNumber
                              min={1}
                              max={99}
                              value={item.qty}
                              onChange={(v) => updateQty(item.id, Number(v))}
                            />
                          </Space>
                          <Text strong>Line: {formatMoney(lineTotal)}</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )
              }}
            />

            <Divider />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Space>
                <Button onClick={() => navigateTo('/products')}>Continue Shopping</Button>
                <Button danger onClick={clearCart}>
                  Clear Cart
                </Button>
              </Space>

              <Space direction="vertical" size={0} style={{ textAlign: 'right' }}>
                <Text type="secondary">Subtotal</Text>
                <Title level={4} style={{ margin: 0 }}>
                  {formatMoney(subtotal)}
                </Title>
              </Space>
            </div>
          </Card>

          <Card style={{ marginTop: 16 }}>
            <Title level={4} style={{ marginTop: 0 }}>
              Checkout (Sprint 1 Prototype)
            </Title>
            <Text type="secondary">
              This sprint demonstrates cart functionality (add/update/remove) and totals.
            </Text>
            <div style={{ marginTop: 12 }}>
              <Button type="primary" disabled>
                Proceed to Checkout
              </Button>
            </div>
          </Card>
        </>
      )}
    </>
  )
}

export default CartPage
