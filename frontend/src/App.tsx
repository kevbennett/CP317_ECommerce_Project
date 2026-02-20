import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { Layout, Menu, Button, Typography } from 'antd'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import CartPage from './pages/CartPage'
import ProductDetailsPage from './pages/ProductDetailsPage'

function App() {
  const { Header, Content, Footer } = Layout
  const { Text } = Typography
  const navigate = useNavigate()
  const location = useLocation()

  // keep menu selection correct on /products/:id
  const selectedKey = location.pathname.startsWith('/products')
    ? '/products'
    : location.pathname.startsWith('/cart')
    ? '/cart'
    : '/'

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

        <Menu
          mode="horizontal"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => navigate(key)}
          items={[
            { key: '/', label: 'Home' },
            { key: '/products', label: 'Products' },
            { key: '/cart', label: 'Cart' },
          ]}
          style={{
            minWidth: 320,
            display: 'flex',
            justifyContent: 'flex-end',
            borderBottom: 'none',
          }}
        />
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
          <Route path="/cart" element={<CartPage />} />
        </Routes>
      </Content>

      <Footer style={{ textAlign: 'center', background: '#fff' }}>
        Canadian Catalog ©2026
      </Footer>
    </Layout>
  )
}

export default App