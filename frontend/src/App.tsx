import { useEffect, useMemo, useState } from 'react'
import './App.css'
import CartPage from './pages/CartPage'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'

type RoutePath = '/' | '/products' | '/cart'

function App() {
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

  const isActive = (to: RoutePath) => activeRoute === to

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <button className="brand-button" onClick={() => navigate('/')}>
            Canadian Catalog
          </button>
          <nav className="site-nav">
            <a
              href="/"
              className={isActive('/') ? 'active' : ''}
              onClick={(event) => {
                event.preventDefault()
                navigate('/')
              }}
            >
              Home
            </a>
            <a
              href="/products"
              className={isActive('/products') ? 'active' : ''}
              onClick={(event) => {
                event.preventDefault()
                navigate('/products')
              }}
            >
              Products
            </a>
            <a
              href="/cart"
              className={isActive('/cart') ? 'active' : ''}
              onClick={(event) => {
                event.preventDefault()
                navigate('/cart')
              }}
            >
              Cart
            </a>
          </nav>
        </div>
      </header>

      <main className="page">
        {activeRoute === '/' && <HomePage onNavigate={navigate} />}
        {activeRoute === '/products' && <ProductsPage />}
        {activeRoute === '/cart' && <CartPage />}
        {activeRoute === null && (
          <section className="content-panel">
            <h1>Page Not Found</h1>
            <p className="subhead">This route does not exist in the frontend app.</p>
            <button className="primary-link" onClick={() => navigate('/')}>
              Go to Home
            </button>
          </section>
        )}
      </main>
    </>
  )
}

export default App
