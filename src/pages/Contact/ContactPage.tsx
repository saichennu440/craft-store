import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import toast from 'react-hot-toast'

interface ContactForm {
  name: string
  email: string
  subject: string
  message: string
}

export const ContactPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactForm>()
  
  const onSubmit = async (data: ContactForm) => {
    setLoading(true)
    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Message sent successfully! We\'ll get back to you soon.')
      reset()
    } catch (error) {
      toast.error('Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-craft-50 via-background to-craft-100 py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D2691E' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-6xl font-display font-bold text-gray-900 mb-6"
          >
            Get in <span className="text-primary-600">Touch</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 mb-8"
          >
            We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </motion.p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl font-display font-bold text-gray-900 mb-6">
                  Contact Information
                </h2>
                <p className="text-gray-600 mb-8">
                  Have questions about our products, need help with an order, or want to become 
                  an artisan partner? We're here to help!
                </p>
              </div>
              
              <div className="space-y-6">
                {[
                  {
                    icon: Mail,
                    title: 'Email Us',
                    content: 'hello@Clay 2 Crafts.com',
                    description: 'Send us an email anytime'
                  },
                  {
                    icon: Phone,
                    title: 'Call Us',
                    content: '+91 98765 43210',
                    description: 'Mon-Fri from 9am to 6pm'
                  },
                  {
                    icon: MapPin,
                    title: 'Visit Us',
                    content: 'Mumbai, Maharashtra, India',
                    description: 'Come say hello at our office'
                  },
                  {
                    icon: Clock,
                    title: 'Working Hours',
                    content: 'Monday - Friday: 9:00 AM - 6:00 PM',
                    description: 'Saturday: 10:00 AM - 4:00 PM'
                  }
                ].map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-4"
                  >
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <item.icon className="text-primary-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-primary-600 font-medium mb-1">{item.content}</p>
                      <p className="text-gray-600 text-sm">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <div className="p-8">
                  <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">
                    Send us a Message
                  </h2>
                  
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Your Name"
                        {...register('name', { required: 'Name is required' })}
                        error={errors.name?.message}
                      />
                      <Input
                        label="Email Address"
                        type="email"
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value: /\S+@\S+\.\S+/,
                            message: 'Invalid email address'
                          }
                        })}
                        error={errors.email?.message}
                      />
                    </div>
                    
                    <Input
                      label="Subject"
                      {...register('subject', { required: 'Subject is required' })}
                      error={errors.subject?.message}
                    />
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Message
                      </label>
                      <textarea
                        {...register('message', { required: 'Message is required' })}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Tell us how we can help you..."
                      />
                      {errors.message && (
                        <p className="text-sm text-red-600 mt-1">{errors.message.message}</p>
                      )}
                    </div>
                    
                    <Button type="submit" className="w-full" loading={loading} size="lg">
                      <Send className="mr-2" size={20} />
                      Send Message
                    </Button>
                  </form>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-craft-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600">
              Quick answers to common questions
            </p>
          </motion.div>
          
          <div className="space-y-6">
            {[
              {
                question: 'How long does shipping take?',
                answer: 'Standard shipping takes 3-7 business days. Express shipping is available for 1-2 business days.'
              },
              {
                question: 'What is your return policy?',
                answer: 'We offer a 30-day return policy for unused items in original condition. Custom orders are non-returnable.'
              },
              {
                question: 'Do you ship internationally?',
                answer: 'Yes, we ship worldwide. International shipping times vary by location, typically 7-14 business days.'
              },
              {
                question: 'How can I become an artisan partner?',
                answer: 'Contact us through this form or email us at partners@Clay 2 Crafts.com with samples of your work and your story.'
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-lg shadow-sm"
              >
                <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}