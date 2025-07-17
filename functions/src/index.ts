import * as admin from "firebase-admin";

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Export work order payment functions
export { 
  onWorkOrderCreate, 
  onWorkOrderUpdate 
} from './workOrderPayment';

// Export payment status management functions
export {
  updatePaymentStatus,
  getPaymentStatusHistory,
  bulkUpdatePaymentStatus
} from './paymentStatusManager';

// Export utility functions for testing
export {
  calculatePayment,
  calculateDynamicUrgentFee,
  calculateGradeBasedFees,
  validateWorkOrder,
  getGradeMultiplier
} from './workOrderPayment';

// Export types
export type { PaymentStatus, PaymentMethod } from './paymentStatusManager';

// Additional utility functions for external use
export const workOrderPaymentUtils = {
  // Calculate payment without creating a work order
  calculatePaymentOnly: (workOrderData: any) => {
    const { calculatePayment } = require('./workOrderPayment');
    return calculatePayment(workOrderData);
  },

  // Validate work order data
  validateWorkOrderData: (workOrderData: any) => {
    const { validateWorkOrder } = require('./workOrderPayment');
    return validateWorkOrder(workOrderData);
  },

  // Calculate dynamic urgent fee
  calculateDynamicFee: (workOrderData: any, hoursSinceCreation: number) => {
    const { calculateDynamicUrgentFee } = require('./workOrderPayment');
    return calculateDynamicUrgentFee(workOrderData, hoursSinceCreation);
  },

  // Validate payment status update
  validatePaymentStatusUpdate: (updateData: any) => {
    const { validatePaymentStatusUpdate } = require('./paymentStatusManager');
    return validatePaymentStatusUpdate(updateData);
  }
}; 