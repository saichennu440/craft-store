import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Package, ShoppingBag, Users, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/utils'

interface DashboardStats {
  totalProducts: number
  totalOrders: number
  totalUsers: number
  totalRevenue: number
  recentOrders: any[]
  topProducts: any[]
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    recentOrders: [],
    topProducts: []
  })
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        // Fetch total products
        const { count: productsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
        
        // Fetch total orders
        const { count: ordersCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
        
        // Fetch total users
        const { count: usersCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
        
        // Fetch total revenue
        const { data: revenueData } = await supabase
          .from('orders')
          .select('total_amount')
          .eq('status', 'paid')
        
        const totalRevenue = revenueData?.reduce((sum, order) => sum + order.total_amount, 0) || 0
        
        // Fetch recent orders
        const { data: recentOrders } = await supabase
          .from('orders')
          .select(`
            *,
            users (full_name, email)
          `)
          .order('created_at', { ascending: false })
          .limit(5)
        
        // Fetch top products
        const { data: topProducts } = await supabase
          .from('order_items')
          .select(`
            product_id,
            quantity,
            products (title, price, images)
          `)
          .limit(5)
        
        setStats({
          totalProducts: productsCount || 0,
          totalOrders: ordersCount || 0,
          totalUsers: usersCount || 0,
          totalRevenue,
          recentOrders: recentOrders || [],
          topProducts: topProducts || []
        })
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchDashboardStats()
  }, [])
  
  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-purple-500',
      change: '+15%'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'bg-orange-500',
      change: '+23%'
    }
  ]
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse bg-white rounded-lg h-32" />
        ))}
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color}`}>
                    <stat.icon className="text-white" size={24} />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <TrendingUp className="text-green-500 mr-1" size={16} />
                  <span className="text-sm text-green-500 font-medium">{stat.change}</span>
                  <span className="text-sm text-gray-500 ml-1">from last month</span>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {/* Recent Orders and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
              <div className="space-y-4">
                {stats.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {(order.users as any)?.full_name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-600">#{order.id.slice(0, 8)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(order.total_amount)}</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'paid' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
        
        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Products</h3>
              <div className="space-y-4">
                {stats.topProducts.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <img
                      src={(item.products as any)?.images?.[0] || 'https://via.placeholder.com/50x50'}
                      alt={(item.products as any)?.title}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{(item.products as any)?.title}</p>
                      <p className="text-sm text-gray-600">Sold: {item.quantity} units</p>
                    </div>
                    <p className="font-medium text-gray-900">
                      {formatCurrency((item.products as any)?.price || 0)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}