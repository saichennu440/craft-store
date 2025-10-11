import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingCart, Heart } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { ProductImageSlider } from './ProductImageSlider'
import { useCartStore } from '../../store/cartStore'
import { useWishlistStore } from '../../store/wishlistStore'
import { formatCurrency } from '../../lib/utils'
import type { Product } from '../../types/database'
import toast from 'react-hot-toast'

interface ProductCardProps {
  product: Product
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCartStore()
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore()
  
  const isWishlisted = isInWishlist(product.id)
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product, 1)
    toast.success('Added to cart!')
  }
  
  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isWishlisted) {
      removeFromWishlist(product.id)
      toast.success('Removed from wishlist')
    } else {
      addToWishlist(product)
      toast.success('Added to wishlist!')
    }
  }
  
  return (
    <Link to={`/product/${product.slug}`}>
      <Card hover className="overflow-hidden group">
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
          className="relative"
        >
          {/* Image */}
          <div className="aspect-square overflow-hidden relative">
            <ProductImageSlider images={product.images || []} title={product.title} />
            <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-300" />
          </div>
          
          {/* Actions Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
            <div className="flex space-x-2 pointer-events-auto">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddToCart}
                className="bg-white text-primary-600 p-2 rounded-full shadow-lg hover:bg-primary-50 transition-colors"
                disabled={product.stock === 0}
              >
                <ShoppingCart size={20} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleToggleWishlist}
                className={`bg-white p-2 rounded-full shadow-lg transition-colors ${
                  isWishlisted 
                    ? 'text-red-500 hover:bg-red-50' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Heart size={20} className={isWishlisted ? 'fill-current' : ''} />
              </motion.button>
            </div>
          </div>
          
          {/* Stock Badge */}
          {product.stock === 0 && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Out of Stock
            </div>
          )}
        </motion.div>
        
        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 truncate">
            {product.title}
          </h3>
          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
            {product.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-primary-600">
              {formatCurrency(product.price)}
            </span>
            {/* <motion.div whileHover={{ scale: 1.05 }}>
              <Button
                size="sm"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                Add to Cart
              </Button>
            </motion.div> */}
          </div>
        </div>
      </Card>
    </Link>
  )
}