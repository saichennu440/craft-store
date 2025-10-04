import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Package, ArrowRight } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { verifyPayment } from '../../lib/phonepe'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/utils'

export const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const transactionId = searchParams.get('transactionId')
  const status = searchParams.get('status')
  
  useEffect(() => {
    const handlePaymentVerification = async () => {
      if (!transactionId) {
        setLoading(false)
        return
      }
      
      try {
        console.log('Verifying payment for transaction:', transactionId)
        
        // Always verify payment through API to ensure status is updated
        const verificationResult = await verifyPayment(transactionId, transactionId)
        console.log('Verification result:', verificationResult)
        
        // Fetch order details after verification
        const { data: payment, error: fetchError } = await supabase
          .from('payments')
          .select(`
            *,
            orders (
              *,
              order_items (
                *,
                products (*)
              )
            )
          `)
          .eq('provider_payment_id', transactionId)
          .single()
        
        if (fetchError) {
          console.error('Error fetching payment details:', fetchError)
        } else if (payment?.orders) {
          console.log('Order details:', payment.orders)
          setOrder(payment.orders)
        } else {
          console.log('No order found for payment')
        }
        
        // If verification was successful, show success even if order fetch failed
        if (verificationResult.success || status === 'SUCCESS') {
          console.log('Payment verification successful')
        } else {
          console.log('Payment verification failed:', verificationResult.error)
        }
      } catch (error) {
        console.error('Payment verification error:', error)
      } finally {
        setLoading(false)
      }
    }
    
    handlePaymentVerification()
  }, [transactionId, status])
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="text-green-600" size={40} />
          </motion.div>
          
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>
          
          <p className="text-gray-600 mb-8">
            Thank you for your order. We've received your payment and will process your order shortly.
          </p>
        </motion.div>
        
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Order Details
                  </h2>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    {order.status}
                  </span>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order ID</span>
                    <span className="font-medium">{order.id.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount</span>
                    <span className="font-medium">{formatCurrency(order.total_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone</span>
                    <span className="font-medium">{order.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Address</span>
                    <span className="font-medium text-right max-w-xs">{order.address}</span>
                  </div>
                </div>
                
                {order.order_items && (
                  <div className="border-t pt-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Items Ordered</h3>
                    <div className="space-y-3">
                      {order.order_items.map((item: any) => (
                        <div key={item.id} className="flex items-center space-x-4">
                          <img
                            src={item.products?.images?.[0] || 'https://via.placeholder.com/50x50'}
                            alt={item.products?.title}
                            className="w-12 h-12 object-cover rounded-md"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm">
                              {item.products?.title}
                            </h4>
                            <p className="text-gray-600 text-sm">
                              Qty: {item.quantity} × {formatCurrency(item.price)}
                            </p>
                          </div>
                          <span className="font-medium">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8 space-y-4"
        >
          <div className="flex items-center justify-center text-gray-600 mb-4">
            <Package className="mr-2" size={20} />
            <span>We'll send you tracking information once your order ships</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products">
              <Button variant="outline">
                Continue Shopping
              </Button>
            </Link>
            <Link to="/orders">
              <Button>
                View Orders <ArrowRight className="ml-2" size={16} />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}