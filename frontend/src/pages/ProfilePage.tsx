import { Button, Card, Col, Descriptions, Row, Typography } from 'antd'
import { useAuth } from '../auth/AuthContext'

export default function ProfilePage() {
  const { Title, Text } = Typography
  const { user, refreshProfile } = useAuth()

  if (!user) {
    return null
  }

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Text type="secondary">YOUR ACCOUNT</Text>
        <Title level={2} style={{ marginTop: 8, marginBottom: 0 }}>
          Profile
        </Title>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="Basic Info"
            extra={
              <Button onClick={() => void refreshProfile()} type="default">
                Refresh
              </Button>
            }
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Username">{user.username}</Descriptions.Item>
              <Descriptions.Item label="Email">{user.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="First name">{user.first_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="Last name">{user.last_name || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Shipping Info">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Phone">{user.profile.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="Address">{user.profile.shipping_address || '-'}</Descriptions.Item>
              <Descriptions.Item label="City">{user.profile.shipping_city || '-'}</Descriptions.Item>
              <Descriptions.Item label="Province">{user.profile.shipping_province || '-'}</Descriptions.Item>
              <Descriptions.Item label="Postal">{user.profile.shipping_postal || '-'}</Descriptions.Item>
              <Descriptions.Item label="Country">{user.profile.shipping_country || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </>
  )
}
