import { useEffect, useMemo, useState } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { Badge, Button, Layout, Menu, Space, Typography } from 'antd'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import CartPage from './pages/CartPage'
import ProductDetailsPage from './pages/ProductDetailsPage'
import WishlistPage from './pages/WishlistPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ProfilePage from './pages/ProfilePage'
import { useAuth } from './auth/AuthContext'
import ProtectedRoute from './auth/ProtectedRoute'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const TOKEN_STORAGE_KEY = 'authToken'

function App() {
  const { Header, Content, Footer } = Layout
  const { Text } = Typography
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user, logout } = useAuth()
  const [cartCount, setCartCount] = useState(0)

  const fetchCartCount = async () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!token || !isAuthenticated) {
      setCartCount(0)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/shoppingCart/`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Token ${token}`,
        },
      })

      if (!response.ok) {
        setCartCount(0)
        return
      }

      const data = (await response.json()) as { items?: Array<{ quantity: number }> }
      const items = data.items ?? []
      setCartCount(items.reduce((sum, item) => sum + Number(item.quantity || 0), 0))
    } catch {
      setCartCount(0)
    }
  }

  const selectedKey = location.pathname.startsWith('/products')
    ? '/products'
    : location.pathname.startsWith('/cart')
    ? '/cart'
    : location.pathname.startsWith('/wishlist')
    ? '/wishlist'
    : location.pathname.startsWith('/profile')
    ? '/profile'
    : '/'

  useEffect(() => {
    void fetchCartCount()
  }, [isAuthenticated, location.pathname])

  useEffect(() => {
    const onCartUpdated = () => {
      void fetchCartCount()
    }

    window.addEventListener('cart-updated', onCartUpdated)
    return () => window.removeEventListener('cart-updated', onCartUpdated)
  }, [isAuthenticated])

  const menuItems = useMemo(
    () => [
      { key: '/', label: 'Home' },
      { key: '/products', label: 'Products' },
      {
        key: '/cart',
        label: (
          <Space size={6}>
            <span>Cart</span>
            {isAuthenticated ? <Badge count={cartCount} size="small" /> : null}
          </Space>
        ),
      },
      ...(isAuthenticated ? [{ key: '/wishlist', label: 'Wishlist' }] : []),
      ...(isAuthenticated ? [{ key: '/profile', label: 'Profile' }] : []),
    ],
    [cartCount, isAuthenticated]
  )

  return (
    <Layout style={{ minHeight: '100vh', background: '#fff' }}>
      <Header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#fff',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          paddingInline: 24,
        }}
      >
        <Button type="text" onClick={() => navigate('/')} style={{ paddingInline: 8 }}>
          <Text strong style={{ fontSize: 16 }}>
            Canadian Catalog
          </Text>
        </Button>

        <Space size={12}>
          <Menu
            mode="horizontal"
            selectedKeys={[selectedKey]}
            onClick={({ key }) => navigate(key)}
            items={menuItems}
            style={{
              minWidth: 320,
              display: 'flex',
              justifyContent: 'flex-end',
              borderBottom: 'none',
            }}
          />
          {isAuthenticated ? (
            <Space>
              <Text type="secondary">Hi, {user?.username}</Text>
              <Button
                onClick={async () => {
                  await logout()
                  navigate('/login')
                }}
              >
                Logout
              </Button>
            </Space>
          ) : (
            <Space>
              <Button onClick={() => navigate('/login')}>Login</Button>
              <Button type="primary" onClick={() => navigate('/signup')}>
                Sign up
              </Button>
            </Space>
          )}
        </Space>
      </Header>

      <Content
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: '28px 20px 48px',
          width: '100%',
        }}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailsPage />} />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <WishlistPage />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Content>

      <Footer style={{ textAlign: 'center', background: '#fff' }}>Canadian Catalog ©2026</Footer>
    </Layout>
  )
}

export default App
