import { validatePaymentStatusUpdate, getValidStatusTransitions } from './paymentStatusManager';

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  firestore: jest.fn(() => ({})),
  Timestamp: {
    now: jest.fn(() => new Date()),
    fromDate: jest.fn((date) => date)
  },
  FieldValue: {
    serverTimestamp: jest.fn(() => new Date())
  }
}));

describe('Payment Status Management', () => {
  describe('validatePaymentStatusUpdate', () => {
    it('should validate correct payment status update', () => {
      const validUpdate = {
        workOrderId: 'work-order-123',
        status: 'paid',
        paidAt: new Date().toISOString(),
        paymentMethod: 'card',
        transactionId: 'txn_123456',
        amount: 200000,
        updatedBy: 'admin'
      };
      const result = validatePaymentStatusUpdate(validUpdate);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should require workOrderId and status', () => {
      const missingId = { status: 'paid' };
      const missingStatus = { workOrderId: 'id' };
      expect(validatePaymentStatusUpdate(missingId).isValid).toBe(false);
      expect(validatePaymentStatusUpdate(missingStatus).isValid).toBe(false);
    });

    it('should reject invalid status', () => {
      const invalid = { workOrderId: 'id', status: 'invalid' };
      const result = validatePaymentStatusUpdate(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toMatch(/Invalid status/);
    });

    it('should accept all valid statuses', () => {
      ['pending','paid','failed','refunded','cancelled','processing'].forEach(status => {
        const result = validatePaymentStatusUpdate({ workOrderId: 'id', status });
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject invalid payment method', () => {
      const invalid = { workOrderId: 'id', status: 'paid', paymentMethod: 'invalid' };
      const result = validatePaymentStatusUpdate(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toMatch(/Invalid payment method/);
    });

    it('should accept all valid payment methods', () => {
      ['card','bank_transfer','cash','mobile_payment','other'].forEach(paymentMethod => {
        const result = validatePaymentStatusUpdate({ workOrderId: 'id', status: 'paid', paymentMethod });
        expect(result.isValid).toBe(true);
      });
    });

    it('should validate paidAt as a valid date', () => {
      const valid = { workOrderId: 'id', status: 'paid', paidAt: new Date().toISOString() };
      const invalid = { workOrderId: 'id', status: 'paid', paidAt: 'not-a-date' };
      expect(validatePaymentStatusUpdate(valid).isValid).toBe(true);
      expect(validatePaymentStatusUpdate(invalid).isValid).toBe(false);
    });

    it('should warn if paidAt is in the future', () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      const result = validatePaymentStatusUpdate({ workOrderId: 'id', status: 'paid', paidAt: future.toISOString() });
      expect(result.isValid).toBe(true);
      expect(result.warnings[0]).toMatch(/future/);
    });

    it('should validate amount as positive number', () => {
      expect(validatePaymentStatusUpdate({ workOrderId: 'id', status: 'paid', amount: 100 }).isValid).toBe(true);
      expect(validatePaymentStatusUpdate({ workOrderId: 'id', status: 'paid', amount: -1 }).isValid).toBe(false);
      expect(validatePaymentStatusUpdate({ workOrderId: 'id', status: 'paid', amount: '100' as any }).isValid).toBe(false);
      expect(validatePaymentStatusUpdate({ workOrderId: 'id', status: 'paid', amount: null as any }).isValid).toBe(false);
    });

    it('should validate transactionId as string', () => {
      expect(validatePaymentStatusUpdate({ workOrderId: 'id', status: 'paid', transactionId: 'abc' }).isValid).toBe(true);
      expect(validatePaymentStatusUpdate({ workOrderId: 'id', status: 'paid', transactionId: 123 as any }).isValid).toBe(false);
    });

    it('should ignore undefined/null/empty optional fields', () => {
      expect(validatePaymentStatusUpdate({ workOrderId: 'id', status: 'paid', paymentMethod: undefined, paidAt: undefined, amount: undefined, transactionId: undefined }).isValid).toBe(true);
      expect(validatePaymentStatusUpdate({ workOrderId: 'id', status: 'paid', paymentMethod: null as any, paidAt: null as any, amount: undefined, transactionId: null as any }).isValid).toBe(true);
      expect(validatePaymentStatusUpdate({ workOrderId: 'id', status: 'paid', paymentMethod: '', paidAt: '', amount: undefined, transactionId: '' }).isValid).toBe(true);
    });
  });

  describe('getValidStatusTransitions', () => {
    it('should return correct transitions for each status', () => {
      expect(getValidStatusTransitions('pending')).toEqual(['paid','failed','cancelled','processing']);
      expect(getValidStatusTransitions('processing')).toEqual(['paid','failed','cancelled']);
      expect(getValidStatusTransitions('paid')).toEqual(['refunded']);
      expect(getValidStatusTransitions('failed')).toEqual(['pending','processing']);
      expect(getValidStatusTransitions('refunded')).toEqual([]);
      expect(getValidStatusTransitions('cancelled')).toEqual([]);
    });
    it('should return ["pending"] for unknown status', () => {
      expect(getValidStatusTransitions('unknown')).toEqual(['pending']);
      expect(getValidStatusTransitions('')).toEqual(['pending']);
      expect(getValidStatusTransitions(null as any)).toEqual(['pending']);
      expect(getValidStatusTransitions(undefined as any)).toEqual(['pending']);
    });
  });
}); 