import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingCart, User, Search, Menu, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isAuthenticated, isAdminUser, signOut } = useAuthStore()
  const { getTotalItems } = useCartStore()
  const navigate = useNavigate()
  
  const totalItems = getTotalItems()
  
  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }
  
  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-base sm:text-lg">C2C</span>
            </div>
            <span className="text-lg sm:text-xl font-display font-bold text-gray-900">
              {import.meta.env.VITE_APP_NAME || 'Clay 2 Crafts'}
            </span>
          </Link>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
            >
              Home
            </Link>
            <Link 
              to="/products" 
              className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
            >
              Products
            </Link>
            <Link 
              to="/about" 
              className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
            >
              About
            </Link>
            <Link 
              to="/contact" 
              className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
            >
              Contact
            </Link>
          </nav>
          
          {/* Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Search */}
            {/* <button className="hidden sm:block p-2 text-gray-500 hover:text-primary-600 transition-colors">
              <Search size={18} className="sm:w-5 sm:h-5" />
            </button> */}
            
            {/* Cart */}
            <Link to="/cart" className="relative p-2 text-gray-500 hover:text-primary-600 transition-colors">
              <ShoppingCart size={18} className="sm:w-5 sm:h-5" />
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-accent-400 text-black text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center"
                >
                  {totalItems > 9 ? '9+' : totalItems}
                </motion.span>
              )}
            </Link>
            
            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Link to="/orders" className="hidden sm:block">
                    <Button variant="ghost" size="sm">
                      Orders
                    </Button>
                  </Link>
                  {isAdminUser && (
                    <Link to="/admin" className="hidden sm:block">
                      <Button variant="outline" size="sm">
                        Admin
                      </Button>
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="p-2 text-gray-500 hover:text-primary-600 transition-colors"
                  >
                    <User size={18} className="sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/auth">
                <Button size="sm" className="text-sm px-3 py-1.5">Sign In</Button>
              </Link>
            )}
            
            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-gray-500 hover:text-primary-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t bg-white"
          >
            <div className="py-4 space-y-2">
              <Link 
                to="/" 
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/products" 
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Products
              </Link>
              <Link 
                to="/about" 
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                to="/contact" 
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              {isAuthenticated && (
                <>
                  <Link 
                    to="/orders" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Orders
                  </Link>
                  {isAdminUser && (
                    <Link to="/admin">
                      <span className="block px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium">
                        Admin Panel
                      </span>
                    </Link>
                  )}
                  <button 
                    onClick={() => {
                      handleSignOut()
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </header>
  )
}