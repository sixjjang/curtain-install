# Work Order Payment Cloud Functions

## Overview

This module provides comprehensive Firebase Cloud Functions for automatic payment calculation and management in the curtain installation platform. The functions handle work order creation, payment calculation, dynamic urgent fees, grade-based discounts, and notifications.

## Features

### 🔢 **Automatic Payment Calculation**
- Real-time payment calculation on work order creation/update
- Support for base fees, urgent fees, platform fees, discounts, and taxes
- Dynamic urgent fee calculation based on time elapsed
- Grade-based fee adjustments for workers

### ⏰ **Dynamic Urgent Fee System**
- Automatic urgent fee increases over time
- Configurable increase intervals and amounts
- Maximum fee limits to prevent excessive charges
- Time-based calculation from work order creation

### 🏆 **Worker Grade System**
- 5-tier grade system (Bronze to Diamond)
- Automatic fee discounts based on worker grade
- Grade-based platform fee adjustments
- Worker incentive system

### ✅ **Validation & Error Handling**
- Comprehensive input validation
- Business rule enforcement
- Error logging and status updates
- Warning system for high fees

### 📱 **Notification System**
- FCM push notifications to workers
- Payment information in notifications
- Real-time updates on work order assignment

## File Structure

```
functions/src/
├── index.ts                    # Main exports
├── workOrderPayment.ts         # Core payment functions
└── workOrderPayment.test.ts    # Test suite

functions/
├── WORK_ORDER_PAYMENT_FUNCTIONS.md  # This documentation
└── package.json               # Dependencies
```

## Cloud Functions

### `onWorkOrderCreate`

**Trigger**: Firestore document creation in `workOrders/{workOrderId}`

**Purpose**: Automatically calculates payment when a new work order is created

**Features**:
- Validates work order data
- Calculates dynamic urgent fees
- Applies worker grade discounts
- Creates payment records
- Sends notifications to assigned workers

**Example Usage**:
```javascript
// Create a new work order
const workOrder = {
  baseFee: 200000,
  urgentFeePercent: 15,
  platformFeePercent: 10,
  discountPercent: 5,
  taxPercent: 10,
  customerId: 'customer123',
  workerId: 'worker456',
  description: 'Living room curtain installation',
  location: 'Seoul, Gangnam-gu',
  priority: 'urgent'
};

// Function automatically triggers and calculates:
// - Base fee: 200,000원
// - Discount: 10,000원 (5%)
// - Urgent fee: 28,500원 (15% of discounted amount)
// - Total fee: 218,500원
// - Platform fee: 21,850원 (10%)
// - Worker payment: 196,650원
// - Tax: 21,850원 (10%)
// - Customer total: 240,350원
```

### `onWorkOrderUpdate`

**Trigger**: Firestore document updates in `workOrders/{workOrderId}`

**Purpose**: Recalculates payment when payment-related fields are modified

**Features**:
- Detects payment-related changes
- Recalculates with updated values
- Updates payment records
- Maintains audit trail

**Monitored Fields**:
- `baseFee`
- `urgentFeePercent`
- `platformFeePercent`
- `discountPercent`
- `taxPercent`
- `workerId`

## Data Models

### WorkOrder Interface

```typescript
interface WorkOrder {
  id?: string;
  baseFee: number;                    // 기본 시공비
  urgentFeePercent: number;           // 긴급 수수료 비율 (%)
  platformFeePercent: number;         // 플랫폼 수수료 비율 (%)
  currentUrgentFeePercent?: number;   // 현재 긴급 수수료 비율
  discountPercent?: number;           // 할인 비율 (%)
  taxPercent?: number;                // 세금 비율 (%)
  createdAt?: admin.firestore.Timestamp | Date;
  status?: string;                    // 작업 상태
  customerId?: string;                // 고객 ID
  workerId?: string;                  // 작업자 ID
  description?: string;               // 작업 설명
  location?: string;                  // 작업 위치
  priority?: 'normal' | 'urgent' | 'emergency';
}
```

### PaymentInfo Interface

```typescript
interface PaymentInfo {
  // Basic information
  baseFee: number;
  discountedBaseFee: number;
  discountAmount: number;
  discountPercent: number;
  
  // Urgent fee
  urgentFee: number;
  urgentFeePercent: number;
  
  // Total amounts
  totalFee: number;
  customerTotalPayment: number;
  
  // Fees
  platformFee: number;
  platformFeePercent: number;
  taxAmount: number;
  taxPercent: number;
  
  // Worker payment
  workerPayment: number;
  
  // Grade information (if applicable)
  gradeInfo?: {
    level: number;
    name: string;
    multiplier: number;
  };
  
  // Calculation breakdown
  breakdown: {
    baseFee: number;
    discount: { percent: number; amount: number; };
    urgentFee: { percent: number; amount: number; };
    platformFee: { percent: number; amount: number; };
    tax: { percent: number; amount: number; };
  };
}
```

## Worker Grade System

### Grade Levels and Benefits

| Grade | Level | Fee Multiplier | Discount | Benefits |
|-------|-------|----------------|----------|----------|
| Bronze | 1 | 1.0 | 0% | Basic service |
| Silver | 2 | 0.9 | 10% | Priority matching |
| Gold | 3 | 0.8 | 20% | Premium matching |
| Platinum | 4 | 0.7 | 30% | VIP matching |
| Diamond | 5 | 0.6 | 40% | All benefits |

### Example Grade Calculation

```javascript
// Base work order
const workOrder = {
  baseFee: 300000,
  urgentFeePercent: 0,
  platformFeePercent: 20
};

// Bronze worker (no discount)
const bronzePayment = calculateGradeBasedFees(workOrder, { level: 1, name: 'Bronze' });
// Platform fee: 60,000원 (20% of 300,000)
// Worker payment: 240,000원

// Diamond worker (40% discount)
const diamondPayment = calculateGradeBasedFees(workOrder, { level: 5, name: 'Diamond' });
// Platform fee: 36,000원 (60,000 * 0.6)
// Worker payment: 264,000원 (24,000원 more!)
```

## Dynamic Urgent Fee System

### Calculation Rules

- **Base Rule**: Starts with configured urgent fee percentage
- **Increase Interval**: Every 1 hour (configurable)
- **Increase Amount**: 5% per interval (configurable)
- **Maximum Limit**: 50% (configurable)

### Example Timeline

```javascript
// Work order created with 10% urgent fee
const workOrder = {
  baseFee: 200000,
  urgentFeePercent: 10,
  createdAt: new Date('2024-01-01T10:00:00Z')
};

// Time progression:
// 0 hours: 10%
// 1 hour: 15%
// 2 hours: 20%
// 3 hours: 25%
// ...
// 8 hours: 50% (maximum)
// 9+ hours: 50% (maintained)
```

### Custom Configuration

```javascript
const dynamicFee = calculateDynamicUrgentFee(
  workOrder,
  hoursSinceCreation,
  60,    // Max 60%
  2,     // Every 2 hours
  10     // 10% increase
);
```

## Validation Rules

### Required Validations

1. **Base Fee**: Must be greater than 0
2. **Urgent Fee**: Must be between 0-100%
3. **Platform Fee**: Must be between 0-50%

### Warning Conditions

1. **High Urgent Fee**: Above 30% (customer confirmation recommended)
2. **High Platform Fee**: Above 20% (business review recommended)

### Example Validation

```javascript
const workOrder = {
  baseFee: 100000,
  urgentFeePercent: 40,
  platformFeePercent: 25
};

const validation = validateWorkOrder(workOrder);
// Result:
// {
//   isValid: true,
//   errors: [],
//   warnings: [
//     'Urgent fee is above 30%. Customer confirmation may be required.',
//     'Platform fee is above 20%.'
//   ]
// }
```

## Firestore Collections

### workOrders Collection

```javascript
// Document structure after function execution
{
  id: 'work-order-123',
  baseFee: 200000,
  urgentFeePercent: 15,
  platformFeePercent: 10,
  discountPercent: 5,
  taxPercent: 10,
  customerId: 'customer123',
  workerId: 'worker456',
  status: 'pending',
  
  // Calculated by function
  paymentDetails: {
    urgentFee: 28500,
    totalFee: 218500,
    platformFee: 21850,
    workerPayment: 196650,
    customerTotalPayment: 240350,
    taxAmount: 21850,
    discountAmount: 10000,
    breakdown: { ... },
    gradeInfo: { level: 3, name: 'Gold', multiplier: 0.8 }
  },
  paymentStatus: 'pending',
  calculatedAt: Timestamp,
  validationWarnings: [...],
  dynamicUrgentFeePercent: 25
}
```

### paymentRecords Collection

```javascript
// Separate collection for payment tracking
{
  workOrderId: 'work-order-123',
  workerId: 'worker456',
  customerId: 'customer123',
  paymentInfo: { ... }, // Full payment calculation
  calculatedAt: Timestamp,
  status: 'calculated',
  paidAt: null,
  paymentMethod: null,
  transactionId: null
}
```

## Notification System

### FCM Notifications

When a work order is assigned to a worker, the function automatically sends a push notification with:

- **Title**: "새로운 작업 주문이 할당되었습니다"
- **Body**: Payment information (total fee, worker payment)
- **Data**: Work order ID, payment amounts, notification type

### Notification Example

```javascript
// Notification payload
{
  token: 'worker-fcm-token',
  notification: {
    title: '새로운 작업 주문이 할당되었습니다',
    body: '총 시공비: 218,500원, 작업자 지급액: 196,650원'
  },
  data: {
    workOrderId: 'work-order-123',
    totalFee: '218500',
    workerPayment: '196650',
    type: 'work_order_assigned'
  }
}
```

## Error Handling

### Validation Errors

```javascript
// Invalid work order
const invalidWorkOrder = {
  baseFee: 0,  // Invalid
  urgentFeePercent: 150,  // Invalid
  platformFeePercent: 60  // Invalid
};

// Function will:
// 1. Detect validation errors
// 2. Update work order status to 'invalid'
// 3. Store error messages
// 4. Skip payment calculation
```

### Processing Errors

```javascript
// Function error handling
try {
  // Payment calculation logic
} catch (error) {
  console.error('Error processing work order payment:', error);
  
  // Update work order with error status
  await snap.ref.update({
    status: 'error',
    errorMessage: error.message,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}
```

## Testing

### Running Tests

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run specific test
npm test -- --testNamePattern="calculatePayment"
```

### Test Coverage

The test suite covers:
- ✅ Basic payment calculation
- ✅ Dynamic urgent fee calculation
- ✅ Grade-based fee adjustments
- ✅ Input validation
- ✅ Edge cases
- ✅ Integration scenarios

### Manual Testing

```javascript
// Import test functions
import { testFunctions } from './workOrderPayment.test';

// Test basic calculation
const workOrder = {
  baseFee: 100000,
  urgentFeePercent: 10,
  platformFeePercent: 15
};

const payment = testFunctions.calculatePayment(workOrder);
console.log('Payment:', payment);
```

## Deployment

### Prerequisites

1. Firebase project setup
2. Firestore database configured
3. FCM setup for notifications
4. Worker grade system in place

### Deployment Steps

```bash
# Install dependencies
cd functions
npm install

# Build TypeScript
npm run build

# Deploy functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:onWorkOrderCreate
```

### Environment Configuration

```bash
# Set environment variables
firebase functions:config:set \
  payment.max_urgent_fee_percent=50 \
  payment.increase_interval=1 \
  payment.increase_amount=5

# View current config
firebase functions:config:get
```

## Monitoring & Logging

### Cloud Function Logs

```bash
# View function logs
firebase functions:log --only onWorkOrderCreate

# View recent logs
firebase functions:log --limit 50
```

### Key Metrics to Monitor

1. **Function Execution Time**: Should be under 10 seconds
2. **Error Rate**: Should be under 1%
3. **Payment Calculation Accuracy**: 100% expected
4. **Notification Delivery Rate**: Should be above 95%

### Log Examples

```javascript
// Successful execution
console.log(`Processing work order: ${workOrderId}`);
console.log(`Dynamic urgent fee calculated: ${dynamicUrgentFee}%`);
console.log(`Payment calculation completed for work order: ${workOrderId}`);
console.log(`Total fee: ${paymentInfo.totalFee.toLocaleString()} KRW`);

// Error logging
console.error('Error processing work order payment:', error);
console.warn('Failed to fetch worker grade:', error);
```

## Performance Optimization

### Best Practices

1. **Efficient Queries**: Use specific field selection
2. **Batch Operations**: Group related updates
3. **Error Handling**: Graceful degradation
4. **Caching**: Cache worker grade information
5. **Monitoring**: Track function performance

### Optimization Tips

```javascript
// Efficient worker grade lookup
const workerDoc = await db.collection('workers')
  .doc(workerId)
  .select('grade', 'fcmToken')
  .get();

// Batch updates
const batch = db.batch();
batch.update(workOrderRef, paymentData);
batch.set(paymentRecordRef, paymentRecord);
await batch.commit();
```

## Troubleshooting

### Common Issues

1. **Function Not Triggering**
   - Check Firestore rules
   - Verify collection name
   - Check function deployment status

2. **Payment Calculation Errors**
   - Validate input data
   - Check for null/undefined values
   - Verify calculation logic

3. **Notification Failures**
   - Check FCM token validity
   - Verify notification permissions
   - Check FCM configuration

### Debug Commands

```bash
# Check function status
firebase functions:list

# View function details
firebase functions:describe onWorkOrderCreate

# Test function locally
firebase emulators:start --only functions
```

## Future Enhancements

### Planned Features

1. **Multi-currency Support**: USD, EUR, JPY
2. **Advanced Discount Rules**: Seasonal, bulk, loyalty
3. **Payment Gateway Integration**: Stripe, PayPal
4. **Analytics Dashboard**: Payment trends, worker performance
5. **Automated Refunds**: Failed work order handling

### Extension Points

```javascript
// Custom fee calculation
function calculateCustomFees(workOrder, customRules) {
  // Implement custom business logic
}

// External payment provider
async function processPayment(paymentInfo, provider) {
  // Integrate with payment gateway
}
```

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Author**: Curtain Installation Platform Team 