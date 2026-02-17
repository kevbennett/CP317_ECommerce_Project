type HomePageProps = {
  onNavigate: (route: '/' | '/products' | '/cart') => void
}

function HomePage({ onNavigate }: HomePageProps) {
  return (
    <section className="content-panel home-hero">
      <p className="eyebrow">Welcome</p>
      <h1>Canadian catalog storefront</h1>
      <p className="subhead">
        Homepage template, we'll update the pages and routes as we go along.
      </p>
      <div className="cta-row">
        <button className="primary-link" onClick={() => onNavigate('/products')}>
          View Products
        </button>
        <button className="secondary-link" onClick={() => onNavigate('/cart')}>
          Open Cart
        </button>
      </div>
    </section>
  )
}

export default HomePage
