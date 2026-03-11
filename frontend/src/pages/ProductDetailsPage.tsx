import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Typography, Spin, Card, Button, Tag, Divider, message } from 'antd'

const { Title, Text, Paragraph } = Typography

type Product = {
  id: number
  name: string
  description: string
  price: number
  image?: string
  category_name?: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const API_BASE = 'http://127.0.0.1:8000'
const TOKEN_STORAGE_KEY = 'authToken'

export default function ProductDetailsPage() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)
  const [addingToWishlist, setAddingToWishlist] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`${API_BASE}/products/${id}/`)
      .then((res) => res.json())
      .then((data) => setProduct(data))
      .finally(() => setLoading(false))
  }, [id])

  const imgSrc = (img?: string) => {
    if (!img) return ''
    if (img.startsWith('http://') || img.startsWith('https://')) return img
    if (img.startsWith('/')) return `${API_BASE}${img}`
    return `${API_BASE}/${img}`
  }

  if (loading || !product) return <Spin size="large" />

  const addToCart = async () => {
    if (!product) return
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!token) {
      message.error('Please log in to add items to your cart.')
      return
    }

    try {
      setAddingToCart(true)
      const response = await fetch(`${API_BASE_URL}/shoppingCart/add/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      })

      if (!response.ok) {
        let err = `Request failed with status ${response.status}`
        try {
          const data = await response.json()
          if (typeof data?.error === 'string') err = data.error
          if (typeof data?.detail === 'string') err = data.detail
        } catch {
          // no-op
        }
        throw new Error(err)
      }

      message.success('Added to cart')
      window.dispatchEvent(new Event('cart-updated'))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add item to cart'
      message.error(msg)
    } finally {
      setAddingToCart(false)
    }
  }

  const addToWishlist = async () => {
    if (!product) return
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!token) {
      message.error('Please log in to add items to your wishlist.')
      return
    }

    try {
      setAddingToWishlist(true)
      const response = await fetch(`${API_BASE_URL}/wishlist/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ product: product.id }),
      })

      if (!response.ok) {
        let err = `Request failed with status ${response.status}`
        try {
          const data = await response.json()
          if (typeof data?.error === 'string') err = data.error
          if (typeof data?.detail === 'string') err = data.detail
        } catch {
          // no-op
        }
        throw new Error(err)
      }

      message.success('Added to wishlist')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add item to wishlist'
      message.error(msg)
    } finally {
      setAddingToWishlist(false)
    }
  }

  return (
    <div>
      <Button onClick={() => navigate('/products')} style={{ borderRadius: 12, marginBottom: 14 }}>
        ← Back
      </Button>

      <Card style={{ borderRadius: 18, overflow: 'hidden' }} bodyStyle={{ padding: 18 }}>
        {product.image ? (
          <img
            src={imgSrc(product.image)}
            alt={product.name}
            style={{ width: '100%', maxHeight: 420, objectFit: 'cover', borderRadius: 14 }}
          />
        ) : (
          <div style={{ width: '100%', height: 320, borderRadius: 14, background: 'rgba(0,0,0,0.06)' }} />
        )}

        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
          <div>
            <Title style={{ margin: 0 }}>{product.name}</Title>
            {product.category_name ? <Tag style={{ borderRadius: 999, marginTop: 10 }}>{product.category_name}</Tag> : null}
          </div>

          <Text strong style={{ fontSize: 22 }}>
            ${product.price}
          </Text>
        </div>

        <Divider />

        <Paragraph style={{ color: 'rgba(0,0,0,0.75)' }}>{product.description}</Paragraph>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button type="primary" style={{ borderRadius: 12, fontWeight: 900 }} loading={addingToCart} onClick={addToCart}>
            Add to cart
          </Button>
          <Button style={{ borderRadius: 12 }} loading={addingToWishlist} onClick={addToWishlist}>
            Add to wishlist
          </Button>
        </div>
      </Card>
    </div>
  )
}
