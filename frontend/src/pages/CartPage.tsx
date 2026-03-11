import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, Divider, Empty, InputNumber, List, Space, Typography, message } from 'antd'

type CartApiItem = {
  id: number
  product: number
  product_name: string
  product_price: string
  quantity: number
  subtotal: string
}

type CartApiResponse = {
  items: CartApiItem[]
  total: string | number
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const TOKEN_STORAGE_KEY = 'authToken'

function getAuthHeaders() {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  const headers: Record<string, string> = {}
  if (token) {
    headers.Authorization = `Token ${token}`
  }
  return headers
}

function toMoney(n: number) {
  return `$${n.toFixed(2)}`
}

function CartPage() {
  const { Title, Text } = Typography

  const [items, setItems] = useState<CartApiItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const apiGetCart = async (): Promise<CartApiResponse> => {
    const res = await fetch(`${API_BASE_URL}/shoppingCart/`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json', ...getAuthHeaders() },
    })

    const contentType = res.headers.get('content-type') ?? ''
    if (res.redirected || !contentType.includes('application/json')) {
      throw new Error('Not logged in (or cart endpoint not returning JSON). Please log in and try again.')
    }

    if (!res.ok) {
      throw new Error(`Failed to load cart (HTTP ${res.status})`)
    }

    return (await res.json()) as CartApiResponse
  }

  const apiAddQuantity = async (product_id: number, quantity: number): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/shoppingCart/add/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ product_id, quantity }),
    })

    const contentType = res.headers.get('content-type') ?? ''
    if (res.redirected || !contentType.includes('application/json')) {
      throw new Error('Not logged in (or add endpoint not returning JSON).')
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Failed to add item (HTTP ${res.status}). ${text}`)
    }
  }

  const apiDecrementQuantity = async (cart_item_id: number, quantity: number): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/shoppingCart/remove/${cart_item_id}/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ quantity }),
    })

    const contentType = res.headers.get('content-type') ?? ''
    if (res.redirected || !contentType.includes('application/json')) {
      throw new Error('Not logged in (or decrement endpoint not returning JSON).')
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Failed to decrement item (HTTP ${res.status}). ${text}`)
    }
  }

  const apiRemoveItem = async (cart_item_id: number): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/shoppingCart/remove/${cart_item_id}/`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { Accept: 'application/json', ...getAuthHeaders() },
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Failed to remove item (HTTP ${res.status}). ${text}`)
    }
  }

  const refresh = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiGetCart()
      setItems(data.items ?? [])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load cart'
      setError(msg)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const subtotal = useMemo(() => {
    let sum = 0
    for (const it of items) {
      const priceNum = Number(it.product_price)
      if (Number.isFinite(priceNum)) sum += priceNum * it.quantity
    }
    return sum
  }, [items])

  const totalQty = useMemo(() => items.reduce((acc, it) => acc + it.quantity, 0), [items])

  const updateQty = async (cartItemId: number, nextQty: number) => {
    const qty = Math.max(1, Math.min(99, Math.floor(Number(nextQty) || 1)))

    const currentItem = items.find((it) => it.id === cartItemId)
    const currentQty = currentItem?.quantity ?? 1

    if (!currentItem || currentQty === qty) return

    setItems((prev) => prev.map((it) => (it.id === cartItemId ? { ...it, quantity: qty } : it)))

    try {
      if (qty > currentQty) {
        await apiAddQuantity(currentItem.product, qty - currentQty)
      } else {
        await apiDecrementQuantity(cartItemId, currentQty - qty)
      }
      message.success('Quantity updated')
      window.dispatchEvent(new Event('cart-updated'))
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Update failed'
      message.error(msg)
      refresh()
    }
  }

  const removeItem = async (cartItemId: number) => {
    setItems((prev) => prev.filter((it) => it.id !== cartItemId))

    try {
      await apiRemoveItem(cartItemId)
      message.success('Item removed')
      window.dispatchEvent(new Event('cart-updated'))
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Remove failed'
      message.error(msg)
      refresh()
    }
  }

  const moveToWishlist = async (cartItemId: number, productId: number) => {
    const snapshot = items
    setItems((prev) => prev.filter((it) => it.id !== cartItemId))

    try {
      const addRes = await fetch(`${API_BASE_URL}/wishlist/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ product: productId }),
      })

      if (!addRes.ok) {
        const text = await addRes.text().catch(() => '')
        if (addRes.status === 400 && text.includes('already in your wishlist')) {
          // Treat as success; item already exists.
        } else {
          throw new Error(`Failed to add to wishlist (HTTP ${addRes.status}). ${text}`)
        }
      }

      await apiRemoveItem(cartItemId)
      message.success('Moved to wishlist')
      window.dispatchEvent(new Event('cart-updated'))
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Move to wishlist failed'
      message.error(msg)
      setItems(snapshot)
    }
  }

  const clearCart = async () => {
    if (items.length === 0) return

    const snapshot = items
    setItems([])

    try {
      for (const it of snapshot) {
        await apiRemoveItem(it.id)
      }
      message.success('Cart cleared')
      window.dispatchEvent(new Event('cart-updated'))
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Clear failed'
      message.error(msg)
      refresh()
    }
  }

  const moveAllToWishlist = async () => {
    if (items.length === 0) return

    const snapshot = items
    setItems([])

    try {
      for (const it of snapshot) {
        const addRes = await fetch(`${API_BASE_URL}/wishlist/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ product: it.product }),
        })

        if (!addRes.ok) {
          const text = await addRes.text().catch(() => '')
          if (addRes.status === 400 && text.includes('already in your wishlist')) {
            // Treat as success; item already exists.
          } else {
            throw new Error(`Failed to add to wishlist (HTTP ${addRes.status}). ${text}`)
          }
        }
      }

      for (const it of snapshot) {
        await apiRemoveItem(it.id)
      }

      message.success('Moved all to wishlist')
      window.dispatchEvent(new Event('cart-updated'))
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Move all to wishlist failed'
      message.error(msg)
      setItems(snapshot)
    }
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
          {totalQty} item{totalQty === 1 ? '' : 's'}
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

      {loading ? (
        <Card>
          <Text type="secondary">Loading cart…</Text>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <Empty description="Your cart is empty." />
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
            <Button type="primary" onClick={() => navigateTo('/products')}>
              Browse Products
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <List
            dataSource={items}
            rowKey={(it) => String(it.id)}
            renderItem={(it) => {
              const priceNum = Number(it.product_price)
              const lineTotal = (Number.isFinite(priceNum) ? priceNum : 0) * it.quantity
              return (
                <List.Item
                  actions={[
                    <Button onClick={() => moveToWishlist(it.id, it.product)} key="wishlist">
                      Move to Wishlist
                    </Button>,
                    <Button danger onClick={() => removeItem(it.id)} key="remove">
                      Remove
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space direction="vertical" size={0}>
                        <Text strong>{it.product_name}</Text>
                        <Text type="secondary">
                          {Number.isFinite(priceNum) ? `${toMoney(priceNum)} each` : 'Price unavailable'}
                        </Text>
                      </Space>
                    }
                    description={
                      <Space size="large" wrap>
                        <Space>
                          <Text>Qty:</Text>
                          <InputNumber
                            min={1}
                            max={99}
                            value={it.quantity}
                            onChange={(v) => updateQty(it.id, Number(v))}
                          />
                        </Space>
                        <Text strong>Line: {toMoney(lineTotal)}</Text>
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
              <Button onClick={moveAllToWishlist}>Move All to Wishlist</Button>
              <Button danger onClick={clearCart}>
                Clear Cart
              </Button>
              <Button onClick={refresh}>Refresh</Button>
            </Space>

            <Space direction="vertical" size={0} style={{ textAlign: 'right' }}>
              <Text type="secondary">Subtotal</Text>
              <Title level={4} style={{ margin: 0 }}>
                {toMoney(subtotal)}
              </Title>
            </Space>
          </div>
        </Card>
      )}
    </>
  )
}

export default CartPage
