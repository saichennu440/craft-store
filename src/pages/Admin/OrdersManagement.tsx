// src/pages/admin/OrdersManagement.tsx
import React, { ReactNode, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Package, Clock, Truck, CheckCircle, XCircle, Eye } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatDate } from '../../lib/utils'
import type { Order } from '../../types/database'
import toast from 'react-hot-toast'

interface OrderWithDetails extends Order {
  id: string
  status: string
  created_at(created_at: any): React.ReactNode
  phone?: ReactNode
  address?: ReactNode
  total_amount(total_amount: any): React.ReactNode
  users?: {
    full_name?: string | null
    email?: string | null
  } | null
  order_items?: Array<{
    id: string
    quantity: number
    price: number
    products: {
      title?: string
      images?: string[]
    } | null
  }>
}

export const OrdersManagement: React.FC = () => {
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)

  useEffect(() => {
    fetchOrders()

    // Realtime subscription for orders table - keeps admin UI in sync
    const channel = supabase
      .channel('public:orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        // whenever orders change -> refresh list
        () => {
          fetchOrders().catch(() => {})
        }
      )
      .subscribe()

    return () => {
      // cleanup subscription
      // @ts-ignore supabase-js types may vary by version
      supabase.removeChannel?.(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch orders - try to get user info from either `users` (if you have RLS/profile join) or `profiles`.
  const fetchOrders = async () => {
    setLoading(true)
    try {
      // We try to select both possible relations — "users" (if your foreign key uses that) and "profiles" (common pattern)
      // Then normalize results so each order has .users with full_name and email if available.
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          users (full_name, email),
          profiles (full_name, email),
          order_items (
            id,
            quantity,
            price,
            products (title, images)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const normalized = (data || []).map((o: any) => {
        const userInfo = o.users ?? o.profiles ?? null
        // keep a small shape
        const users = userInfo ? { full_name: userInfo.full_name ?? null, email: userInfo.email ?? null } : null
        return {
          ...o,
          users,
        } as OrderWithDetails
      })

      setOrders(normalized)
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  // update status handler
  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)

      if (error) throw error

      // optimistic UI update
      setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status } : o)))

      // if selected order is open, update it too
      setSelectedOrder(prev => (prev && prev.id === orderId ? { ...prev, status } : prev))

      toast.success('Order status updated successfully')
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
    }
  }

  // when opening details, ensure we have user info; if missing, fetch it from profiles/users table
  const onViewDetails = async (order: OrderWithDetails) => {
    if (order.users && (order.users.full_name || order.users.email)) {
      setSelectedOrder(order)
      return
    }

    // attempt to fetch profile by order.user_id
    try {
      const userId = (order as any).user_id || (order as any).userId
      if (!userId) {
        setSelectedOrder(order)
        return
      }

      // Try profiles table first
      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', userId)
        .single()

      if (!pErr && profile) {
        setSelectedOrder({ ...order, users: { full_name: profile.full_name ?? null, email: profile.email ?? null } })
        return
      }

      // fallback to users table (auth table) if you store profile there
      const { data: userRow, error: uErr } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', userId)
        .single()

      if (!uErr && userRow) {
        setSelectedOrder({ ...order, users: { full_name: userRow.full_name ?? null, email: userRow.email ?? null } })
        return
      }

      // nothing found — just open it (will show N/A)
      setSelectedOrder(order)
    } catch (err) {
      console.warn('Failed to fetch user details for order view:', err)
      setSelectedOrder(order)
    }
  }

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

  const filteredOrders = orders.filter(order => {
    const q = searchTerm.trim().toLowerCase()
    const matchesSearch =
      !q ||
      order.id.toLowerCase().includes(q) ||
      (order.users?.full_name || '').toLowerCase().includes(q) ||
      (order.users?.email || '').toLowerCase().includes(q)

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // -------------------------------
  // Rendering (unchanged mostly)...
  // -------------------------------
  if (selectedOrder) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => setSelectedOrder(null)}>
            ← Back to Orders
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Order #{selectedOrder.id.slice(0, 8)}
            </h2>
            <p className="text-gray-600">Placed on {formatDate(selectedOrder.created_at)}</p>
          </div>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
              <div className="space-y-2">
                <p>
                  <strong>Name:</strong>{' '}
                  {selectedOrder.users?.full_name ? selectedOrder.users.full_name : 'N/A'}
                </p>
                <p>
                  <strong>Email:</strong>{' '}
                  {selectedOrder.users?.email ? selectedOrder.users.email : 'N/A'}
                </p>
                <p>
                  <strong>Phone:</strong> {selectedOrder.phone ?? 'N/A'}
                </p>
                <p>
                  <strong>Address:</strong> {selectedOrder.address ?? 'N/A'}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(selectedOrder.status)}
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      selectedOrder.status
                    )}`}
                  >
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value as Order['status'])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Order Items */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
            <div className="space-y-4">
              {selectedOrder.order_items?.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <img
                    src={item.products?.images?.[0] || 'https://via.placeholder.com/60x60'}
                    alt={item.products?.title}
                    className="w-15 h-15 object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.products?.title}</h4>
                    <p className="text-gray-600 text-sm">Qty: {item.quantity} × {formatCurrency(item.price)}</p>
                  </div>
                  <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-lg font-semibold text-primary-600">{formatCurrency(selectedOrder.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // List view
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Orders Management</h2>
        <p className="text-gray-600">Manage customer orders and track their status</p>
      </div>

      <Card>
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input placeholder="Search orders by ID, customer name, or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="animate-pulse bg-white rounded-lg h-32" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order, index) => (
            <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card>
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">#{order.id.slice(0, 8)}</h3>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(order.status)}
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div><strong>Customer:</strong> {order.users?.full_name ?? 'N/A'}</div>
                        <div><strong>Date:</strong> {formatDate(order.created_at)}</div>
                        <div><strong>Total:</strong> {formatCurrency(order.total_amount)}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => onViewDetails(order)}>
                        <Eye size={16} className="mr-1" />
                        View Details
                      </Button>

                      <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])} className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {filteredOrders.length === 0 && !loading && (
        <Card>
          <div className="p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">Orders will appear here when customers make purchases.</p>
          </div>
        </Card>
      )}
    </div>
  )
}
