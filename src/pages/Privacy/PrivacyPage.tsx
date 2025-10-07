import React from 'react'
import { motion } from 'framer-motion'
import { Shield, Eye, Lock, Users, FileText, Mail } from 'lucide-react'

export const PrivacyPage: React.FC = () => {
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
            Privacy <span className="text-primary-600">Policy</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 mb-8"
          >
            Your privacy is important to us. Learn how we collect, use, and protect your information.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-gray-500"
          >
            Last updated: January 15, 2025
          </motion.div>
        </div>
      </section>

      {/* Privacy Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="bg-primary-50 p-6 rounded-lg mb-8">
              <div className="flex items-center mb-4">
                <Shield className="text-primary-600 mr-3" size={24} />
                <h2 className="text-xl font-semibold text-gray-900">Our Commitment</h2>
              </div>
              <p className="text-gray-700">
                At Craftly, we are committed to protecting your privacy and ensuring the security 
                of your personal information. This Privacy Policy explains how we collect, use, 
                disclose, and safeguard your information when you use our platform.
              </p>
            </div>
          </motion.div>

          {/* Privacy Sections */}
          <div className="space-y-12">
            {[
              {
                icon: Eye,
                title: 'Information We Collect',
                content: [
                  {
                    subtitle: 'Personal Information',
                    text: 'We collect information you provide directly, such as your name, email address, phone number, shipping address, and payment information when you create an account or make a purchase.'
                  },
                  {
                    subtitle: 'Usage Information',
                    text: 'We automatically collect information about how you use our platform, including your IP address, browser type, pages visited, and time spent on our site.'
                  },
                  {
                    subtitle: 'Device Information',
                    text: 'We may collect information about the device you use to access our platform, including device type, operating system, and unique device identifiers.'
                  }
                ]
              },
              {
                icon: Lock,
                title: 'How We Use Your Information',
                content: [
                  {
                    subtitle: 'Service Provision',
                    text: 'We use your information to provide, maintain, and improve our services, process transactions, and communicate with you about your orders.'
                  },
                  {
                    subtitle: 'Personalization',
                    text: 'We may use your information to personalize your experience, recommend products, and provide targeted content and advertisements.'
                  },
                  {
                    subtitle: 'Communication',
                    text: 'We use your contact information to send you important updates, promotional materials (with your consent), and respond to your inquiries.'
                  }
                ]
              },
              {
                icon: Users,
                title: 'Information Sharing',
                content: [
                  {
                    subtitle: 'Service Providers',
                    text: 'We may share your information with trusted third-party service providers who help us operate our platform, process payments, and deliver products.'
                  },
                  {
                    subtitle: 'Legal Requirements',
                    text: 'We may disclose your information if required by law, court order, or government regulation, or to protect our rights and safety.'
                  },
                  {
                    subtitle: 'Business Transfers',
                    text: 'In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the business transaction.'
                  }
                ]
              },
              {
                icon: FileText,
                title: 'Data Security',
                content: [
                  {
                    subtitle: 'Security Measures',
                    text: 'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.'
                  },
                  {
                    subtitle: 'Payment Security',
                    text: 'All payment transactions are processed through secure, encrypted connections using industry-standard security protocols.'
                  },
                  {
                    subtitle: 'Data Retention',
                    text: 'We retain your personal information only as long as necessary to fulfill the purposes outlined in this policy or as required by law.'
                  }
                ]
              },
              {
                icon: Mail,
                title: 'Your Rights',
                content: [
                  {
                    subtitle: 'Access and Update',
                    text: 'You have the right to access, update, or correct your personal information at any time through your account settings.'
                  },
                  {
                    subtitle: 'Data Portability',
                    text: 'You can request a copy of your personal information in a structured, machine-readable format.'
                  },
                  {
                    subtitle: 'Deletion',
                    text: 'You can request deletion of your personal information, subject to certain legal and business requirements.'
                  },
                  {
                    subtitle: 'Marketing Opt-out',
                    text: 'You can opt out of receiving promotional communications from us at any time by following the unsubscribe instructions in our emails.'
                  }
                ]
              }
            ].map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-lg shadow-sm"
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                    <section.icon className="text-primary-600" size={24} />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-gray-900">
                    {section.title}
                  </h2>
                </div>
                
                <div className="space-y-4">
                  {section.content.map((item, itemIndex) => (
                    <div key={itemIndex}>
                      <h3 className="font-semibold text-gray-900 mb-2">{item.subtitle}</h3>
                      <p className="text-gray-600 leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 bg-craft-50 p-8 rounded-lg text-center"
          >
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
              Questions About Privacy?
            </h2>
            <p className="text-gray-600 mb-6">
              If you have any questions about this Privacy Policy or our data practices, 
              please don't hesitate to contact us.
            </p>
            <div className="space-y-2">
              <p className="text-primary-600 font-medium">privacy@craftly.com</p>
              <p className="text-gray-600">+91 98765 43210</p>
              <p className="text-gray-600">Mumbai, Maharashtra, India</p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}