import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { CreditCard, MapPin, Phone, User } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import { useCartStore } from '../../store/cartStore'
import { useAuthStore } from '../../store/authStore'
import { createPayment } from '../../lib/phonepe'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/utils'
import toast from 'react-hot-toast'

interface CheckoutForm {
  fullName: string
  phone: string
  address: string
  city: string
  pincode: string
}

export const CheckoutPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const { items, getTotalPrice, clearCart } = useCartStore()
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  
  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutForm>()
  
  const totalPrice = getTotalPrice()
  const shippingCost = totalPrice > 999 ? 0 : 99
  const finalTotal = totalPrice + shippingCost
  
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth?redirect=/checkout')
      return
    }
    
    if (items.length === 0) {
      navigate('/cart')
      return
    }
  }, [isAuthenticated, items.length, navigate])
  
  const onSubmit = async (data: CheckoutForm) => {
    if (!user) return
    
    setLoading(true)
    try {
      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: finalTotal,
          phone: data.phone,
          address: `${data.address}, ${data.city}, ${data.pincode}`,
          status: 'pending'
        })
        .select()
        .single()
      
      if (orderError) throw orderError
      
      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price
      }))
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
      
      if (itemsError) throw itemsError
      
      // Create payment
      const paymentResponse = await createPayment({
        orderId: order.id,
        amount: finalTotal,
        phone: data.phone,
        callbackUrl: window.location.origin
      })
      
      console.log('Payment response:', paymentResponse)
      
      if (paymentResponse.success && paymentResponse.paymentUrl) {
        // Clear cart and redirect to payment
        clearCart()
        toast.success('Redirecting to payment...')
        window.location.href = paymentResponse.paymentUrl
      } else {
        throw new Error(paymentResponse.error || 'Payment creation failed')
      }
      
    } catch (error: any) {
      console.error('Checkout error:', error)
      toast.error(error.message || 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }
  
  if (!isAuthenticated || items.length === 0) {
    return null
  }
  
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-display font-bold text-gray-900 mb-8"
        >
          Checkout
        </motion.h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <MapPin className="mr-2" size={20} />
                  Shipping Information
                </h2>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <Input
                    label="Full Name"
                    {...register('fullName', { required: 'Full name is required' })}
                    error={errors.fullName?.message}
                    defaultValue={user?.full_name || ''}
                  />
                  
                  <Input
                    label="Phone Number"
                    type="tel"
                    {...register('phone', { 
                      required: 'Phone number is required',
                      pattern: {
                        value: /^[6-9]\d{9}$/,
                        message: 'Please enter a valid Indian phone number'
                      }
                    })}
                    error={errors.phone?.message}
                    placeholder="9876543210"
                  />
                  
                  <Input
                    label="Address"
                    {...register('address', { required: 'Address is required' })}
                    error={errors.address?.message}
                    placeholder="Street address, apartment, suite, etc."
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="City"
                      {...register('city', { required: 'City is required' })}
                      error={errors.city?.message}
                    />
                    
                    <Input
                      label="PIN Code"
                      {...register('pincode', { 
                        required: 'PIN code is required',
                        pattern: {
                          value: /^\d{6}$/,
                          message: 'Please enter a valid 6-digit PIN code'
                        }
                      })}
                      error={errors.pincode?.message}
                      placeholder="400001"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full mt-6 bg-primary-600 hover:bg-primary-700 text-white"
                    loading={loading}
                    size="lg"
                  >
                    <CreditCard className="mr-2" size={20} />
                    Pay {formatCurrency(finalTotal)}
                  </Button>
                </form>
              </div>
            </Card>
          </motion.div>
          
          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Order Summary
                </h2>
                
                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4">
                      <img
                        src={item.product.images?.[0] || 'https://via.placeholder.com/60x60'}
                        alt={item.product.title}
                        className="w-15 h-15 object-cover rounded-md"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm">
                          {item.product.title}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Qty: {item.quantity} × {formatCurrency(item.product.price)}
                        </p>
                      </div>
                      <span className="font-medium">
                        {formatCurrency(item.product.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">
                      {shippingCost === 0 ? 'Free' : formatCurrency(shippingCost)}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">Total</span>
                      <span className="text-lg font-semibold text-primary-600">
                        {formatCurrency(finalTotal)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {totalPrice <= 999 && (
                  <p className="text-sm text-green-600 mt-4">
                    Add {formatCurrency(999 - totalPrice)} more for free shipping
                  </p>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}