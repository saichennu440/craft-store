import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { ArrowLeft, Upload, X } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import { supabase } from '../../lib/supabase'
import { generateSlug } from '../../lib/utils'
import type { Product } from '../../types/database'
import toast from 'react-hot-toast'

interface ProductFormData {
  title: string
  description: string
  price: number
  stock: number
  is_published: boolean
}

interface ProductFormProps {
  product?: Product | null
  onSuccess: () => void
  onCancel: () => void
}

export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  onSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<string[]>(product?.images || [])
  const [uploadingImage, setUploadingImage] = useState(false)
  
  const { register, handleSubmit, formState: { errors } } = useForm<ProductFormData>({
    defaultValues: {
      title: product?.title || '',
      description: product?.description || '',
      price: product?.price || 0,
      stock: product?.stock || 0,
      is_published: product?.is_published ?? true
    }
  })
  
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    setUploadingImage(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `products/${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)
      
      if (uploadError) throw uploadError
      
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)
      
      setImages([...images, publicUrl])
      toast.success('Image uploaded successfully')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }
  
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }
  
  const onSubmit = async (data: ProductFormData) => {
    if (images.length === 0) {
      toast.error('Please add at least one image')
      return
    }
    
    setLoading(true)
    try {
      const slug = generateSlug(data.title)
      const productData = {
        ...data,
        slug,
        images,
        price: Number(data.price),
        stock: Number(data.stock)
      }
      
      if (product) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id)
        
        if (error) throw error
        toast.success('Product updated successfully')
      } else {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert(productData)
        
        if (error) throw error
        toast.success('Product created successfully')
      }
      
      onSuccess()
    } catch (error: any) {
      console.error('Error saving product:', error)
      toast.error(error.message || 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onCancel}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <p className="text-gray-600">
            {product ? 'Update product information' : 'Create a new product for your store'}
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Information */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h3>
              
              <div className="space-y-4">
                <Input
                  label="Product Title"
                  {...register('title', { required: 'Title is required' })}
                  error={errors.title?.message}
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    {...register('description', { required: 'Description is required' })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Describe your product..."
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Price (₹)"
                    type="number"
                    step="0.01"
                    {...register('price', { 
                      required: 'Price is required',
                      min: { value: 0, message: 'Price must be positive' }
                    })}
                    error={errors.price?.message}
                  />
                  
                  <Input
                    label="Stock Quantity"
                    type="number"
                    {...register('stock', { 
                      required: 'Stock is required',
                      min: { value: 0, message: 'Stock must be positive' }
                    })}
                    error={errors.stock?.message}
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_published"
                    {...register('is_published')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_published" className="ml-2 block text-sm text-gray-900">
                    Publish product (make it visible to customers)
                  </label>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Product Images */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h3>
              
              {/* Image Upload */}
              <div className="mb-4">
                <label className="block">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 cursor-pointer transition-colors">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-sm text-gray-600">
                      {uploadingImage ? 'Uploading...' : 'Click to upload image'}
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </div>
                </label>
              </div>
              
              {/* Image Preview */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Product ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
        
        {/* Form Actions */}
        <Card>
          <div className="p-6">
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                {product ? 'Update Product' : 'Create Product'}
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  )
}