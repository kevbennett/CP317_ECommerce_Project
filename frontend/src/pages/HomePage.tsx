import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, Spin, Typography, Button, Tag, Space, Divider, Input } from 'antd'
import { RightOutlined, SearchOutlined, StarOutlined, FireOutlined, SmileOutlined } from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography

interface Product {
  id: number
  name: string
  description: string
  price: number
  image?: string
  category_name?: string
}

const API_BASE = 'http://127.0.0.1:8000'

export default function HomePage() {
  const navigate = useNavigate()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const aboutRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`${API_BASE}/products/`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch products')
        return res.json()
      })
      .then((data) => {
        setProducts(Array.isArray(data) ? data : [])
        setError(null)
      })
      .catch((err) => {
        setError(err.message)
        setProducts([])
      })
      .finally(() => setLoading(false))
  }, [])

  const imgSrc = (img?: string) => {
    if (!img) return ''
    if (img.startsWith('http://') || img.startsWith('https://')) return img
    if (img.startsWith('/')) return `${API_BASE}${img}`
    return `${API_BASE}/${img}`
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => p.name?.toLowerCase().includes(q))
  }, [products, search])

  const featured = useMemo(() => {
    const flagged = filtered.filter((p) => (p.description || '').toLowerCase().includes('#featured'))
    const list = flagged.length ? flagged : filtered
    return list.slice(0, 4)
  }, [filtered])

  const stat = useMemo(() => {
    const categories = new Set<string>()
    products.forEach((p) => p.category_name && categories.add(p.category_name))
    return { productCount: products.length, categoryCount: categories.size }
  }, [products])

  const scrollToAbout = () => aboutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const heroWrap: React.CSSProperties = {
    padding: '46px 16px 24px',
    borderRadius: 24,
    background:
      'radial-gradient(900px 420px at 20% 0%, rgba(46,125,72,0.18) 0%, rgba(46,125,72,0.00) 55%), radial-gradient(800px 420px at 80% 0%, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.00) 55%)',
    border: '1px solid rgba(0,0,0,0.06)',
  }

  const cardStyle: React.CSSProperties = {
    borderRadius: 18,
    overflow: 'hidden',
    border: '1px solid rgba(0,0,0,0.06)',
    boxShadow: '0 10px 28px rgba(0,0,0,0.06)',
    background: '#fff',
  }

  return (
    <div>
      {/* HERO */}
      <div style={heroWrap}>
        <Space size={8} wrap style={{ marginBottom: 14 }}>
          <Tag style={{ borderRadius: 999, padding: '6px 12px' }} icon={<StarOutlined />}>
            Curated picks
          </Tag>
          <Tag style={{ borderRadius: 999, padding: '6px 12px' }} icon={<FireOutlined />}>
            Trending today
          </Tag>
          <Tag style={{ borderRadius: 999, padding: '6px 12px' }} icon={<SmileOutlined />}>
            Cozy-futuristic minimal
          </Tag>
        </Space>

        <Title style={{ margin: 0, fontSize: 46, lineHeight: 1.08, letterSpacing: -0.9 }}>
          Discover your next{' '}
          <span style={{ padding: '0 10px', borderRadius: 12, background: 'rgba(46,125,72,0.16)' }}>
            favorite find
          </span>
          .
        </Title>

        <Paragraph style={{ marginTop: 12, marginBottom: 18, maxWidth: 720, fontSize: 16, color: 'rgba(0,0,0,0.72)' }}>
          Welcome to Canadian Catalog — a clean, modern marketplace to browse essentials, lifestyle items, tech, and more.
          Simple shopping, smooth browsing, and products that look premium on screen.
        </Paragraph>

        <Space size={10} wrap>
          <Button
            type="primary"
            size="large"
            icon={<RightOutlined />}
            onClick={() => navigate('/products')}
            style={{
              borderRadius: 999,
              height: 46,
              padding: '0 18px',
              background: '#2e7d48',
              fontWeight: 800,
            }}
          >
            Shop now
          </Button>

          <Button size="large" onClick={scrollToAbout} style={{ borderRadius: 999, height: 46, padding: '0 18px', fontWeight: 700 }}>
            About us
          </Button>
        </Space>

        {/* Search */}
        <div style={{ marginTop: 22 }}>
          <Input
            size="large"
            prefix={<SearchOutlined />}
            placeholder="Search featured picks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{
              maxWidth: 920,
              borderRadius: 14,
              height: 48,
              boxShadow: '0 10px 28px rgba(0,0,0,0.05)',
            }}
          />
        </div>

        {/* Quick stats */}
        <div
          style={{
            marginTop: 16,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 12,
            maxWidth: 920,
          }}
        >
          <Card style={{ borderRadius: 16, border: '1px solid rgba(0,0,0,0.06)' }}>
            <Text type="secondary">Products</Text>
            <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>{stat.productCount}</div>
          </Card>
          <Card style={{ borderRadius: 16, border: '1px solid rgba(0,0,0,0.06)' }}>
            <Text type="secondary">Categories</Text>
            <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>{stat.categoryCount}</div>
          </Card>
          <Card style={{ borderRadius: 16, border: '1px solid rgba(0,0,0,0.06)' }}>
            <Text type="secondary">Shipping</Text>
            <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>Fast</div>
          </Card>
        </div>
      </div>

      {/* ABOUT */}
      <div ref={aboutRef} style={{ marginTop: 26 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card style={{ borderRadius: 18 }}>
              <Title level={4} style={{ marginTop: 0 }}>
                Our promise
              </Title>
              <Paragraph style={{ marginBottom: 0, color: 'rgba(0,0,0,0.70)' }}>
                Curated picks that feel worth it — clean presentation, clear pricing, and a browsing experience that’s actually enjoyable.
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card style={{ borderRadius: 18 }}>
              <Title level={4} style={{ marginTop: 0 }}>
                What you’ll find
              </Title>
              <Paragraph style={{ marginBottom: 0, color: 'rgba(0,0,0,0.70)' }}>
                Everyday essentials, tech accessories, snacks, lifestyle items, and limited drops across multiple categories.
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card style={{ borderRadius: 18 }}>
              <Title level={4} style={{ marginTop: 0 }}>
                The vibe
              </Title>
              <Paragraph style={{ marginBottom: 0, color: 'rgba(0,0,0,0.70)' }}>
                Cozy-futuristic minimal — soft spacing, clean typography, and a calm look that keeps the products the star.
              </Paragraph>
            </Card>
          </Col>
        </Row>
      </div>

      <Divider style={{ margin: '26px 0 14px' }} />

      {/* FEATURED PICKS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <Text style={{ letterSpacing: 1.8 }} type="secondary">
            FEATURED PICKS
          </Text>
          <Title style={{ marginTop: 6 }}>Today’s highlights</Title>
        </div>

        <Button type="link" onClick={() => navigate('/products')} style={{ fontWeight: 700 }}>
          See all products <RightOutlined />
        </Button>
      </div>

      {loading ? (
        <div style={{ padding: 24 }}>
          <Spin size="large" />
        </div>
      ) : error ? (
        <Card style={{ borderRadius: 18 }}>
          <Text type="danger">{error}</Text>
        </Card>
      ) : (
        <Row gutter={[18, 18]}>
          {featured.map((p) => (
            <Col xs={24} sm={12} md={8} lg={6} key={p.id}>
              <Card style={cardStyle} bodyStyle={{ padding: 16 }}>
                {p.image ? (
                  <img
                    src={imgSrc(p.image)}
                    alt={p.name}
                    style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 14 }}
                  />
                ) : (
                  <div style={{ width: '100%', height: 180, borderRadius: 14, background: 'rgba(0,0,0,0.05)' }} />
                )}

                <div style={{ marginTop: 14 }}>
                  <Title level={4} style={{ margin: 0 }}>
                    {p.name}
                  </Title>

                  <Paragraph ellipsis={{ rows: 2 }} style={{ marginTop: 8, marginBottom: 10, color: 'rgba(0,0,0,0.72)' }}>
                    {(p.description || '').replace(/#featured/gi, '').trim()}
                  </Paragraph>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ fontSize: 16 }}>
                      ${p.price}
                    </Text>
                    {p.category_name ? <Tag style={{ borderRadius: 999 }}>{p.category_name}</Tag> : null}
                  </div>

                  <Button
                    block
                    style={{ marginTop: 12, borderRadius: 12, fontWeight: 800 }}
                    onClick={() => navigate(`/products/${p.id}`)}
                  >
                    View details
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* CTA */}
      <Card
        style={{
          marginTop: 20,
          borderRadius: 18,
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 10px 28px rgba(0,0,0,0.05)',
        }}
        bodyStyle={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
      >
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Browse the full collection
          </Title>
          <Text type="secondary">Explore categories, filters, and all listings in Products.</Text>
        </div>

        <Button
          type="primary"
          size="large"
          icon={<RightOutlined />}
          onClick={() => navigate('/products')}
          style={{ borderRadius: 999, height: 44, padding: '0 18px', background: '#2e7d48', fontWeight: 900 }}
        >
          Go to Products
        </Button>
      </Card>
    </div>
  )
}