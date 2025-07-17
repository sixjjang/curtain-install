import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Enhanced interfaces
interface WorkOrder {
  id?: string;
  baseFee: number;
  urgentFeePercent: number;
  platformFeePercent: number;
  currentUrgentFeePercent?: number;
  discountPercent?: number;
  taxPercent?: number;
  createdAt?: admin.firestore.Timestamp | Date;
  status?: string;
  customerId?: string;
  workerId?: string;
  description?: string;
  location?: string;
  priority?: 'normal' | 'urgent' | 'emergency';
}

interface WorkerGrade {
  level: number; // 1-5 (Bronze to Diamond)
  name: string;
  description?: string;
}

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
    discount: {
      percent: number;
      amount: number;
    };
    urgentFee: {
      percent: number;
      amount: number;
    };
    platformFee: {
      percent: number;
      amount: number;
    };
    tax: {
      percent: number;
      amount: number;
    };
  };
}

interface PaymentRecord {
  workOrderId: string;
  workerId?: string;
  customerId?: string;
  paymentInfo: PaymentInfo;
  calculatedAt: admin.firestore.Timestamp;
  status: 'calculated' | 'pending' | 'paid' | 'failed' | 'refunded';
  paidAt?: admin.firestore.Timestamp;
  paymentMethod?: string;
  transactionId?: string;
}

// Payment calculation functions
function calculatePayment(workOrder: WorkOrder): PaymentInfo {
  const {
    baseFee = 0,
    urgentFeePercent = 0,
    platformFeePercent = 0,
    currentUrgentFeePercent,
    discountPercent = 0,
    taxPercent = 0
  } = workOrder;

  // Calculate discount first
  const discountAmount = baseFee * (discountPercent / 100);
  const discountedBaseFee = baseFee - discountAmount;
  
  // Use current urgent fee if provided, otherwise use base urgent fee
  const actualUrgentFeePercent = currentUrgentFeePercent || urgentFeePercent;
  const urgentFee = discountedBaseFee * (actualUrgentFeePercent / 100);
  
  // Calculate total fee (discounted base + urgent fee)
  const totalFee = discountedBaseFee + urgentFee;
  
  // Calculate platform fee
  const platformFee = totalFee * (platformFeePercent / 100);
  
  // Calculate tax
  const taxAmount = totalFee * (taxPercent / 100);
  
  // Calculate worker payment (total fee - platform fee)
  const workerPayment = totalFee - platformFee;
  
  // Calculate customer total payment (total fee + tax)
  const customerTotalPayment = totalFee + taxAmount;

  return {
    // Basic information
    baseFee,
    discountedBaseFee,
    discountAmount,
    discountPercent,
    
    // Urgent fee
    urgentFee,
    urgentFeePercent: actualUrgentFeePercent,
    
    // Total amounts
    totalFee,
    customerTotalPayment,
    
    // Fees
    platformFee,
    platformFeePercent,
    taxAmount,
    taxPercent,
    
    // Worker payment
    workerPayment,
    
    // Calculation breakdown
    breakdown: {
      baseFee,
      discount: {
        percent: discountPercent,
        amount: discountAmount
      },
      urgentFee: {
        percent: actualUrgentFeePercent,
        amount: urgentFee
      },
      platformFee: {
        percent: platformFeePercent,
        amount: platformFee
      },
      tax: {
        percent: taxPercent,
        amount: taxAmount
      }
    }
  };
}

function calculateDynamicUrgentFee(
  workOrder: WorkOrder,
  hoursSinceCreation: number,
  maxUrgentFeePercent: number = 50,
  increaseInterval: number = 1,
  increaseAmount: number = 5
): number {
  const baseUrgentFeePercent = workOrder.urgentFeePercent || 0;
  
  if (hoursSinceCreation <= 0) {
    return baseUrgentFeePercent;
  }

  // Calculate increase count
  const increaseCount = Math.floor(hoursSinceCreation / increaseInterval);
  const calculatedIncrease = increaseCount * increaseAmount;
  
  // Limit to maximum percentage
  const newUrgentFeePercent = Math.min(
    baseUrgentFeePercent + calculatedIncrease,
    maxUrgentFeePercent
  );

  return newUrgentFeePercent;
}

function calculateGradeBasedFees(workOrder: WorkOrder, workerGrade: WorkerGrade): PaymentInfo {
  const baseCalculation = calculatePayment(workOrder);
  
  // Apply grade-based fee adjustment
  const gradeMultiplier = getGradeMultiplier(workerGrade.level);
  const adjustedPlatformFee = baseCalculation.platformFee * gradeMultiplier;
  const adjustedWorkerPayment = baseCalculation.totalFee - adjustedPlatformFee;

  return {
    ...baseCalculation,
    platformFee: adjustedPlatformFee,
    workerPayment: adjustedWorkerPayment,
    gradeInfo: {
      level: workerGrade.level,
      name: workerGrade.name,
      multiplier: gradeMultiplier
    }
  };
}

function getGradeMultiplier(gradeLevel: number): number {
  const multipliers: Record<number, number> = {
    1: 1.0,  // Bronze: full fee
    2: 0.9,  // Silver: 10% discount
    3: 0.8,  // Gold: 20% discount
    4: 0.7,  // Platinum: 30% discount
    5: 0.6   // Diamond: 40% discount
  };
  
  return multipliers[gradeLevel] || 1.0;
}

function validateWorkOrder(workOrder: WorkOrder): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic validation
  if (!workOrder.baseFee || workOrder.baseFee <= 0) {
    errors.push('Base fee must be greater than 0');
  }

  if (workOrder.urgentFeePercent < 0 || workOrder.urgentFeePercent > 100) {
    errors.push('Urgent fee percentage must be between 0 and 100');
  }

  if (workOrder.platformFeePercent < 0 || workOrder.platformFeePercent > 50) {
    errors.push('Platform fee percentage must be between 0 and 50');
  }

  // Use current urgent fee percent for warnings if available
  const actualUrgentFeePercent = workOrder.currentUrgentFeePercent || workOrder.urgentFeePercent;

  // Warnings
  if (actualUrgentFeePercent > 30) {
    warnings.push('Urgent fee is above 30%. Customer confirmation may be required.');
  }

  if (workOrder.platformFeePercent > 20) {
    warnings.push('Platform fee is above 20%.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Main Cloud Function
export const onWorkOrderCreate = functions.firestore
  .document("workOrders/{workOrderId}")
  .onCreate(async (snap, context) => {
    const workOrderId = context.params.workOrderId;
    const data = snap.data() as WorkOrder;
    
    if (!data) {
      console.error('No data found in work order document');
      return;
    }

    try {
      console.log(`Processing work order: ${workOrderId}`);

      // Validate work order
      const validation = validateWorkOrder(data);
      if (!validation.isValid) {
        console.error('Work order validation failed:', validation.errors);
        await snap.ref.update({
          status: 'invalid',
          validationErrors: validation.errors,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return;
      }

      // Calculate dynamic urgent fee if work order has creation time
      let workOrderWithDynamicFee = { ...data };
      if (data.createdAt) {
        const createdAt = data.createdAt instanceof admin.firestore.Timestamp 
          ? data.createdAt.toDate() 
          : new Date(data.createdAt);
        const now = new Date();
        const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        
        const dynamicUrgentFee = calculateDynamicUrgentFee(data, hoursSinceCreation);
        workOrderWithDynamicFee.currentUrgentFeePercent = dynamicUrgentFee;
        
        console.log(`Dynamic urgent fee calculated: ${dynamicUrgentFee}% (${hoursSinceCreation.toFixed(1)} hours since creation)`);
      }

      // Get worker grade if workerId is provided
      let paymentInfo: PaymentInfo;
      if (data.workerId) {
        try {
          const workerDoc = await db.collection('workers').doc(data.workerId).get();
          if (workerDoc.exists) {
            const workerData = workerDoc.data();
            if (workerData?.['grade']) {
              const workerGrade: WorkerGrade = {
                level: workerData['grade'].level || 1,
                name: workerData['grade'].name || 'Bronze',
                description: workerData['grade'].description
              };
              paymentInfo = calculateGradeBasedFees(workOrderWithDynamicFee, workerGrade);
              console.log(`Applied grade-based fees for worker ${data.workerId}: ${workerGrade.name}`);
            } else {
              paymentInfo = calculatePayment(workOrderWithDynamicFee);
            }
          } else {
            paymentInfo = calculatePayment(workOrderWithDynamicFee);
          }
        } catch (error) {
          console.warn(`Failed to fetch worker grade for ${data.workerId}:`, error);
          paymentInfo = calculatePayment(workOrderWithDynamicFee);
        }
      } else {
        paymentInfo = calculatePayment(workOrderWithDynamicFee);
      }

      // Create payment record (onCreate)
      const paymentRecordBase = {
        workOrderId,
        paymentInfo,
        calculatedAt: admin.firestore.Timestamp.now(),
        status: 'calculated' as const
      };
      const paymentRecord = Object.assign(
        {},
        paymentRecordBase,
        data.workerId ? { workerId: data.workerId } : {},
        data.customerId ? { customerId: data.customerId } : {}
      ) as PaymentRecord;

      // Update work order with payment details
      await snap.ref.update({
        paymentDetails: {
          urgentFee: paymentInfo.urgentFee,
          totalFee: paymentInfo.totalFee,
          platformFee: paymentInfo.platformFee,
          workerPayment: paymentInfo.workerPayment,
          customerTotalPayment: paymentInfo.customerTotalPayment,
          taxAmount: paymentInfo.taxAmount,
          discountAmount: paymentInfo.discountAmount,
          breakdown: paymentInfo.breakdown,
          gradeInfo: paymentInfo.gradeInfo
        },
        paymentStatus: "pending",
        calculatedAt: admin.firestore.FieldValue.serverTimestamp(),
        validationWarnings: validation.warnings,
        dynamicUrgentFeePercent: workOrderWithDynamicFee.currentUrgentFeePercent
      });

      // Store payment record in separate collection
      await db.collection('paymentRecords').doc(workOrderId).set(paymentRecord);

      console.log(`Payment calculation completed for work order: ${workOrderId}`);
      console.log(`Total fee: ${paymentInfo.totalFee.toLocaleString()} KRW`);
      console.log(`Worker payment: ${paymentInfo.workerPayment.toLocaleString()} KRW`);

      // Send notification to worker if assigned
      if (data.workerId) {
        try {
          await sendPaymentNotification(data.workerId, workOrderId, paymentInfo);
        } catch (error) {
          console.warn('Failed to send payment notification:', error);
        }
      }

    } catch (error) {
      console.error('Error processing work order payment:', error);
      
      // Update work order with error status
      await snap.ref.update({
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });

// Function to update payment when work order is updated
export const onWorkOrderUpdate = functions.firestore
  .document("workOrders/{workOrderId}")
  .onUpdate(async (change, context) => {
    const workOrderId = context.params.workOrderId;
    const beforeData = change.before.data() as WorkOrder;
    const afterData = change.after.data() as WorkOrder;
    
    // Check if payment-related fields have changed
    const paymentFieldsChanged = 
      beforeData.baseFee !== afterData.baseFee ||
      beforeData.urgentFeePercent !== afterData.urgentFeePercent ||
      beforeData.platformFeePercent !== afterData.platformFeePercent ||
      beforeData.discountPercent !== afterData.discountPercent ||
      beforeData.taxPercent !== afterData.taxPercent ||
      beforeData.workerId !== afterData.workerId;

    if (!paymentFieldsChanged) {
      return; // No payment-related changes
    }

    try {
      console.log(`Recalculating payment for work order: ${workOrderId}`);

      // Recalculate payment using the same logic as onCreate
      const validation = validateWorkOrder(afterData);
      if (!validation.isValid) {
        console.error('Work order validation failed:', validation.errors);
        return;
      }

      let workOrderWithDynamicFee = { ...afterData };
      if (afterData.createdAt) {
        const createdAt = afterData.createdAt instanceof admin.firestore.Timestamp 
          ? afterData.createdAt.toDate() 
          : new Date(afterData.createdAt);
        const now = new Date();
        const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        
        const dynamicUrgentFee = calculateDynamicUrgentFee(afterData, hoursSinceCreation);
        workOrderWithDynamicFee.currentUrgentFeePercent = dynamicUrgentFee;
      }

      let paymentInfo: PaymentInfo;
      if (afterData.workerId) {
        try {
          const workerDoc = await db.collection('workers').doc(afterData.workerId).get();
          if (workerDoc.exists) {
            const workerData = workerDoc.data();
            if (workerData?.['grade']) {
              const workerGrade: WorkerGrade = {
                level: workerData['grade'].level || 1,
                name: workerData['grade'].name || 'Bronze',
                description: workerData['grade'].description
              };
              paymentInfo = calculateGradeBasedFees(workOrderWithDynamicFee, workerGrade);
            } else {
              paymentInfo = calculatePayment(workOrderWithDynamicFee);
            }
          } else {
            paymentInfo = calculatePayment(workOrderWithDynamicFee);
          }
        } catch (error) {
          console.warn(`Failed to fetch worker grade for ${afterData.workerId}:`, error);
          paymentInfo = calculatePayment(workOrderWithDynamicFee);
        }
      } else {
        paymentInfo = calculatePayment(workOrderWithDynamicFee);
      }

      // Update work order with new payment details
      await change.after.ref.update({
        paymentDetails: {
          urgentFee: paymentInfo.urgentFee,
          totalFee: paymentInfo.totalFee,
          platformFee: paymentInfo.platformFee,
          workerPayment: paymentInfo.workerPayment,
          customerTotalPayment: paymentInfo.customerTotalPayment,
          taxAmount: paymentInfo.taxAmount,
          discountAmount: paymentInfo.discountAmount,
          breakdown: paymentInfo.breakdown,
          gradeInfo: paymentInfo.gradeInfo
        },
        paymentStatus: "pending",
        recalculatedAt: admin.firestore.FieldValue.serverTimestamp(),
        validationWarnings: validation.warnings,
        dynamicUrgentFeePercent: workOrderWithDynamicFee.currentUrgentFeePercent
      });

      // Update payment record
      const paymentRecordBase = {
        workOrderId,
        paymentInfo,
        calculatedAt: admin.firestore.Timestamp.now(),
        status: 'calculated' as const
      };
      const paymentRecord = Object.assign(
        {},
        paymentRecordBase,
        afterData.workerId ? { workerId: afterData.workerId } : {},
        afterData.customerId ? { customerId: afterData.customerId } : {}
      ) as PaymentRecord;

      await db.collection('paymentRecords').doc(workOrderId).set(paymentRecord);

      console.log(`Payment recalculation completed for work order: ${workOrderId}`);

    } catch (error) {
      console.error('Error recalculating work order payment:', error);
    }
  });

// Helper function to send payment notifications
async function sendPaymentNotification(workerId: string, workOrderId: string, paymentInfo: PaymentInfo) {
  try {
    // Get worker's FCM token
    const workerDoc = await db.collection('workers').doc(workerId).get();
    if (!workerDoc.exists) {
      return;
    }

    const workerData = workerDoc.data();
    const fcmToken = workerData?.['fcmToken'];

    if (!fcmToken) {
      console.log(`No FCM token found for worker: ${workerId}`);
      return;
    }

    // Send FCM notification
    const message = {
      token: fcmToken,
      notification: {
        title: '새로운 작업 주문이 할당되었습니다',
        body: `총 시공비: ${paymentInfo.totalFee.toLocaleString()}원, 작업자 지급액: ${paymentInfo.workerPayment.toLocaleString()}원`
      },
      data: {
        workOrderId,
        totalFee: paymentInfo.totalFee.toString(),
        workerPayment: paymentInfo.workerPayment.toString(),
        type: 'work_order_assigned'
      }
    };

    const response = await admin.messaging().send(message);
    console.log(`Payment notification sent to worker ${workerId}:`, response);
  } catch (error) {
    console.error('Error sending payment notification:', error);
  }
}

// Export individual functions for testing
export {
  calculatePayment,
  calculateDynamicUrgentFee,
  calculateGradeBasedFees,
  validateWorkOrder,
  getGradeMultiplier
}; 