import { Button, Card, Space, Typography } from 'antd'

type HomePageProps = {
  onNavigate: (route: '/' | '/products' | '/cart') => void
}

function HomePage({ onNavigate }: HomePageProps) {
  const { Title, Paragraph, Text } = Typography

  return (
    <Card>
      <Space direction="vertical" size="middle">
        <Text type="secondary">WELCOME</Text>
        <Title level={1} style={{ margin: 0 }}>
          Canadian catalog storefront
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Homepage template, we&apos;ll update the pages and routes as we go along.
        </Paragraph>
        <Space wrap>
          <Button type="primary" onClick={() => onNavigate('/products')}>
            View Products
          </Button>
          <Button onClick={() => onNavigate('/cart')}>Open Cart</Button>
        </Space>
      </Space>
    </Card>
  )
}

export default HomePage
