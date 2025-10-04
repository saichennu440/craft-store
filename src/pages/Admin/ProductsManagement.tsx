import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, CreditCard as Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { ProductForm } from './ProductForm'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/utils'
import type { Product } from '../../types/database'
import toast from 'react-hot-toast'

export const ProductsManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  useEffect(() => {
    fetchProducts()
  }, [])
  
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }
  
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setProducts(products.filter(p => p.id !== id))
      toast.success('Product deleted successfully')
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Failed to delete product')
    }
  }
  
  const handleTogglePublished = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_published: !product.is_published })
        .eq('id', product.id)
      
      if (error) throw error
      
      setProducts(products.map(p => 
        p.id === product.id 
          ? { ...p, is_published: !p.is_published }
          : p
      ))
      
      toast.success(`Product ${product.is_published ? 'unpublished' : 'published'}`)
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error('Failed to update product')
    }
  }
  
  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingProduct(null)
    fetchProducts()
  }
  
  if (showForm) {
    return (
      <ProductForm
        product={editingProduct}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowForm(false)
          setEditingProduct(null)
        }}
      />
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Products Management</h2>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2" size={20} />
          Add Product
        </Button>
      </div>
      
      {/* Search */}
      <Card>
        <div className="p-4">
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>
      
      {/* Products List */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-lg h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Product Image */}
                    <img
                      src={product.images?.[0] || 'https://via.placeholder.com/100x100'}
                      alt={product.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    
                    {/* Product Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{product.title}</h3>
                          <p className="text-gray-600 text-sm mt-1 line-clamp-2">{product.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-lg font-bold text-primary-600">
                              {formatCurrency(product.price)}
                            </span>
                            <span className="text-sm text-gray-500">Stock: {product.stock}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              product.is_published 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {product.is_published ? 'Published' : 'Draft'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePublished(product)}
                      >
                        {product.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingProduct(product)
                          setShowForm(true)
                        }}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
      
      {filteredProducts.length === 0 && !loading && (
        <Card>
          <div className="p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first product.</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2" size={20} />
              Add Product
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}