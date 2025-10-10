import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '../types/database'

interface WishlistStore {
  items: Product[]
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  clearWishlist: () => void
  getTotalItems: () => number
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product: Product) => {
        set((state) => {
          const existingItem = state.items.find(item => item.id === product.id)
          
          if (existingItem) {
            // Item already in wishlist, don't add again
            return state
          }
          
          return {
            items: [...state.items, product]
          }
        })
      },
      
      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter(item => item.id !== productId)
        }))
      },
      
      isInWishlist: (productId: string) => {
        return get().items.some(item => item.id === productId)
      },
      
      clearWishlist: () => {
        set({ items: [] })
      },
      
      getTotalItems: () => {
        return get().items.length
      }
    }),
    {
      name: 'wishlist-storage',
      partialize: (state) => ({ items: state.items })
    }
  )
)