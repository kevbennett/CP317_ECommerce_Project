import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Typography, Spin, Card, Button, Tag, Divider } from 'antd'

const { Title, Text, Paragraph } = Typography

type Product = {
  id: number
  name: string
  description: string
  price: number
  image?: string
  category_name?: string
}

const API_BASE = 'http://127.0.0.1:8000'

export default function ProductDetailsPage() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)

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

        <Button type="primary" style={{ borderRadius: 12, fontWeight: 900 }}>
          Add to cart
        </Button>
      </Card>
    </div>
  )
}