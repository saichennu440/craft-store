import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Package, Clock, Truck, CheckCircle, XCircle } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatDate } from '../../lib/utils'
import type { Order } from '../../types/database'

interface OrderWithItems extends Order {
  id: Key | null | undefined
  created_at(created_at: any): React.ReactNode
  status(status: any): React.ReactNode
  phone: ReactNode
  address: ReactNode
  total_amount(total_amount: any): React.ReactNode
  order_items: Array<{
    id: string
    quantity: number
    price: number
    products: {
      id: string
      title: string
      images: string[]
    }
  }>
}

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const { user, isAuthenticated } = useAuthStore()
  
  useEffect(() => {
    if (!isAuthenticated || !user) return
    
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              id,
              quantity,
              price,
              products (
                id,
                title,
                images
              )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        setOrders(data || [])
      } catch (error) {
        console.error('Error fetching orders:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchOrders()
  }, [user, isAuthenticated])
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-600" size={20} />
      case 'paid':
        return <CheckCircle className="text-green-600" size={20} />
      case 'shipped':
        return <Truck className="text-blue-600" size={20} />
      case 'delivered':
        return <Package className="text-green-600" size={20} />
      case 'cancelled':
        return <XCircle className="text-red-600" size={20} />
      default:
        return <Clock className="text-gray-600" size={20} />
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'shipped':
        return 'bg-blue-100 text-blue-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h2>
          <p className="text-gray-600">You need to be signed in to view your orders.</p>
        </div>
      </div>
    )
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-lg h-32" />
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-display font-bold text-gray-900 mb-8"
        >
          Your Orders
        </motion.h1>
        
        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Package size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-600">When you place orders, they'll appear here.</p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.id.slice(0, 8)}
                        </h3>
                        <p className="text-gray-600">
                          Placed on {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                        {getStatusIcon(order.status)}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="space-y-3">
                        {order.order_items.map((item) => (
                          <div 
                            key={item.id}
                            className="flex justify-between items-start border-b border-gray-100 pb-4"
                          >
                            <div className="flex items-start space-x-4">
                              <img
                                src={item.products.images?.[0] || 'https://via.placeholder.com/80x80'}
                                alt={item.products.title}
                                className="w-20 h-20 object-cover rounded-md border"
                              />
                              <div className="flex flex-col justify-between">
                                <h3 className="font-semibold text-gray-900 text-base leading-tight">
                                  {item.products.title}
                                </h3>
                                <p className="text-gray-600 text-sm mt-1">
                                  Qty: {item.quantity} × {formatCurrency(item.price)}
                                </p>
                              </div>
                            </div>
                          
                            <div className="text-right min-w-[80px]">
                              <span className="font-semibold text-gray-900 text-base">
                                {formatCurrency(item.price * item.quantity)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="border-t mt-4 pt-4 flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                          <p>Phone: {order.phone}</p>
                          <p>Address: {order.address}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-primary-600">
                            Total: {formatCurrency(order.total_amount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}