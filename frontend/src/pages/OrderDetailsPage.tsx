import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Alert, Button, Card, Descriptions, List, Space, Tag, Typography, message, Modal, Checkbox, Input as AntInput } from 'antd'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'

type OrderItem = {
  id: number
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

type OrderDetails = {
  id: number
  email: string
  status: string
  stripe_client_secret: string
  shipping_address: string
  shipping_city: string
  shipping_province: string
  shipping_postal: string
  shipping_country: string
  total_price: number
  items: OrderItem[]
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

export default function OrderDetailsPage() {
  const { Title, Text } = Typography
  const { id } = useParams()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [returnLoading, setReturnLoading] = useState(false)
  const [returnError, setReturnError] = useState<string | null>(null)
  const [returnReason, setReturnReason] = useState('')
  const [returnItems, setReturnItems] = useState<{ order_item_id: number; quantity: number }[]>([])
  const [returns, setReturns] = useState<any[]>([])
  const [fetchingReturns, setFetchingReturns] = useState(false)

  const fetchOrder = async (orderId: string) => {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}/`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json', ...getAuthHeaders() },
    })

    const contentType = res.headers.get('content-type') ?? ''
    if (res.redirected || !contentType.includes('application/json')) {
      throw new Error('Not logged in (or orders endpoint not returning JSON).')
    }

    if (!res.ok) {
      throw new Error(`Failed to load order (HTTP ${res.status})`)
    }

    return (await res.json()) as OrderDetails
  }

  useEffect(() => {
    const run = async () => {
      if (!id) {
        setError('Missing order id.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await fetchOrder(id)
        setOrder(data)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load order'
        setError(msg)
        setOrder(null)
      } finally {
        setLoading(false)
      }
    }

    void run()
  }, [id])

  // Fetch returns for this order
  useEffect(() => {
    if (!order) return
    setFetchingReturns(true)
    fetch(`${API_BASE_URL}/orders/${order.id}/returns/`, {
      headers: { Accept: 'application/json', ...getAuthHeaders() },
      credentials: 'include',
    })
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setReturns(Array.isArray(data) ? data : []))
      .catch(() => setReturns([]))
      .finally(() => setFetchingReturns(false))
  }, [order])

  // Helper: check if order is returnable
  const isReturnable = order && ['paid', 'partially_returned'].includes(order.status)

  // Handle open return modal
  const openReturnModal = () => {
    if (!order) return
    setReturnItems(order.items.map((item) => ({ order_item_id: item.id, quantity: item.quantity })))
    setReturnReason('')
    setReturnError(null)
    setShowReturnModal(true)
  }

  // Handle submit return
  const submitReturn = async () => {
    if (!order) return
    setReturnLoading(true)
    setReturnError(null)
    try {
      const body: any = { reason: returnReason }
      // If not all items selected, send partial
      if (
        returnItems.length !== order.items.length ||
        returnItems.some((it, idx) => it.quantity !== order.items[idx].quantity)
      ) {
        body.items = returnItems.filter((it) => it.quantity > 0)
      }
      const res = await fetch(`${API_BASE_URL}/orders/${order.id}/return/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...getAuthHeaders() },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Return failed')
      }
      setShowReturnModal(false)
      message.success('Return request submitted')
      // Refresh order and returns
      setTimeout(() => window.location.reload(), 800)
    } catch (e) {
      setReturnError(e instanceof Error ? e.message : 'Return failed')
    } finally {
      setReturnLoading(false)
    }
  }

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const copyClientSecret = async () => {
    if (!order?.stripe_client_secret) return
    try {
      await navigator.clipboard.writeText(order.stripe_client_secret)
      message.success('Stripe client secret copied.')
    } catch {
      message.error('Failed to copy Stripe client secret.')
    }
  }

  if (loading) {
    return (
      <Card>
        <Text type="secondary">Loading order...</Text>
      </Card>
    )
  }

  if (error || !order) {
    return (
      <Card>
        <Alert type="warning" showIcon message={error ?? 'Order not found.'} />
        <div style={{ marginTop: 12 }}>
          <Button onClick={() => navigateTo('/orders')}>Back to orders</Button>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" size={4}>
          <Text type="secondary">ORDER DETAILS</Text>
          <Title level={2} style={{ margin: 0 }}>
            Order #{order.id}
          </Title>
          <Space size={12} wrap>
            <Tag color={statusColor(order.status)}>{order.status.toUpperCase()}</Tag>
            <Text type="secondary">{formatDate(order.created_at)}</Text>
            {isReturnable && (
              <Button type="primary" onClick={openReturnModal} size="small">
                Return
              </Button>
            )}
          </Space>
        </Space>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={1} size="small" title="Shipping">
          <Descriptions.Item label="Address">{order.shipping_address || '-'}</Descriptions.Item>
          <Descriptions.Item label="City">{order.shipping_city || '-'}</Descriptions.Item>
          <Descriptions.Item label="Province">{order.shipping_province || '-'}</Descriptions.Item>
          <Descriptions.Item label="Postal">{order.shipping_postal || '-'}</Descriptions.Item>
          <Descriptions.Item label="Country">{order.shipping_country || '-'}</Descriptions.Item>
          <Descriptions.Item label="Email">{order.email}</Descriptions.Item>
        </Descriptions>
      </Card>

      {order.stripe_client_secret ? (
        <Card style={{ marginBottom: 16 }}>
          <Space direction="vertical" size={6}>
            <Text strong>Payment</Text>
            <Text type="secondary">
              Use the Stripe client secret below to confirm payment on the frontend.
            </Text>
            <Space wrap>
              <Text code>{order.stripe_client_secret}</Text>
              <Button size="small" onClick={copyClientSecret}>
                Copy
              </Button>
            </Space>
          </Space>
        </Card>
      ) : null}

      <Card>
        <List
          dataSource={order.items}
          rowKey={(item) => String(item.id)}
          header={<Text strong>Items</Text>}
          footer={
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Text strong>Total: {formatMoney(order.total_price || 0)}</Text>
            </Space>
          }
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={item.product_name}
                description={
                  <Space size="large" wrap>
                    <Text type="secondary">Qty: {item.quantity}</Text>
                    <Text type="secondary">{formatMoney(item.unit_price)} each</Text>
                    <Text strong>{formatMoney(item.subtotal)}</Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* Returns history */}
      <Card style={{ marginTop: 16 }}>
        <Text strong>Returns</Text>
        {fetchingReturns ? (
          <div style={{ marginTop: 8 }}><Typography.Text type="secondary">Loading returns...</Typography.Text></div>
        ) : returns.length === 0 ? (
          <div style={{ marginTop: 8 }}><Typography.Text type="secondary">No returns for this order.</Typography.Text></div>
        ) : (
          <List
            dataSource={returns}
            rowKey={(r) => String(r.id)}
            renderItem={(r) => (
              <List.Item>
                <List.Item.Meta
                  title={<span>Return #{r.id} <Tag color="blue">{r.status}</Tag></span>}
                  description={<span>Reason: {r.reason || 'N/A'} | Refunded: ${((r.refund_amount_cents||0)/100).toFixed(2)}</span>}
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* Return Modal */}
      <Modal
        title="Request a Return"
        open={showReturnModal}
        onCancel={() => setShowReturnModal(false)}
        onOk={submitReturn}
        confirmLoading={returnLoading}
        okText="Submit Return"
        okButtonProps={{
          disabled: !returnReason.trim() || returnItems.length === 0 || returnItems.every((it: { order_item_id: number; quantity: number }) => it.quantity <= 0),
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <AntInput.TextArea
            rows={3}
            placeholder="Reason for return (required)"
            value={returnReason}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setReturnReason(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <Checkbox
            checked={returnItems.length === order.items.length && returnItems.every((it: { order_item_id: number; quantity: number }, idx: number) => it.quantity === order.items[idx].quantity)}
            onChange={(e: CheckboxChangeEvent) => {
              if (e.target.checked) {
                setReturnItems(order.items.map((item: OrderItem) => ({ order_item_id: item.id, quantity: item.quantity })))
              } else {
                setReturnItems([])
              }
            }}
          >
            Return all items
          </Checkbox>
        </div>
        <List
          dataSource={order.items}
          rowKey={(item: OrderItem) => String(item.id)}
          renderItem={(item: OrderItem) => {
            const selected = returnItems.find((it: { order_item_id: number; quantity: number }) => it.order_item_id === item.id)
            return (
              <List.Item>
                <Checkbox
                  checked={!!selected && selected.quantity > 0}
                  onChange={(e: CheckboxChangeEvent) => {
                    if (e.target.checked) {
                      setReturnItems((prev: { order_item_id: number; quantity: number }[]) => {
                        if (prev.some((it: { order_item_id: number; quantity: number }) => it.order_item_id === item.id)) return prev
                        return [...prev, { order_item_id: item.id, quantity: item.quantity }]
                      })
                    } else {
                      setReturnItems((prev: { order_item_id: number; quantity: number }[]) => prev.filter((it: { order_item_id: number; quantity: number }) => it.order_item_id !== item.id))
                    }
                  }}
                >
                  {item.product_name} (Qty: {item.quantity})
                </Checkbox>
                {selected && (
                  <AntInput
                    type="number"
                    min={1}
                    max={item.quantity}
                    value={selected.quantity}
                    style={{ width: 70, marginLeft: 12 }}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const val = Math.max(1, Math.min(item.quantity, Number(e.target.value) || 1))
                      setReturnItems((prev: { order_item_id: number; quantity: number }[]) => prev.map((it: { order_item_id: number; quantity: number }) => it.order_item_id === item.id ? { ...it, quantity: val } : it))
                    }}
                  />
                )}
              </List.Item>
            )
          }}
        />
        {returnError && <Alert type="error" message={returnError} showIcon style={{ marginTop: 12 }} />}
      </Modal>

      <div style={{ marginTop: 16 }}>
        <Button onClick={() => navigateTo('/orders')}>Back to orders</Button>
      </div>
    </>
  )
}
