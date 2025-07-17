import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Payment status types
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled' | 'processing';

// Payment method types
export type PaymentMethod = 'card' | 'bank_transfer' | 'cash' | 'mobile_payment' | 'other';

// Enhanced payment status update interface
interface PaymentStatusUpdate {
  workOrderId: string;
  status: PaymentStatus;
  paidAt?: string | Date;
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  amount?: number;
  notes?: string;
  updatedBy?: string;
  refundReason?: string;
  failureReason?: string;
}

// Payment record interface
interface PaymentRecord {
  workOrderId: string;
  workerId?: string;
  customerId?: string;
  paymentInfo: any;
  calculatedAt: admin.firestore.Timestamp;
  status: PaymentStatus;
  paidAt?: admin.firestore.Timestamp;
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  amount?: number;
  notes?: string;
  updatedBy?: string;
  refundReason?: string;
  failureReason?: string;
  updatedAt: admin.firestore.Timestamp;
}

// Validation function
export function validatePaymentStatusUpdate(data: any): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!data.workOrderId) {
    errors.push('workOrderId is required');
  }

  if (!data.status) {
    errors.push('status is required');
  }

  // Status validation
  const validStatuses: PaymentStatus[] = ['pending', 'paid', 'failed', 'refunded', 'cancelled', 'processing'];
  if (data.status && !validStatuses.includes(data.status)) {
    errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  // Payment method validation
  if (data.paymentMethod) {
    const validMethods: PaymentMethod[] = ['card', 'bank_transfer', 'cash', 'mobile_payment', 'other'];
    if (!validMethods.includes(data.paymentMethod)) {
      errors.push(`Invalid payment method. Must be one of: ${validMethods.join(', ')}`);
    }
  }

  // Date validation
  if (data.paidAt) {
    const paidDate = new Date(data.paidAt);
    if (isNaN(paidDate.getTime())) {
      errors.push('paidAt must be a valid date');
    } else if (paidDate > new Date()) {
      warnings.push('paidAt is in the future');
    }
  }

  // Amount validation
  if (data.amount !== undefined) {
    if (typeof data.amount !== 'number' || data.amount < 0) {
      errors.push('amount must be a positive number');
    }
  }

  // Transaction ID validation
  if (data.transactionId && typeof data.transactionId !== 'string') {
    errors.push('transactionId must be a string');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Main payment status update function
export const updatePaymentStatus = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed. Use POST.');
    return;
  }

  try {
    const updateData: PaymentStatusUpdate = req.body;

    // Validate input
    const validation = validatePaymentStatusUpdate(updateData);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        errors: validation.errors,
        warnings: validation.warnings
      });
      return;
    }

    const { workOrderId, status, paidAt, paymentMethod, transactionId, amount, notes, updatedBy, refundReason, failureReason } = updateData;

    console.log(`Updating payment status for work order: ${workOrderId} to ${status}`);

    // Check if work order exists
    const workOrderRef = db.collection("workOrders").doc(workOrderId);
    const workOrderDoc = await workOrderRef.get();

    if (!workOrderDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'Work order not found'
      });
      return;
    }

    const workOrderData = workOrderDoc.data();
    const currentPaymentStatus = workOrderData?.['paymentStatus'];

    // Validate status transition
    const validTransitions = getValidStatusTransitions(currentPaymentStatus);
    if (!validTransitions.includes(status)) {
      res.status(400).json({
        success: false,
        error: `Invalid status transition from ${currentPaymentStatus} to ${status}`,
        validTransitions
      });
      return;
    }

    // Prepare update data
    const updatePayload: any = {
      paymentStatus: status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdatedBy: updatedBy || 'system'
    };

    // Add status-specific fields
    if (status === 'paid') {
      updatePayload['paymentDetails.paidAt'] = paidAt ? admin.firestore.Timestamp.fromDate(new Date(paidAt)) : admin.firestore.FieldValue.serverTimestamp();
      if (paymentMethod) updatePayload['paymentDetails.paymentMethod'] = paymentMethod;
      if (transactionId) updatePayload['paymentDetails.transactionId'] = transactionId;
      if (amount) updatePayload['paymentDetails.actualAmount'] = amount;
      if (notes) updatePayload['paymentDetails.notes'] = notes;
    }

    if (status === 'failed') {
      updatePayload['paymentDetails.failedAt'] = admin.firestore.FieldValue.serverTimestamp();
      if (failureReason) updatePayload['paymentDetails.failureReason'] = failureReason;
    }

    if (status === 'refunded') {
      updatePayload['paymentDetails.refundedAt'] = admin.firestore.FieldValue.serverTimestamp();
      if (refundReason) updatePayload['paymentDetails.refundReason'] = refundReason;
      if (amount) updatePayload['paymentDetails.refundAmount'] = amount;
    }

    if (status === 'cancelled') {
      updatePayload['paymentDetails.cancelledAt'] = admin.firestore.FieldValue.serverTimestamp();
      if (notes) updatePayload['paymentDetails.cancellationReason'] = notes;
    }

    // Update work order
    await workOrderRef.update(updatePayload);

    // Update payment record
    const paymentRecordRef = db.collection('paymentRecords').doc(workOrderId);
    const paymentRecordDoc = await paymentRecordRef.get();

    if (paymentRecordDoc.exists) {
      const paymentRecordUpdate: Partial<PaymentRecord> = {
        status,
        updatedAt: admin.firestore.Timestamp.now()
      };

      if (status === 'paid') {
        paymentRecordUpdate.paidAt = paidAt ? admin.firestore.Timestamp.fromDate(new Date(paidAt)) : admin.firestore.Timestamp.now();
        if (paymentMethod) paymentRecordUpdate.paymentMethod = paymentMethod;
        if (transactionId) paymentRecordUpdate.transactionId = transactionId;
        if (amount) paymentRecordUpdate.amount = amount;
        if (notes) paymentRecordUpdate.notes = notes;
      }

      if (status === 'failed' && failureReason) {
        paymentRecordUpdate.failureReason = failureReason;
      }

      if (status === 'refunded') {
        if (refundReason) paymentRecordUpdate.refundReason = refundReason;
        if (amount) paymentRecordUpdate.amount = amount;
      }

      await paymentRecordRef.update(paymentRecordUpdate);
    }

    // Send notifications based on status
    await sendStatusNotification(workOrderData, status, workOrderId);

    // Log the update
    await logPaymentStatusUpdate(workOrderId, status, updatedBy || 'system', workOrderData);

    console.log(`Payment status updated successfully for work order: ${workOrderId}`);

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      workOrderId,
      status,
      warnings: validation.warnings
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get valid status transitions
export function getValidStatusTransitions(currentStatus: string): PaymentStatus[] {
  const transitions: Record<string, PaymentStatus[]> = {
    'pending': ['paid', 'failed', 'cancelled', 'processing'],
    'processing': ['paid', 'failed', 'cancelled'],
    'paid': ['refunded'],
    'failed': ['pending', 'processing'],
    'refunded': [],
    'cancelled': []
  };

  return transitions[currentStatus] || ['pending'];
}

// Send notifications based on status
async function sendStatusNotification(workOrderData: any, status: PaymentStatus, workOrderId: string) {
  try {
    const customerId = workOrderData.customerId;
    const workerId = workOrderData.workerId;

    // Notification messages based on status
    const notificationMessages: Record<string, { title: string; body: string }> = {
      paid: {
        title: '결제가 완료되었습니다',
        body: '작업 주문 결제가 성공적으로 처리되었습니다.'
      },
      failed: {
        title: '결제 실패',
        body: '결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.'
      },
      refunded: {
        title: '환불 처리 완료',
        body: '환불이 성공적으로 처리되었습니다.'
      },
      cancelled: {
        title: '작업 주문 취소',
        body: '작업 주문이 취소되었습니다.'
      }
    };

    const message = notificationMessages[status];
    if (!message) return;

    // Send notification to customer
    if (customerId) {
      await sendNotificationToUser(customerId, message.title, message.body, {
        workOrderId,
        status,
        type: 'payment_status_update'
      });
    }

    // Send notification to worker for certain statuses
    if (workerId && ['paid', 'cancelled'].includes(status)) {
      const workerMessage = status === 'paid' 
        ? { title: '결제 완료', body: '고객의 결제가 완료되었습니다. 작업을 시작해주세요.' }
        : { title: '작업 취소', body: '작업 주문이 취소되었습니다.' };

      await sendNotificationToUser(workerId, workerMessage.title, workerMessage.body, {
        workOrderId,
        status,
        type: 'payment_status_update'
      });
    }

  } catch (error) {
    console.warn('Failed to send status notification:', error);
  }
}

// Send notification to user
async function sendNotificationToUser(userId: string, title: string, body: string, data: any) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return;

    const userData = userDoc.data();
    const fcmToken = userData?.['fcmToken'];

    if (!fcmToken) {
      console.log(`No FCM token found for user: ${userId}`);
      return;
    }

    const message = {
      token: fcmToken,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, String(value)])
      )
    };

    const response = await admin.messaging().send(message);
    console.log(`Status notification sent to user ${userId}:`, response);

  } catch (error) {
    console.error('Error sending notification to user:', error);
  }
}

// Log payment status update
async function logPaymentStatusUpdate(workOrderId: string, status: PaymentStatus, updatedBy: string, workOrderData: any) {
  try {
    const logEntry = {
      workOrderId,
      status,
      updatedBy: updatedBy || 'system',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      previousStatus: workOrderData?.['paymentStatus'],
      customerId: workOrderData?.['customerId'],
      workerId: workOrderData?.['workerId'],
      totalFee: workOrderData?.['paymentDetails']?.['totalFee']
    };

    await db.collection('paymentStatusLogs').add(logEntry);
    console.log(`Payment status update logged for work order: ${workOrderId}`);

  } catch (error) {
    console.warn('Failed to log payment status update:', error);
  }
}

// Get payment status history
export const getPaymentStatusHistory = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).send('Method not allowed. Use GET.');
    return;
  }

  try {
    const { workOrderId } = req.query;

    if (!workOrderId || typeof workOrderId !== 'string') {
      res.status(400).json({
        success: false,
        error: 'workOrderId is required'
      });
      return;
    }

    const logsSnapshot = await db.collection('paymentStatusLogs')
      .where('workOrderId', '==', workOrderId)
      .orderBy('timestamp', 'desc')
      .get();

    const history = logsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json({
      success: true,
      workOrderId,
      history
    });

  } catch (error) {
    console.error('Error fetching payment status history:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Bulk payment status update
export const bulkUpdatePaymentStatus = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed. Use POST.');
    return;
  }

  try {
    const { updates, updatedBy } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      res.status(400).json({
        success: false,
        error: 'updates array is required and must not be empty'
      });
      return;
    }

    if (updates.length > 100) {
      res.status(400).json({
        success: false,
        error: 'Maximum 100 updates allowed per request'
      });
      return;
    }

    const results = [];
    const batch = db.batch();

    for (const update of updates) {
      const validation = validatePaymentStatusUpdate(update);
      
      if (!validation.isValid) {
        results.push({
          workOrderId: update.workOrderId,
          success: false,
          errors: validation.errors
        });
        continue;
      }

      try {
        const workOrderRef = db.collection("workOrders").doc(update.workOrderId);
        const workOrderDoc = await workOrderRef.get();

        if (!workOrderDoc.exists) {
          results.push({
            workOrderId: update.workOrderId,
            success: false,
            error: 'Work order not found'
          });
          continue;
        }

        const workOrderData = workOrderDoc.data();
        const currentStatus = workOrderData?.['paymentStatus'];
        const validTransitions = getValidStatusTransitions(currentStatus);

        if (!validTransitions.includes(update.status)) {
          results.push({
            workOrderId: update.workOrderId,
            success: false,
            error: `Invalid status transition from ${currentStatus} to ${update.status}`
          });
          continue;
        }

        // Prepare update payload
        const updatePayload: any = {
          paymentStatus: update.status,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastUpdatedBy: updatedBy || 'system'
        };

        if (update.status === 'paid') {
          updatePayload['paymentDetails.paidAt'] = update.paidAt 
            ? admin.firestore.Timestamp.fromDate(new Date(update.paidAt)) 
            : admin.firestore.FieldValue.serverTimestamp();
          if (update.paymentMethod) updatePayload['paymentDetails.paymentMethod'] = update.paymentMethod;
          if (update.transactionId) updatePayload['paymentDetails.transactionId'] = update.transactionId;
        }

        batch.update(workOrderRef, updatePayload);

        results.push({
          workOrderId: update.workOrderId,
          success: true,
          status: update.status
        });

      } catch (error) {
        results.push({
          workOrderId: update.workOrderId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Commit batch if there are valid updates
    const validUpdates = results.filter(r => r.success);
    if (validUpdates.length > 0) {
      await batch.commit();
    }

    res.status(200).json({
      success: true,
      message: `Processed ${updates.length} updates`,
      results
    });

  } catch (error) {
    console.error('Error in bulk payment status update:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}); 