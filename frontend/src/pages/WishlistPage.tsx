import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, Empty, Image, List, Space, Typography, message } from 'antd'

type WishlistItem = {
  id: number
  product: number
  created_at: string
}

type Product = {
  id: number
  name: string
  price: string
  description: string
  image: string
  category: number
  category_name?: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const MEDIA_BASE_URL = import.meta.env.VITE_MEDIA_BASE_URL ?? 'http://127.0.0.1:8000'
const TOKEN_STORAGE_KEY = 'authToken'

function getAuthHeaders() {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  return token ? { Authorization: `Token ${token}` } : {}
}

function getImageUrl(imagePath: string) {
  if (!imagePath) return ''
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  return `${MEDIA_BASE_URL}${imagePath}`
}

export default function WishlistPage() {
  const { Title, Text, Paragraph } = Typography
  const [items, setItems] = useState<WishlistItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    try {
      setLoading(true)
      setError(null)

      const [wishlistRes, productsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/wishlist/`, {
          headers: { Accept: 'application/json', ...getAuthHeaders() },
        }),
        fetch(`${API_BASE_URL}/products/`),
      ])

      if (!wishlistRes.ok) {
        throw new Error(`Failed to load wishlist (HTTP ${wishlistRes.status})`)
      }

      if (!productsRes.ok) {
        throw new Error(`Failed to load products (HTTP ${productsRes.status})`)
      }

      const wishlistRaw = (await wishlistRes.json()) as unknown
      const productsRaw = (await productsRes.json()) as unknown

      const wishlistData = Array.isArray(wishlistRaw)
        ? wishlistRaw
        : (wishlistRaw as { results?: WishlistItem[] }).results ?? []
      const productsData = Array.isArray(productsRaw)
        ? productsRaw
        : (productsRaw as { results?: Product[] }).results ?? []

      setItems(wishlistData as WishlistItem[])
      setProducts(productsData as Product[])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load wishlist'
      setError(msg)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const productsById = useMemo(() => {
    const map = new Map<number, Product>()
    for (const p of products) map.set(p.id, p)
    return map
  }, [products])

  const removeItem = async (wishlistId: number) => {
    const snapshot = items
    setItems((prev) => prev.filter((it) => it.id !== wishlistId))

    try {
      const res = await fetch(`${API_BASE_URL}/wishlist/${wishlistId}/`, {
        method: 'DELETE',
        headers: { Accept: 'application/json', ...getAuthHeaders() },
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`Failed to remove item (HTTP ${res.status}). ${text}`)
      }
      message.success('Removed from wishlist')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Remove failed'
      message.error(msg)
      setItems(snapshot)
    }
  }

  const moveToCart = async (wishlistId: number, productId: number) => {
    const snapshot = items
    setItems((prev) => prev.filter((it) => it.id !== wishlistId))

    try {
      const addRes = await fetch(`${API_BASE_URL}/shoppingCart/add/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ product_id: productId, quantity: 1 }),
      })

      if (!addRes.ok) {
        const text = await addRes.text().catch(() => '')
        throw new Error(`Failed to add to cart (HTTP ${addRes.status}). ${text}`)
      }

      const removeRes = await fetch(`${API_BASE_URL}/wishlist/${wishlistId}/`, {
        method: 'DELETE',
        headers: { Accept: 'application/json', ...getAuthHeaders() },
      })

      if (!removeRes.ok) {
        const text = await removeRes.text().catch(() => '')
        throw new Error(`Added to cart, but failed to remove from wishlist (HTTP ${removeRes.status}). ${text}`)
      }

      message.success('Moved to cart')
      window.dispatchEvent(new Event('cart-updated'))
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Move to cart failed'
      message.error(msg)
      setItems(snapshot)
    }
  }

  const moveAllToCart = async () => {
    if (items.length === 0) return

    const snapshot = items
    setItems([])

    try {
      for (const it of snapshot) {
        const addRes = await fetch(`${API_BASE_URL}/shoppingCart/add/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ product_id: it.product, quantity: 1 }),
        })

        if (!addRes.ok) {
          const text = await addRes.text().catch(() => '')
          throw new Error(`Failed to add item to cart (HTTP ${addRes.status}). ${text}`)
        }
      }

      for (const it of snapshot) {
        const removeRes = await fetch(`${API_BASE_URL}/wishlist/${it.id}/`, {
          method: 'DELETE',
          headers: { Accept: 'application/json', ...getAuthHeaders() },
        })

        if (!removeRes.ok) {
          const text = await removeRes.text().catch(() => '')
          throw new Error(`Added to cart, but failed to remove wishlist item (HTTP ${removeRes.status}). ${text}`)
        }
      }

      message.success('Moved all to cart')
      window.dispatchEvent(new Event('cart-updated'))
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Move all to cart failed'
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
        <Text type="secondary">WISHLIST</Text>
        <Title level={2} style={{ marginTop: 8, marginBottom: 0 }}>
          Your Wishlist
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Save products here to come back later.
        </Paragraph>
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
          <Text type="secondary">Loading wishlist...</Text>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <Empty description="Your wishlist is empty." />
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
            <Button type="primary" onClick={() => navigateTo('/products')}>
              Browse Products
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <Button type="primary" onClick={moveAllToCart}>
              Move All to Cart
            </Button>
          </div>
          <List
            dataSource={items}
            rowKey={(it) => String(it.id)}
            renderItem={(it) => {
              const product = productsById.get(it.product)
              return (
                <List.Item
                  actions={[
                    <Button
                      type="primary"
                      onClick={() => moveToCart(it.id, it.product)}
                      key="move"
                    >
                      Move to Cart
                    </Button>,
                    <Button danger onClick={() => removeItem(it.id)} key="remove">
                      Remove
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      product?.image ? (
                        <Image
                          width={84}
                          height={84}
                          style={{ objectFit: 'cover', borderRadius: 8 }}
                          preview={false}
                          src={getImageUrl(product.image)}
                        />
                      ) : (
                        <div style={{ width: 84, height: 84, borderRadius: 8, background: '#f5f5f5' }} />
                      )
                    }
                    title={
                      <Space direction="vertical" size={0}>
                        <Text strong>{product?.name ?? `Product #${it.product}`}</Text>
                        <Text type="secondary">
                          {product?.price ? `$${Number(product.price).toFixed(2)}` : 'Price unavailable'}
                        </Text>
                      </Space>
                    }
                    description={
                      product?.description ? (
                        <Text type="secondary" ellipsis>
                          {product.description}
                        </Text>
                      ) : null
                    }
                  />
                </List.Item>
              )
            }}
          />
        </Card>
      )}
    </>
  )
}
