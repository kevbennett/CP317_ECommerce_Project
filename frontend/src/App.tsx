import { useEffect, useMemo, useState } from 'react'
import { Button, Layout, Menu, Result, Typography } from 'antd'
import CartPage from './pages/CartPage'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'

type RoutePath = '/' | '/products' | '/cart'

function App() {
  const { Header, Content } = Layout
  const { Title, Text } = Typography

  const normalizePath = (pathname: string): RoutePath | null => {
    const cleanPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
    if (cleanPath === '/' || cleanPath === '/products' || cleanPath === '/cart') {
      return cleanPath
    }
    return null
  }

  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname)

  useEffect(() => {
    const onPopState = () => setCurrentPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const activeRoute = useMemo(() => normalizePath(currentPath), [currentPath])

  const navigate = (to: RoutePath) => {
    if (window.location.pathname === to) return
    window.history.pushState({}, '', to)
    setCurrentPath(to)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          backgroundColor: '#fff',
          borderBottom: '1px solid #f0f0f0',
          paddingInline: 24,
        }}
      >
        <Button type="text" onClick={() => navigate('/')}>
          <Text strong>Canadian Catalog</Text>
        </Button>
        <Menu
          mode="horizontal"
          selectedKeys={activeRoute ? [activeRoute] : []}
          items={[
            { key: '/', label: 'Home' },
            { key: '/products', label: 'Products' },
            { key: '/cart', label: 'Cart' },
          ]}
          onClick={({ key }) => navigate(key as RoutePath)}
          style={{ minWidth: 280, flex: 1, justifyContent: 'flex-end' }}
        />
      </Header>

      <Content style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 20px 48px', width: '100%' }}>
        {activeRoute === '/' && <HomePage onNavigate={navigate} />}
        {activeRoute === '/products' && <ProductsPage />}
        {activeRoute === '/cart' && <CartPage />}
        {activeRoute === null && (
          <Result
            status="404"
            title={<Title level={2}>Page Not Found</Title>}
            subTitle="This route does not exist in the frontend app."
            extra={
              <Button type="primary" onClick={() => navigate('/')}>
                Go to Home
              </Button>
            }
          />
        )}
      </Content>
    </Layout>
  )
}

export default App
