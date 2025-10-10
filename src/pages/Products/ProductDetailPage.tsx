import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ShoppingCart, Heart, Star, Truck, Shield, RotateCcw } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ProductImageSlider } from '../../components/Product/ProductImageSlider'
import { useCartStore } from '../../store/cartStore'
import { useWishlistStore } from '../../store/wishlistStore'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/utils'
import type { Product } from '../../types/database'
import toast from 'react-hot-toast'

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCartStore()
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore()
  
  const isWishlisted = product ? isInWishlist(product.id) : false
  
  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return
      
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .single()
        
        if (error) throw error
        setProduct(data)
      } catch (error) {
        console.error('Error fetching product:', error)
        toast.error('Product not found')
        navigate('/products')
      } finally {
        setLoading(false)
      }
    }
    
    fetchProduct()
  }, [slug, navigate])
  
  const handleAddToCart = () => {
    if (!product) return
    
    if (quantity > product.stock) {
      toast.error('Not enough stock available')
      return
    }
    
    addItem(product, quantity)
    toast.success(`Added ${quantity} item(s) to cart!`)
  }
  
  const handleBuyNow = () => {
    if (!product) return
    
    if (quantity > product.stock) {
      toast.error('Not enough stock available')
      return
    }
    
    addItem(product, quantity)
    navigate('/cart')
  }
  
  const handleToggleWishlist = () => {
    if (!product) return
    
    if (isWishlisted) {
      removeFromWishlist(product.id)
      toast.success('Removed from wishlist')
    } else {
      addToWishlist(product)
      toast.success('Added to wishlist!')
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
          <Button onClick={() => navigate('/products')}>
            <ArrowLeft className="mr-2" size={16} />
            Back to Products
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-background py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/products')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2" size={16} />
            Back to Products
          </Button>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ProductImageSlider
              images={product.images || []}
              title={product.title}
              className="sticky top-8"
            />
          </motion.div>
          
          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Title and Rating */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-2">
                {product.title}
              </h1>
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={20} className="fill-current" />
                  ))}
                </div>
                <span className="text-gray-600">(4.8) • 127 reviews</span>
              </div>
            </div>
            
            {/* Price */}
            <div className="flex items-center space-x-4">
              <span className="text-3xl sm:text-4xl font-bold text-primary-600">
                {formatCurrency(product.price)}
              </span>
              {product.stock < 10 && product.stock > 0 && (
                <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                  Only {product.stock} left!
                </span>
              )}
            </div>
            
            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>
            
            {/* Quantity Selector */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quantity</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border-2 border-gray-200 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-gray-50 transition-colors"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="px-4 py-2 font-semibold min-w-[60px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="p-2 hover:bg-gray-50 transition-colors"
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
                <span className="text-gray-600">
                  {product.stock} available
                </span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-gray-800 font-semibold py-3"
                  size="lg"
                >
                  <ShoppingCart className="mr-2" size={20} />
                  Buy Now
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-red-400 font-semibold py-3"
                  size="lg"
                >
                  Add to Cart
                </Button>
              </div>
              
              <Button
                 variant="outline"
                onClick={handleToggleWishlist}
                className={`w-full transition-colors ${
                  isWishlisted 
                    ? 'text-red-500 hover:text-red-600 hover:bg-red-50' 
                    : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                <Heart className={`mr-2 ${isWishlisted ? 'fill-current' : ''}`} size={20} />
                {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              </Button>
            </div>
            
            {/* Features */}
            <Card>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Truck className="text-green-600" size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Free Shipping</p>
                      <p className="text-sm text-gray-600">On orders over ₹999</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Shield className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Secure Payment</p>
                      <p className="text-sm text-gray-600">100% secure checkout</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <RotateCcw className="text-orange-600" size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Easy Returns</p>
                      <p className="text-sm text-gray-600">30-day return policy</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}