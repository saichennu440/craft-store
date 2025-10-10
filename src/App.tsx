import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Header } from './components/Layout/Header'
import { Footer } from './components/Layout/Footer'
import { Home } from './pages/Home/Home'
import { ProductsPage } from './pages/Products/ProductsPage'
import { ProductDetailPage } from './pages/Products/ProductDetailPage'
import { CartPage } from './pages/Cart/CartPage'
import { AuthPage } from './pages/Auth/AuthPage'
import { AboutPage } from './pages/About/AboutPage'
import { ContactPage } from './pages/Contact/ContactPage'
import { TermsPage } from './pages/Term/TermsPage'
import { PrivacyPage } from './pages/Privacy/PrivacyPage'
import { CheckoutPage } from './pages/Checkout/CheckoutPage'
import { PaymentSuccess } from './pages/Payment/PaymentSuccess'
import { PaymentFailure } from './pages/Payment/PaymentFailure'
import { OrdersPage } from './pages/Orders/OrdersPage'
import { AdminPage } from './pages/Admin/AdminPage'
import { WishlistPage } from './pages/Wishlist/WishlistPage'
import { useAuthStore } from './store/authStore'

function App() {
  const { initialize } = useAuthStore()
  
  useEffect(() => {
    initialize()
  }, [initialize])
  
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/product/:slug" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/failure" element={<PaymentFailure />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
        <Footer />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </div>
    </Router>
  )
}

export default App