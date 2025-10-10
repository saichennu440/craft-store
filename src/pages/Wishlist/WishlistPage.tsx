import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, ShoppingCart, Trash2, ArrowRight, Star } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useWishlistStore } from '../../store/wishlistStore'
import { useCartStore } from '../../store/cartStore'
import { useAuthStore } from '../../store/authStore'
import { formatCurrency } from '../../lib/utils'
import toast from 'react-hot-toast'

export const WishlistPage: React.FC = () => {
  const { items, removeItem, clearWishlist, getTotalItems } = useWishlistStore()
  const { addItem: addToCart } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  
  const totalItems = getTotalItems()
  
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth?redirect=/wishlist')
    }
  }, [isAuthenticated, navigate])
  
  const handleAddToCart = (product: any) => {
    if (product.stock === 0) {
      toast.error('Product is out of stock')
      return
    }
    
    addToCart(product, 1)
    toast.success('Added to cart!')
  }
  
  const handleRemoveFromWishlist = (productId: string, productTitle: string) => {
    removeItem(productId)
    toast.success(`${productTitle} removed from wishlist`)
  }
  
  const handleClearWishlist = () => {
    if (confirm('Are you sure you want to clear your entire wishlist?')) {
      clearWishlist()
      toast.success('Wishlist cleared')
    }
  }
  
  if (!isAuthenticated) {
    return null
  }
  
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-accent-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Heart size={48} className="text-red-600" />
          </motion.div>
          <h2 className="text-3xl font-display font-bold text-gray-900 mb-3">Your wishlist is empty</h2>
          <p className="text-gray-600 mb-8 text-lg">Save your favorite items to your wishlist and shop them later</p>
          <Link to="/products">
            <Button size="lg" className="shadow-lg">
              Discover Products <ArrowRight className="ml-2" size={20} />
            </Button>
          </Link>
        </motion.div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-accent-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
        >
          <div>
            <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">
              My Wishlist
            </h1>
            <p className="text-gray-600 text-lg">
              {totalItems} {totalItems === 1 ? 'item' : 'items'} saved for later
            </p>
          </div>
          
          {items.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Button
                variant="outline"
                onClick={handleClearWishlist}
                className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
              >
                Clear Wishlist
              </Button>
            </motion.div>
          )}
        </motion.div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
                <div className="relative">
                  {/* Product Image */}
                  <Link to={`/product/${product.slug}`}>
                    <div className="aspect-square overflow-hidden relative">
                      <img
                        src={product.images?.[0] || 'https://images.pexels.com/photos/1070945/pexels-photo-1070945.jpeg?auto=compress&cs=tinysrgb&w=400'}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
                    </div>
                  </Link>
                  
                  {/* Remove from Wishlist Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRemoveFromWishlist(product.id, product.title)}
                    className="absolute top-3 right-3 bg-white/90 hover:bg-white text-red-600 p-2 rounded-full shadow-lg transition-colors z-10"
                  >
                    <Heart size={18} className="fill-current" />
                  </motion.button>
                  
                  {/* Stock Badge */}
                  {product.stock === 0 && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Out of Stock
                    </div>
                  )}
                  
                  {/* Quick Actions Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock === 0}
                        className="bg-white text-primary-600 p-2 rounded-full shadow-lg hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart size={18} />
                      </motion.button>
                    </div>
                  </div>
                </div>
                
                {/* Product Info */}
                <div className="p-4">
                  <Link to={`/product/${product.slug}`}>
                    <h3 className="font-semibold text-gray-900 mb-1 truncate hover:text-primary-600 transition-colors">
                      {product.title}
                    </h3>
                  </Link>
                  
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                    {product.description}
                  </p>
                  
                  {/* Rating */}
                  <div className="flex items-center space-x-1 mb-2">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className="fill-current" />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">(4.8)</span>
                  </div>
                  
                  {/* Price and Actions */}
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary-600">
                      {formatCurrency(product.price)}
                    </span>
                    <div className="flex space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRemoveFromWishlist(product.id, product.title)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    </div>
                  </div>
                  
                  {/* Add to Cart Button */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-3"
                  >
                    <Button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                      className="w-full"
                      size="sm"
                    >
                      {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </Button>
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
        
        {/* Continue Shopping */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <Link to="/products">
            <Button variant="outline" size="lg" className="border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white font-semibold px-8 py-4 text-lg">
              Continue Shopping <ArrowRight className="ml-2" size={20} />
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}