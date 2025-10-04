# Payment Flow Documentation

## Overview
This document explains the complete payment processing flow using PhonePe integration in the Craftly e-commerce platform.

## Architecture

```
Frontend → Create Payment → PhonePe → Webhook → Verify Payment → Update Order
```

## Detailed Flow

### 1. Order Creation
- User adds items to cart
- Proceeds to checkout
- Fills shipping information
- Clicks "Pay Now"

### 2. Payment Initiation
**Frontend (React):**
```typescript
const paymentData = {
  orderId: order.id,
  amount: totalAmount,
  phone: userPhone,
  callbackUrl: window.location.origin
}

const response = await createPayment(paymentData)
```

**Edge Function (`create-payment`):**
- Receives payment request
- Generates unique transaction ID
- Creates PhonePe payload with required fields
- Signs the payload with merchant secret
- Stores payment record in database with status 'pending'
- Returns payment URL for redirection

### 3. PhonePe Processing
- User is redirected to PhonePe payment page
- User completes payment using preferred method (UPI, Card, etc.)
- PhonePe processes the transaction

### 4. Webhook Verification
**PhonePe → Edge Function (`verify-payment`):**
- PhonePe sends POST webhook with transaction details
- Edge function verifies webhook signature
- Updates payment status in database
- Updates order status based on payment result

### 5. User Redirection
- User is redirected back to success/failure page
- Frontend displays appropriate message
- Order status is reflected in user account

## Database Changes

### Payment States
- `pending` - Payment initiated
- `success` - Payment completed successfully  
- `failed` - Payment failed

### Order States
- `pending` - Order created, payment pending
- `paid` - Payment confirmed
- `shipped` - Order dispatched
- `delivered` - Order completed
- `cancelled` - Order cancelled

## Security Considerations

### Signature Verification
```typescript
// Create signature for outgoing requests
const payload = base64encode(paymentData)
const stringToHash = payload + apiEndpoint + saltKey
const signature = sha256(stringToHash) + "###" + saltIndex

// Verify incoming webhook signatures
const receivedSignature = request.headers["X-VERIFY"]
const computedSignature = sha256(webhookBody + saltKey)
if (receivedSignature !== computedSignature) {
  throw new Error("Invalid signature")
}
```

### Data Protection
- Service role key used only in Edge Functions
- Sensitive data never exposed to client
- All database operations protected by RLS policies

## Error Handling

### Payment Creation Errors
- Invalid order ID
- Insufficient product stock
- Network failures
- Invalid payment amount

### Verification Errors
- Invalid webhook signature
- Payment not found
- Database update failures
- Network timeouts

## Testing

### Sandbox Environment
```env
PHONEPE_ENV=sandbox
PHONEPE_MERCHANT_ID=PGTESTPAYUAT
PHONEPE_SECRET=test-secret-key
```

### Test Scenarios
1. **Successful Payment**
   - Use test phone: 9999999999
   - Complete payment flow
   - Verify order status changes to 'paid'

2. **Failed Payment**
   - Cancel payment on PhonePe page
   - Verify order remains 'pending'
   - Verify payment status is 'failed'

3. **Webhook Verification**
   - Test manual verification endpoint
   - Test webhook signature validation
   - Test duplicate webhook handling

### Production Testing
```bash
# Test payment creation
curl -X POST \
  https://your-app.supabase.co/functions/v1/create-payment \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test-order-123",
    "amount": 1000,
    "phone": "9999999999",
    "callbackUrl": "https://your-domain.com"
  }'

# Test payment verification
curl -X GET \
  "https://your-app.supabase.co/functions/v1/verify-payment?transactionId=test-txn-123"
```

## Monitoring & Analytics

### Key Metrics
- Payment success rate
- Average payment processing time
- Failed payment reasons
- Revenue by payment method

### Logging
- All payment events are logged
- Webhook delivery status
- Error rates and patterns
- Performance metrics

## Troubleshooting

### Common Issues

1. **Payment Creation Fails**
   ```
   Error: "Payment creation failed"
   Solution: Check PhonePe credentials and network connectivity
   ```

2. **Webhook Not Received**
   ```
   Issue: Order status not updating after payment
   Solution: Verify webhook URL configuration in PhonePe dashboard
   ```

3. **Signature Mismatch**
   ```
   Error: "Invalid signature"
   Solution: Verify salt key and signature generation logic
   ```

4. **Database Update Failures**
   ```
   Error: "Failed to update order status"
   Solution: Check RLS policies and service role permissions
   ```

### Debug Mode
Enable debug logging in Edge Functions:
```typescript
const debug = Deno.env.get("DEBUG") === "true"
if (debug) {
  console.log("Payment payload:", payload)
  console.log("Generated signature:", signature)
}
```

## Performance Optimization

### Caching
- Cache PhonePe API responses where appropriate
- Implement request deduplication
- Use connection pooling for database

### Async Processing
- Use background tasks for non-critical updates
- Implement retry logic for failed webhooks
- Queue email notifications

## Compliance

### PCI DSS
- No card data stored in application
- All payments processed through PhonePe
- Secure token handling

### Data Protection
- User payment data encrypted
- Audit logs maintained
- Regular security reviews

---

This payment system provides a robust, secure, and scalable solution for processing payments in the Craftly e-commerce platform.