import React from 'react'
import { Link } from 'react-router-dom'
import { Heart, Mail, Phone, MapPin } from 'lucide-react'

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-display font-bold">
                {import.meta.env.VITE_APP_NAME || 'Craftly'}
              </span>
            </div>
            <p className="text-gray-400">
              Discover unique handmade crafts created with love and attention to detail.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link to="/" className="block text-gray-400 hover:text-white transition-colors">
                Home
              </Link>
              <Link to="/products" className="block text-gray-400 hover:text-white transition-colors">
                Products
              </Link>
              <Link to="/about" className="block text-gray-400 hover:text-white transition-colors">
                About Us
              </Link>
              <Link to="/contact" className="block text-gray-400 hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
          
          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Categories</h3>
            <div className="space-y-2">
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                Home Decor
              </a>
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                Jewelry
              </a>
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                Pottery
              </a>
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                Textiles
              </a>
            </div>
          </div>
          
          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Get in Touch</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-gray-400">
                <Mail size={16} />
                <span>hello@craftly.com</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <Phone size={16} />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <MapPin size={16} />
                <span>Mumbai, India</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 flex items-center justify-center space-x-1">
            <span>Made with</span>
            <Heart size={16} className="text-red-500" />
            <span>for crafters everywhere</span>
          </p>
          <p className="text-gray-500 mt-2">
            © 2025 {import.meta.env.VITE_APP_NAME || 'Craftly'}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}