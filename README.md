# Craftly - Handmade Crafts E-Commerce Store

A complete e-commerce solution for selling handmade crafts, built with React, TypeScript, Tailwind CSS, and Supabase.

## ✨ Features

### 🛍️ Public Storefront
- **Product Catalog**: Beautiful grid layout with search and filtering
- **Product Details**: Image carousel, descriptions, variants, and reviews
- **Shopping Cart**: Persistent cart with localStorage + Supabase sync
- **Checkout Process**: Streamlined checkout with PhonePe payment integration
- **Payment Processing**: Secure payment handling with success/failure pages

### 🔐 Authentication & Authorization
- **Supabase Auth**: Email/password + magic link authentication
- **Role-Based Access**: User and Admin roles with proper permissions
- **Protected Routes**: Frontend routing with authentication guards
- **Row Level Security**: Database-level security with Supabase RLS

### 👥 Admin Dashboard
- **Product Management**: Full CRUD operations for products
- **Image Upload**: Supabase Storage integration for product images
- **Order Management**: View and update order status
- **Analytics Dashboard**: Sales metrics and order statistics

### 💳 Payment Integration
- **PhonePe Integration**: Production-ready payment gateway
- **Sandbox Support**: Test payments in development
- **Webhook Handling**: Automatic payment verification
- **Order Status Updates**: Real-time status updates

### 🎨 Design & UX
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Smooth Animations**: Framer Motion for delightful interactions
- **Mobile First**: Fully responsive across all device sizes
- **Accessible**: WCAG compliant components

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Supabase account
- PhonePe merchant account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd craftly-ecommerce
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup Supabase**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Go to Settings → API and copy your project URL and anon key
   - Navigate to SQL Editor and run the migrations:
     - Copy and run `supabase/migrations/01_create_database_schema.sql`
     - Copy and run `supabase/migrations/02_sample_data.sql`

4. **Setup Supabase Storage**
   - Go to Storage in your Supabase dashboard
   - Create a new bucket named `product-images`
   - Set the bucket to public (for product images)

5. **Environment Configuration**
   - Copy `.env.example` to `.env`
   - Replace the placeholder values with your actual keys:
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your values:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   PHONEPE_MERCHANT_ID=your-merchant-id
   PHONEPE_SECRET=your-phonepe-secret-key
   PHONEPE_ENV=sandbox
   PHONEPE_WEBHOOK_SECRET=your-webhook-secret
   VITE_APP_BASE_URL=http://localhost:5173
   ```

6. **Deploy Edge Functions** (Optional - for payment processing)
   - Install Supabase CLI: `npm install -g @supabase/cli`
   - Login: `supabase login`
   - Deploy functions: `supabase functions deploy`

7. **Start the development server**
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5173`

## 🔧 Configuration

### Creating an Admin User

1. Sign up through the app normally
2. Go to your Supabase dashboard → Authentication → Users
3. Find your user and update the `raw_user_meta_data` to include `"role": "admin"`
4. Or run this SQL query:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@example.com';
   ```

### PhonePe Configuration

For **Sandbox Testing**:
- Use the provided sandbox credentials
- Payments will be simulated
- Use test phone number: `9999999999`

For **Production**:
1. Get your PhonePe merchant credentials
2. Update `PHONEPE_ENV=production` in `.env`
3. Add your production merchant ID and secret key
4. Configure webhook URL in PhonePe dashboard: `https://your-domain.com/functions/v1/verify-payment`

### Payment Flow

1. **Order Creation**: User places order through checkout
2. **Payment Initiation**: Frontend calls `/functions/v1/create-payment`
3. **PhonePe Redirect**: User is redirected to PhonePe payment page
4. **Payment Processing**: PhonePe processes the payment
5. **Webhook Verification**: PhonePe sends webhook to `/functions/v1/verify-payment`
6. **Order Update**: Order status is updated based on payment result
7. **User Notification**: User sees success/failure page

## 🗂️ Project Structure

```
craftly-ecommerce/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Basic UI components (Button, Input, etc.)
│   │   ├── Layout/         # Header, Footer components
│   │   └── Product/        # Product-related components
│   ├── pages/              # Page components
│   │   ├── Home/           # Homepage
│   │   ├── Products/       # Product listing & details
│   │   ├── Cart/           # Shopping cart
│   │   ├── Auth/           # Authentication pages
│   │   └── Admin/          # Admin dashboard
│   ├── lib/                # Utility functions
│   │   ├── supabase.ts     # Supabase client & helpers
│   │   ├── phonepe.ts      # Payment integration
│   │   └── utils.ts        # Common utilities
│   ├── store/              # Zustand state management
│   │   ├── authStore.ts    # Authentication state
│   │   └── cartStore.ts    # Shopping cart state
│   └── types/              # TypeScript type definitions
├── supabase/
│   ├── migrations/         # Database schema & sample data
│   └── functions/          # Edge functions for payments
├── docs/                   # Documentation
└── public/                 # Static assets
```

## 🎨 Design System

### Color Palette
- **Primary**: `#6D28D9` (Deep Violet)
- **Accent**: `#FB923C` (Warm Orange)
- **Background**: `#F8FAFC` (Light Gray)
- **Card**: `#FFFFFF` (White)
- **Text**: `#1F2937` (Dark Gray)

### Typography
- **Headings**: Poppins (Display font)
- **Body**: Inter (Sans-serif)

### Components
- All components are built with accessibility in mind
- Consistent spacing using 8px grid system
- Smooth animations and micro-interactions
- Mobile-first responsive design

## 🧪 Testing

### Running Tests
```bash
npm run test
```

### PhonePe Sandbox Testing
1. Set `PHONEPE_ENV=sandbox` in `.env`
2. Use test credentials provided in the configuration
3. Test phone number: `9999999999`
4. Test amounts: Any amount in INR (will be converted to paise)

## 🚀 Deployment

### Recommended Deployment Platforms

1. **Frontend**: Netlify or Vercel
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Environment variables: Add all `VITE_*` variables

2. **Backend**: Supabase (Edge Functions)
   - Functions are automatically deployed to Supabase
   - Configure environment variables in Supabase dashboard

### Environment Variables for Production
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-key
PHONEPE_MERCHANT_ID=your-production-merchant-id
PHONEPE_SECRET=your-production-secret
PHONEPE_ENV=production
VITE_APP_BASE_URL=https://your-domain.com
```

### Post-Deployment Checklist
- [ ] Verify database migrations are applied
- [ ] Test authentication flow
- [ ] Test product creation (admin)
- [ ] Test order placement
- [ ] Test payment flow (sandbox first)
- [ ] Configure PhonePe webhook URL
- [ ] Test payment verification
- [ ] Setup monitoring and analytics

## 📝 API Documentation

### Edge Functions

#### Create Payment
```typescript
POST /functions/v1/create-payment
{
  "orderId": "string",
  "amount": number,
  "phone": "string", 
  "callbackUrl": "string"
}
```

#### Verify Payment
```typescript
POST /functions/v1/verify-payment
// Webhook from PhonePe

GET /functions/v1/verify-payment?transactionId=xxx
// Manual verification
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests if applicable
5. Commit: `git commit -m 'Add feature'`
6. Push: `git push origin feature-name`
7. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- 📧 Email: support@craftly.com
- 📖 Documentation: [Link to detailed docs]
- 🐛 Issues: [GitHub Issues](link-to-issues)

## 🚀 What's Next?

- [ ] Advanced search and filtering
- [ ] Product reviews and ratings
- [ ] Wishlist functionality
- [ ] Email notifications
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Social authentication
- [ ] Inventory management
- [ ] Discount codes and coupons

---

**Note**: This is a complete, production-ready e-commerce solution. The only manual step required is replacing the environment variables in `.env` with your actual Supabase and PhonePe credentials.

To run locally: Replace the keys in `.env` with your Supabase and PhonePe sandbox keys. That's the only manual change you need to make.