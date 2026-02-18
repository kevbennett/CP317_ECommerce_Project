import { useEffect, useMemo, useState } from 'react'
import { Alert, Card, Empty, Image, List, Spin, Tag, Typography } from 'antd'

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

function ProductsPage() {
  const { Title, Paragraph, Text } = Typography
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const endpoint = useMemo(() => `${API_BASE_URL}/products/`, [])

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
      </Card>

      {loading && (
        <Card>
          <Spin tip="Loading products..." />
        </Card>
      )}
      {error && <Alert type="error" message={`Could not load products: ${error}`} showIcon />}
      {!loading && !error && products.length === 0 && <Empty description="No products found." />}

      {!loading && !error && products.length > 0 && (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }}
          dataSource={products}
          renderItem={(product) => (
            <List.Item key={product.id}>
              <Card
                hoverable
                cover={
                  product.image ? (
                    <Image
                      src={getImageUrl(product.image)}
                      alt={product.name}
                      height={180}
                      style={{ objectFit: 'cover' }}
                      preview={false}
                    />
                  ) : (
                    <div style={{ height: 180, display: 'grid', placeItems: 'center' }}>
                      <Text type="secondary">No image</Text>
                    </div>
                  )
                }
              >
                <Card.Meta
                  title={product.name}
                  description={
                    <>
                      <Paragraph ellipsis={{ rows: 3 }} style={{ marginBottom: 12 }}>
                        {product.description}
                      </Paragraph>
                      <Text strong>${Number(product.price).toFixed(2)}</Text>
                      <div style={{ marginTop: 8 }}>
                        <Tag>{product.category_name ?? `Category #${product.category}`}</Tag>
                      </div>
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
