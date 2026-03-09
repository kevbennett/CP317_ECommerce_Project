import { Alert, Button, Card, Form, Input, Typography } from 'antd'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

type SignupFormValues = {
  username: string
  email: string
  first_name?: string
  last_name?: string
  password: string
  confirmPassword: string
}

export default function SignupPage() {
  const { Title, Text } = Typography
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { signup } = useAuth()

  const onFinish = async (values: SignupFormValues) => {
    try {
      setSubmitting(true)
      setError(null)
      await signup({
        username: values.username,
        email: values.email,
        first_name: values.first_name,
        last_name: values.last_name,
        password: values.password,
      })
      navigate('/profile', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card style={{ maxWidth: 620, margin: '0 auto', borderRadius: 18 }}>
      <Text type="secondary">ACCOUNT CREATION</Text>
      <Title level={2} style={{ marginTop: 8 }}>
        Sign up
      </Title>
      {error ? <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} /> : null}
      <Form<SignupFormValues> layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item name="username" label="Username" rules={[{ required: true, message: 'Choose a username' }]}>
          <Input size="large" autoComplete="username" />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}>
          <Input size="large" autoComplete="email" />
        </Form.Item>
        <Form.Item name="first_name" label="First name">
          <Input size="large" autoComplete="given-name" />
        </Form.Item>
        <Form.Item name="last_name" label="Last name">
          <Input size="large" autoComplete="family-name" />
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
          rules={[
            { required: true, message: 'Create a password' },
            { min: 8, message: 'Use at least 8 characters' },
          ]}
        >
          <Input.Password size="large" autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label="Confirm password"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Confirm your password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('Passwords do not match'))
              },
            }),
          ]}
        >
          <Input.Password size="large" autoComplete="new-password" />
        </Form.Item>
        <Form.Item style={{ marginBottom: 12 }}>
          <Button type="primary" htmlType="submit" size="large" block loading={submitting}>
            Create account
          </Button>
        </Form.Item>
      </Form>
      <Text type="secondary">
        Already have an account? <Link to="/login">Login</Link>
      </Text>
    </Card>
  )
}
