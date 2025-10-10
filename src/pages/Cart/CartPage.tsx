import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, Heart, Star } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useCartStore } from '../../store/cartStore'
import { useAuthStore } from '../../store/authStore'
import { formatCurrency } from '../../lib/utils'

export const CartPage: React.FC = () => {
  const { items, updateQuantity, removeItem, getTotalPrice, getTotalItems } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  
  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice()
  
  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate(`/auth?redirect=${encodeURIComponent('/checkout')}`)
    } else {
      navigate('/checkout')
    }
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
            className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <ShoppingCart size={48} className="text-primary-600" />
          </motion.div>
          <h2 className="text-3xl font-display font-bold text-gray-900 mb-3">Your cart is empty</h2>
          <p className="text-gray-600 mb-8 text-lg">Discover amazing handmade crafts and add them to your cart</p>
          <Link to="/products">
            <Button size="lg" className="shadow-lg">
              Start Shopping <ArrowRight className="ml-2" size={20} />
            </Button>
          </Link>
        </motion.div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-accent-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-display font-bold text-gray-900 mb-2"
        >
          Shopping Cart
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-600 mb-8 text-lg"
        >
          {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
        </motion.p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0 relative group">
                        <img
                          src={item.product.images?.[0] || 'https://via.placeholder.com/150x150'}
                          alt={item.product.title}
                          className="w-24 h-24 object-cover rounded-lg group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-200"></div>
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1 text-lg">
                          {item.product.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                          {item.product.description}
                        </p>
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} className="fill-current" />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">(4.8)</span>
                        </div>
                        <p className="text-xl font-bold text-primary-600">
                          {formatCurrency(item.product.price)}
                        </p>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center border-2 border-gray-200 rounded-lg bg-white shadow-sm">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-colors rounded-l-lg"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="px-4 py-2 text-center min-w-[60px] font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 disabled:opacity-50 transition-colors rounded-r-lg"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => removeItem(item.product.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </motion.button>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">
                        Subtotal: <span className="text-primary-600">{formatCurrency(item.product.price * item.quantity)}</span>
                      </span>
                      {item.product.stock < 5 && (
                        <span className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                          Only {item.product.stock} left in stock
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="sticky top-8 shadow-lg">
                <div className="p-6">
                  <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">
                    Order Summary
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-lg">Subtotal</span>
                      <span className="font-semibold text-lg">{formatCurrency(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-lg">Shipping</span>
                      <span className="font-semibold text-lg">
                        {totalPrice > 999 ? 'Free' : formatCurrency(99)}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between">
                        <span className="text-xl font-bold text-gray-900">Total</span>
                        <span className="text-xl font-bold text-primary-600">
                          {formatCurrency(totalPrice )}
                           {/* {formatCurrency(totalPrice + (totalPrice > 999 ? 0 : 99))} */}

                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {totalPrice <= 999 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4"
                    >
                      <p className="text-sm text-green-700 font-medium">
                        🚚 Add {formatCurrency(999 - totalPrice)} more for free shipping!
                      </p>
                    </motion.div>
                  )}
                  
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      className="w-full mt-6 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-slate-800 font-semibold py-3 shadow-lg"
                      size="lg"
                      onClick={handleCheckout}
                    >
                      Proceed to Checkout <ArrowRight className="ml-2" size={20} />
                    </Button>
                  </motion.div>
                  
                  <Link to="/products">
                    <Button variant="outline" className="w-full mt-3 border-2 hover:bg-gray-50">
                      Continue Shopping
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}