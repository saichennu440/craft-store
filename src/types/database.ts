export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'user' | 'admin'
          full_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'user' | 'admin'
          full_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'user' | 'admin'
          full_name?: string | null
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          title: string
          slug: string
          description: string
          price: number
          stock: number
          images: string[]
          metadata: any
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description: string
          price: number
          stock: number
          images: string[]
          metadata?: any
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          description?: string
          price?: number
          stock?: number
          images?: string[]
          metadata?: any
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          total_amount: number
          status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
          phone: string
          address: string
          metadata: any
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_amount: number
          status?: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
          phone: string
          address: string
          metadata?: any
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_amount?: number
          status?: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
          phone?: string
          address?: string
          metadata?: any
          created_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          price?: number
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          order_id: string
          provider: string
          provider_payment_id: string
          amount: number
          status: 'pending' | 'success' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          provider: string
          provider_payment_id: string
          amount: number
          status?: 'pending' | 'success' | 'failed'
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          provider?: string
          provider_payment_id?: string
          amount?: number
          status?: 'pending' | 'success' | 'failed'
          created_at?: string
        }
      }
    }
  }
}

// Additional types for the application
export interface CartItem {
  id: string
  product: Database['public']['Tables']['products']['Row']
  quantity: number
}

export interface User extends Database['public']['Tables']['users']['Row'] {
    id: string;
    full_name: any;
    email: any;
    role: string;
    created_at(created_at: any): import("react").ReactNode;
}
export interface Product extends Database['public']['Tables']['products']['Row'] {
  slug: any
  is_published: any
  title: any
  description: any
  images: any
  price(price: any): import("react").ReactNode
  stock: ReactNode
  id: string;
}
export interface Order extends Database['public']['Tables']['orders']['Row'] {}
export interface OrderItem extends Database['public']['Tables']['order_items']['Row'] {}
export interface Payment extends Database['public']['Tables']['payments']['Row'] {}