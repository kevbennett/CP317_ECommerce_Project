import { useEffect, useState } from 'react'
import { Alert, Button, Card, Empty, List, Space, Tag, Typography } from 'antd'

type OrderListItem = {
  id: number
  email: string
  status: string
  total_price: number
  created_at: string
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

function formatMoney(n: number) {
  return `$${n.toFixed(2)}`
}

function formatDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString()
}

function statusColor(status: string) {
  switch (status) {
    case 'paid':
      return 'green'
    case 'failed':
      return 'red'
    case 'cancelled':
      return 'volcano'
    default:
      return 'gold'
  }
}

export default function OrdersPage() {
  const { Title, Text } = Typography
  const [orders, setOrders] = useState<OrderListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = async () => {
    const res = await fetch(`${API_BASE_URL}/orders/`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json', ...getAuthHeaders() },
    })

    const contentType = res.headers.get('content-type') ?? ''
    if (res.redirected || !contentType.includes('application/json')) {
      throw new Error('Not logged in (or orders endpoint not returning JSON).')
    }

    if (!res.ok) {
      throw new Error(`Failed to load orders (HTTP ${res.status})`)
    }

    return (await res.json()) as OrderListItem[]
  }

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchOrders()
        setOrders(data)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load orders'
        setError(msg)
        setOrders([])
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [])

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Text type="secondary">YOUR ORDERS</Text>
        <Title level={2} style={{ marginTop: 8, marginBottom: 0 }}>
          Order History
        </Title>
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
          <Text type="secondary">Loading orders...</Text>
        </Card>
      ) : orders.length === 0 ? (
        <Card>
          <Empty description="No orders yet." />
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
            <Button type="primary" onClick={() => navigateTo('/products')}>
              Browse Products
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <List
            dataSource={orders}
            rowKey={(order) => String(order.id)}
            renderItem={(order) => (
              <List.Item
                actions={[
                  <Button key="view" type="link" onClick={() => navigateTo(`/orders/${order.id}`)}>
                    View
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space size={12} wrap>
                      <Text strong>Order #{order.id}</Text>
                      <Tag color={statusColor(order.status)}>{order.status.toUpperCase()}</Tag>
                    </Space>
                  }
                  description={
                    <Space size="large" wrap>
                      <Text type="secondary">{formatDate(order.created_at)}</Text>
                      <Text>Total: {formatMoney(order.total_price || 0)}</Text>
                      <Text type="secondary">{order.email}</Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}
    </>
  )
}
