import React from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { XCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

export const PaymentFailure: React.FC = () => {
  const [searchParams] = useSearchParams()
  const error = searchParams.get('error') || 'Payment was cancelled or failed'
  
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
            className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <XCircle className="text-red-600" size={40} />
          </motion.div>
          
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-4">
            Payment Failed
          </h1>
          
          <p className="text-gray-600 mb-8">
            {error}. Don't worry, no charges were made to your account.
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <div className="p-6 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                What happened?
              </h2>
              
              <div className="text-left space-y-2 mb-6">
                <p className="text-gray-600">• Payment was cancelled by user</p>
                <p className="text-gray-600">• Insufficient balance in payment method</p>
                <p className="text-gray-600">• Network connectivity issues</p>
                <p className="text-gray-600">• Payment gateway timeout</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/cart">
                  <Button>
                    <RefreshCw className="mr-2" size={16} />
                    Try Again
                  </Button>
                </Link>
                <Link to="/products">
                  <Button variant="outline">
                    <ArrowLeft className="mr-2" size={16} />
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8"
        >
          <p className="text-gray-500 text-sm">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@craftly.com" className="text-primary-600 hover:underline">
              support@craftly.com
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  )
}