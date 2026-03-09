import { Alert, Button, Card, Form, Input, Typography } from 'antd'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

type LoginFormValues = {
  username: string
  password: string
}

export default function LoginPage() {
  const { Title, Text } = Typography
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const onFinish = async (values: LoginFormValues) => {
    try {
      setSubmitting(true)
      setError(null)
      await login(values.username, values.password)
      const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
      navigate(fromPath ?? '/profile', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card style={{ maxWidth: 520, margin: '0 auto', borderRadius: 18 }}>
      <Text type="secondary">ACCOUNT ACCESS</Text>
      <Title level={2} style={{ marginTop: 8 }}>
        Login
      </Title>
      {error ? <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} /> : null}
      <Form<LoginFormValues> layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item name="username" label="Username" rules={[{ required: true, message: 'Enter your username' }]}>
          <Input size="large" autoComplete="username" />
        </Form.Item>
        <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Enter your password' }]}>
          <Input.Password size="large" autoComplete="current-password" />
        </Form.Item>
        <Form.Item style={{ marginBottom: 12 }}>
          <Button type="primary" htmlType="submit" size="large" block loading={submitting}>
            Login
          </Button>
        </Form.Item>
      </Form>
      <Text type="secondary">
        New here? <Link to="/signup">Create an account</Link>
      </Text>
    </Card>
  )
}
