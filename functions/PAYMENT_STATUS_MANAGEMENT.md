# Payment Status Management System

## Overview

The Payment Status Management System provides comprehensive Firebase Cloud Functions for managing payment statuses in the curtain installation platform. It includes validation, status transitions, notifications, and audit logging.

## Features

### 🔄 **Status Management**
- 6 payment statuses: pending, processing, paid, failed, refunded, cancelled
- Valid status transition enforcement
- Automatic audit logging
- Real-time status updates

### ✅ **Validation & Security**
- Comprehensive input validation
- Status transition rules
- Payment method validation
- Date and amount validation

### 📱 **Notifications**
- FCM push notifications for status changes
- Customer and worker notifications
- Status-specific messages

### 📊 **Audit & History**
- Complete payment status history
- User tracking (who made changes)
- Timestamp logging
- Bulk operations support

## Payment Statuses

### Status Flow Diagram

```
pending → processing → paid → refunded
    ↓         ↓
  cancelled  failed → pending/processing
```

### Status Definitions

| Status | Description | Allowed Transitions |
|--------|-------------|-------------------|
| `pending` | Initial status, waiting for payment | processing, failed, cancelled |
| `processing` | Payment is being processed | paid, failed, cancelled |
| `paid` | Payment completed successfully | refunded |
| `failed` | Payment failed | pending, processing |
| `refunded` | Payment was refunded | (final status) |
| `cancelled` | Order was cancelled | (final status) |

## Cloud Functions

### `updatePaymentStatus`

**Endpoint**: `POST /updatePaymentStatus`

**Purpose**: Update payment status for a single work order

**Request Body**:
```typescript
{
  workOrderId: string;           // Required
  status: PaymentStatus;         // Required
  paidAt?: string | Date;        // Optional
  paymentMethod?: PaymentMethod; // Optional
  transactionId?: string;        // Optional
  amount?: number;               // Optional
  notes?: string;                // Optional
  updatedBy?: string;            // Optional
  refundReason?: string;         // Optional (for refunds)
  failureReason?: string;        // Optional (for failures)
}
```

**Response**:
```typescript
{
  success: boolean;
  message?: string;
  workOrderId: string;
  status: PaymentStatus;
  warnings?: string[];
  errors?: string[];
}
```

**Example Usage**:
```javascript
// Mark payment as paid
const response = await fetch('/updatePaymentStatus', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workOrderId: 'work-order-123',
    status: 'paid',
    paidAt: new Date().toISOString(),
    paymentMethod: 'card',
    transactionId: 'txn_123456',
    amount: 200000,
    notes: 'Payment processed successfully',
    updatedBy: 'admin'
  })
});

const result = await response.json();
console.log(result);
// {
//   success: true,
//   message: 'Payment status updated successfully',
//   workOrderId: 'work-order-123',
//   status: 'paid'
// }
```

### `getPaymentStatusHistory`

**Endpoint**: `GET /getPaymentStatusHistory?workOrderId={id}`

**Purpose**: Retrieve payment status history for a work order

**Query Parameters**:
- `workOrderId` (required): The work order ID

**Response**:
```typescript
{
  success: boolean;
  workOrderId: string;
  history: Array<{
    id: string;
    workOrderId: string;
    status: PaymentStatus;
    updatedBy: string;
    timestamp: Date;
    previousStatus?: string;
    customerId?: string;
    workerId?: string;
    totalFee?: number;
  }>;
}
```

**Example Usage**:
```javascript
const response = await fetch('/getPaymentStatusHistory?workOrderId=work-order-123');
const result = await response.json();

console.log(result.history);
// [
//   {
//     id: 'log-1',
//     workOrderId: 'work-order-123',
//     status: 'paid',
//     updatedBy: 'admin',
//     timestamp: '2024-01-01T10:00:00Z',
//     previousStatus: 'processing'
//   },
//   {
//     id: 'log-2',
//     workOrderId: 'work-order-123',
//     status: 'processing',
//     updatedBy: 'system',
//     timestamp: '2024-01-01T09:30:00Z',
//     previousStatus: 'pending'
//   }
// ]
```

### `bulkUpdatePaymentStatus`

**Endpoint**: `POST /bulkUpdatePaymentStatus`

**Purpose**: Update payment status for multiple work orders

**Request Body**:
```typescript
{
  updates: Array<PaymentStatusUpdate>; // Max 100 items
  updatedBy?: string;
}
```

**Response**:
```typescript
{
  success: boolean;
  message: string;
  results: Array<{
    workOrderId: string;
    success: boolean;
    status?: PaymentStatus;
    error?: string;
    errors?: string[];
  }>;
}
```

**Example Usage**:
```javascript
const response = await fetch('/bulkUpdatePaymentStatus', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    updates: [
      {
        workOrderId: 'work-order-1',
        status: 'paid',
        paymentMethod: 'card'
      },
      {
        workOrderId: 'work-order-2',
        status: 'failed',
        failureReason: 'Insufficient funds'
      }
    ],
    updatedBy: 'admin'
  })
});

const result = await response.json();
console.log(result.results);
// [
//   { workOrderId: 'work-order-1', success: true, status: 'paid' },
//   { workOrderId: 'work-order-2', success: true, status: 'failed' }
// ]
```

## Payment Methods

### Supported Payment Methods

| Method | Description |
|--------|-------------|
| `card` | Credit/Debit card payment |
| `bank_transfer` | Bank transfer |
| `cash` | Cash payment |
| `mobile_payment` | Mobile payment (KakaoPay, NaverPay, etc.) |
| `other` | Other payment methods |

## Validation Rules

### Required Fields
- `workOrderId`: Must be a non-empty string
- `status`: Must be a valid payment status

### Status Validation
- Status must be one of: `pending`, `processing`, `paid`, `failed`, `refunded`, `cancelled`
- Status transitions must follow the defined flow rules

### Payment Method Validation
- Must be one of the supported payment methods
- Required for `paid` status

### Date Validation
- `paidAt` must be a valid date string or Date object
- Future dates generate warnings but are allowed

### Amount Validation
- Must be a positive number
- Optional field

### Transaction ID Validation
- Must be a string
- Optional field

## Status-Specific Behavior

### `paid` Status
- Automatically sets `paidAt` timestamp if not provided
- Stores payment method, transaction ID, and amount
- Sends notifications to customer and worker
- Creates payment record

### `failed` Status
- Stores failure reason
- Sends notification to customer
- Allows retry (can transition back to `pending` or `processing`)

### `refunded` Status
- Stores refund reason and amount
- Sends notification to customer
- Final status (no further transitions allowed)

### `cancelled` Status
- Stores cancellation reason
- Sends notification to customer and worker
- Final status (no further transitions allowed)

## Notifications

### Notification Messages

| Status | Customer Message | Worker Message |
|--------|------------------|----------------|
| `paid` | "결제가 완료되었습니다" | "결제 완료 - 작업 시작" |
| `failed` | "결제 실패 - 재시도 필요" | - |
| `refunded` | "환불 처리 완료" | - |
| `cancelled` | "작업 주문 취소" | "작업 취소" |

### Notification Data
```typescript
{
  workOrderId: string;
  status: PaymentStatus;
  type: 'payment_status_update';
}
```

## Error Handling

### Validation Errors
```typescript
{
  success: false,
  errors: [
    'workOrderId is required',
    'Invalid status. Must be one of: pending, paid, failed, refunded, cancelled, processing'
  ]
}
```

### Status Transition Errors
```typescript
{
  success: false,
  error: 'Invalid status transition from paid to pending',
  validTransitions: ['refunded']
}
```

### Not Found Errors
```typescript
{
  success: false,
  error: 'Work order not found'
}
```

## Firestore Collections

### paymentStatusLogs Collection
```typescript
{
  id: string;
  workOrderId: string;
  status: PaymentStatus;
  updatedBy: string;
  timestamp: Timestamp;
  previousStatus?: string;
  customerId?: string;
  workerId?: string;
  totalFee?: number;
}
```

### Updated workOrders Collection
```typescript
{
  // ... existing fields
  paymentStatus: PaymentStatus;
  updatedAt: Timestamp;
  lastUpdatedBy: string;
  paymentDetails: {
    paidAt?: Timestamp;
    paymentMethod?: PaymentMethod;
    transactionId?: string;
    actualAmount?: number;
    notes?: string;
    failedAt?: Timestamp;
    failureReason?: string;
    refundedAt?: Timestamp;
    refundReason?: string;
    refundAmount?: number;
    cancelledAt?: Timestamp;
    cancellationReason?: string;
  };
}
```

## Usage Examples

### Complete Payment Flow
```javascript
// 1. Create work order (automatically sets status to 'pending')
const workOrder = await createWorkOrder({
  baseFee: 200000,
  urgentFeePercent: 15,
  platformFeePercent: 10
});

// 2. Start processing payment
await updatePaymentStatus({
  workOrderId: workOrder.id,
  status: 'processing',
  updatedBy: 'payment_gateway'
});

// 3. Complete payment
await updatePaymentStatus({
  workOrderId: workOrder.id,
  status: 'paid',
  paidAt: new Date().toISOString(),
  paymentMethod: 'card',
  transactionId: 'txn_123456',
  amount: 230000,
  updatedBy: 'payment_gateway'
});

// 4. Check payment history
const history = await getPaymentStatusHistory(workOrder.id);
console.log('Payment history:', history);
```

### Error Handling
```javascript
try {
  const result = await updatePaymentStatus({
    workOrderId: 'invalid-id',
    status: 'paid'
  });
  
  if (!result.success) {
    console.error('Payment update failed:', result.errors);
    // Handle validation errors
  }
} catch (error) {
  console.error('Network error:', error);
  // Handle network errors
}
```

### Bulk Operations
```javascript
const bulkResult = await bulkUpdatePaymentStatus({
  updates: [
    { workOrderId: 'order-1', status: 'paid' },
    { workOrderId: 'order-2', status: 'failed', failureReason: 'Timeout' },
    { workOrderId: 'order-3', status: 'cancelled', notes: 'Customer request' }
  ],
  updatedBy: 'admin'
});

// Check individual results
bulkResult.results.forEach(result => {
  if (!result.success) {
    console.error(`Failed to update ${result.workOrderId}:`, result.error);
  }
});
```

## Testing

### Unit Tests
```bash
npm test -- --testNamePattern="Payment Status Management"
```

### Manual Testing
```javascript
// Test validation
const validation = validatePaymentStatusUpdate({
  workOrderId: 'test-123',
  status: 'paid',
  paymentMethod: 'card'
});

console.log('Validation result:', validation);

// Test status transitions
const transitions = getValidStatusTransitions('pending');
console.log('Valid transitions from pending:', transitions);
```

## Deployment

### Deploy All Functions
```bash
firebase deploy --only functions
```

### Deploy Specific Function
```bash
firebase deploy --only functions:updatePaymentStatus
```

### Environment Configuration
```bash
# Set notification settings
firebase functions:config:set \
  notifications.enabled=true \
  notifications.customer_enabled=true \
  notifications.worker_enabled=true
```

## Monitoring

### Key Metrics
- Function execution time
- Error rates by status
- Notification delivery rates
- Bulk operation success rates

### Log Examples
```javascript
// Successful update
console.log(`Payment status updated: ${workOrderId} → ${status}`);

// Validation error
console.error(`Validation failed for ${workOrderId}:`, errors);

// Status transition error
console.error(`Invalid transition: ${currentStatus} → ${newStatus}`);
```

## Security Considerations

### Input Validation
- All inputs are validated before processing
- SQL injection protection through Firestore
- XSS protection through proper escaping

### Access Control
- Functions can be secured with Firebase Auth
- User roles can be checked in function logic
- Audit trail tracks who made changes

### Rate Limiting
- Bulk operations limited to 100 items
- Consider implementing additional rate limiting

## Future Enhancements

### Planned Features
1. **Webhook Support**: Notify external systems of status changes
2. **Payment Gateway Integration**: Direct integration with payment providers
3. **Advanced Analytics**: Payment success rates, timing analysis
4. **Automated Refunds**: Automatic refund processing
5. **Multi-currency Support**: Handle different currencies

### Extension Points
```javascript
// Custom notification handlers
function customNotificationHandler(status, workOrderData) {
  // Implement custom notification logic
}

// Custom validation rules
function customValidationRules(updateData) {
  // Implement custom business rules
}
```

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Author**: Curtain Installation Platform Team 