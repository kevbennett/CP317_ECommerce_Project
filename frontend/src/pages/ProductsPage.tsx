import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Empty, Image, List, Select, Spin, Tag, Typography, message } from 'antd'

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

function ProductsPage() {
  const { Title, Paragraph, Text } = Typography
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all')
  const [sortKey, setSortKey] = useState<'name' | 'price'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [addingProductId, setAddingProductId] = useState<number | null>(null)
  const endpoint = useMemo(() => `${API_BASE_URL}/products/`, [])

  const addToCart = async (productId: number) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!token) {
      message.error('Please log in to add items to your cart.')
      return
    }

    try {
      setAddingProductId(productId)
      const response = await fetch(`${API_BASE_URL}/shoppingCart/add/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ product_id: productId, quantity: 1 }),
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
      setAddingProductId(null)
    }
  }

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(endpoint)
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const data = (await response.json()) as Product[]
        setProducts(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load products'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [endpoint])

  // Extract unique categories from products
  const categories = useMemo(() => {
    const map = new Map<number, string>()
    products.forEach((p) => {
      if (!map.has(p.category)) {
        map.set(p.category, p.category_name ?? `Category #${p.category}`)
      }
    })
    return Array.from(map.entries())
  }, [products])

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = selectedCategory === 'all' ? products : products.filter((p) => p.category === selectedCategory)
    let sorted = [...filtered]
    sorted.sort((a, b) => {
      if (sortKey === 'name') {
        if (a.name < b.name) return sortOrder === 'asc' ? -1 : 1
        if (a.name > b.name) return sortOrder === 'asc' ? 1 : -1
        return 0
      } else {
        // price is string, convert to number
        const priceA = Number(a.price)
        const priceB = Number(b.price)
        if (priceA < priceB) return sortOrder === 'asc' ? -1 : 1
        if (priceA > priceB) return sortOrder === 'asc' ? 1 : -1
        return 0
      }
    })
    return sorted
  }, [products, selectedCategory, sortKey, sortOrder])
  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return ''
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath
    }
    return `${MEDIA_BASE_URL}${imagePath}`
  }

  return (
    <>
      <Card style={{ marginBottom: 24 }}>
        <Text type="secondary">CATALOG</Text>
        <Title level={2} style={{ marginTop: 8 }}>
          Products
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Add products in the Django backend first to view them here.
        </Paragraph>
        {/* Category Filter & Sorting */}
        <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Select
            style={{ minWidth: 200 }}
            value={selectedCategory}
            onChange={setSelectedCategory}
            disabled={loading || products.length === 0}
          >
            <Select.Option value="all">All Categories</Select.Option>
            {categories.map(([catId, catName]) => (
              <Select.Option key={catId} value={catId}>
                {catName}
              </Select.Option>
            ))}
          </Select>
          <Select
            style={{ minWidth: 160 }}
            value={sortKey}
            onChange={(value) => setSortKey(value)}
            disabled={loading || products.length === 0}
          >
            <Select.Option value="name">Sort by Name</Select.Option>
            <Select.Option value="price">Sort by Price</Select.Option>
          </Select>
          <Select
            style={{ minWidth: 120 }}
            value={sortOrder}
            onChange={(value) => setSortOrder(value)}
            disabled={loading || products.length === 0}
          >
            <Select.Option value="asc">Ascending</Select.Option>
            <Select.Option value="desc">Descending</Select.Option>
          </Select>
        </div>
      </Card>

      {loading && (
        <Card>
          <Spin tip="Loading products..." />
        </Card>
      )}
      {error && <Alert type="error" message={`Could not load products: ${error}`} showIcon />}
      {!loading && !error && filteredProducts.length === 0 && <Empty description="No products found." />}

      {!loading && !error && filteredProducts.length > 0 && (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }}
          dataSource={filteredProducts}
          renderItem={(product) => (
            <List.Item key={product.id}>
              <Card
                hoverable
                onClick={() => navigate(`/products/${product.id}`)}
                style={{ borderRadius: 16, overflow: 'hidden', minHeight: 370, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                cover={
                  product.image ? (
                    <Image
                      src={getImageUrl(product.image)}
                      alt={product.name}
                      height={180}
                      style={{ objectFit: 'cover', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
                      preview={false}
                    />
                  ) : (
                    <div style={{ height: 180, display: 'grid', placeItems: 'center', borderTopLeftRadius: 16, borderTopRightRadius: 16, background: '#fafafa' }}>
                      <Text type="secondary">No image</Text>
                    </div>
                  )
                }
              >
                <Card.Meta
                  title={product.name}
                  description={
                    <>
                      <Paragraph
                        ellipsis={{ rows: 2 }}
                        style={{ marginBottom: 12, minHeight: 40, maxHeight: 40, overflow: 'hidden' }}
                      >
                        {product.description}
                      </Paragraph>
                      <Text strong>${Number(product.price).toFixed(2)}</Text>
                      <div style={{ marginTop: 8 }}>
                        <Tag>{product.category_name ?? `Category #${product.category}`}</Tag>
                      </div>
                      <Button
                        type="primary"
                        style={{ marginTop: 12 }}
                        loading={addingProductId === product.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          void addToCart(product.id)
                        }}
                      >
                        Add to Cart
                      </Button>
                    </>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
      )}
    </>
  )
}

export default ProductsPage
