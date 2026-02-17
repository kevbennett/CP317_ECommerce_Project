import { useEffect, useMemo, useState } from 'react'

type Product = {
  id: number
  name: string
  price: string
  description: string
  image: string
  category: number
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const MEDIA_BASE_URL = import.meta.env.VITE_MEDIA_BASE_URL ?? 'http://127.0.0.1:8000'

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const endpoint = useMemo(() => `${API_BASE_URL}/products/`, [])

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(endpoint)
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const data = (await response.json()) as Product[]
        setProducts(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load products'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [endpoint])

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return ''
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath
    }
    return `${MEDIA_BASE_URL}${imagePath}`
  }

  return (
    <>
      <header className="page-header">
        <p className="eyebrow">Catalog</p>
        <h1>Products</h1>
        <p className="subhead">You guys can products on the django backend first to see them here.</p>
      </header>

      {loading && <p className="state-message">Loading products...</p>}
      {error && <p className="state-message error">Could not load products: {error}</p>}
      {!loading && !error && products.length === 0 && (
        <p className="state-message">No products found.</p>
      )}

      {!loading && !error && products.length > 0 && (
        <section className="product-grid">
          {products.map((product) => (
            <article className="product-card" key={product.id}>
              <div className="product-media">
                {product.image ? (
                  <img src={getImageUrl(product.image)} alt={product.name} loading="lazy" />
                ) : (
                  <div className="product-placeholder">No image</div>
                )}
              </div>
              <div className="product-body">
                <h2>{product.name}</h2>
                <p className="product-description">{product.description}</p>
                <div className="product-footer">
                  <span className="product-price">
                    ${Number(product.price).toFixed(2)}
                  </span>
                  <span className="category-chip">Category #{product.category}</span>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </>
  )
}

export default ProductsPage
