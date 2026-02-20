import { Button, Card, Empty, Space, Typography } from 'antd'

function CartPage() {
  const { Title, Paragraph, Text } = Typography

  return (
    <Card>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Text type="secondary">CART</Text>
        <Title level={2} style={{ margin: 0 }}>
          Shopping cart
        </Title>
        <Paragraph type="secondary">We&apos;ll add the shopping cart UI here.</Paragraph>
        <Empty description="Your cart is currently empty." image={Empty.PRESENTED_IMAGE_SIMPLE}>
          <Button type="primary">Continue Shopping</Button>
        </Empty>
      </Space>
    </Card>
  )
}

export default CartPage
