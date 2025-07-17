jest.mock('firebase-admin', () => {
  const mockTimestamp = {
    now: jest.fn(() => new Date()),
    toDate: jest.fn(() => new Date())
  };
  const mockFirestore = {
    collection: jest.fn(),
    doc: jest.fn(),
    FieldValue: {
      serverTimestamp: jest.fn(() => new Date())
    }
  };
  return {
    apps: [],
    initializeApp: jest.fn(),
    firestore: jest.fn(() => mockFirestore),
    Timestamp: mockTimestamp,
    FieldValue: {
      serverTimestamp: jest.fn(() => new Date())
    }
  };
});

import { calculatePayment, calculateDynamicUrgentFee, calculateGradeBasedFees, validateWorkOrder, getGradeMultiplier } from './workOrderPayment';

describe('Work Order Payment Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculatePayment', () => {
    it('should calculate basic payment correctly', () => {
      const workOrder = {
        baseFee: 100000,
        urgentFeePercent: 10,
        platformFeePercent: 15
      };
      const result = calculatePayment(workOrder);
      expect(result.baseFee).toBe(100000);
      expect(result.urgentFee).toBe(10000);
      expect(result.totalFee).toBe(110000);
      expect(result.platformFee).toBe(16500);
      expect(result.workerPayment).toBe(93500);
      expect(result.customerTotalPayment).toBe(110000);
    });
    it('should handle discount and tax', () => {
      const workOrder = {
        baseFee: 200000,
        urgentFeePercent: 5,
        platformFeePercent: 10,
        discountPercent: 10,
        taxPercent: 10
      };
      const result = calculatePayment(workOrder);
      expect(result.discountAmount).toBe(20000);
      expect(result.discountedBaseFee).toBe(180000);
      expect(result.urgentFee).toBe(9000);
      expect(result.totalFee).toBe(189000);
      expect(result.taxAmount).toBe(18900);
      expect(result.customerTotalPayment).toBe(207900);
    });
    it('should use current urgent fee when provided', () => {
      const workOrder = {
        baseFee: 150000,
        urgentFeePercent: 10,
        platformFeePercent: 12,
        currentUrgentFeePercent: 25
      };
      const result = calculatePayment(workOrder);
      expect(result.urgentFeePercent).toBe(25);
      expect(result.urgentFee).toBe(37500);
      expect(result.totalFee).toBe(187500);
    });
    it('should handle zero values', () => {
      const workOrder = {
        baseFee: 100000,
        urgentFeePercent: 0,
        platformFeePercent: 0,
        discountPercent: 0,
        taxPercent: 0
      };
      const result = calculatePayment(workOrder);
      expect(result.urgentFee).toBe(0);
      expect(result.platformFee).toBe(0);
      expect(result.taxAmount).toBe(0);
      expect(result.discountAmount).toBe(0);
      expect(result.totalFee).toBe(100000);
      expect(result.workerPayment).toBe(100000);
    });
  });

  describe('calculateDynamicUrgentFee', () => {
    it('should return base urgent fee for zero hours', () => {
      const workOrder = {
        baseFee: 100000,
        urgentFeePercent: 15,
        platformFeePercent: 10
      };
      const result = calculateDynamicUrgentFee(workOrder, 0);
      expect(result).toBe(15);
    });
    it('should increase urgent fee based on hours', () => {
      const workOrder = {
        baseFee: 100000,
        urgentFeePercent: 10,
        platformFeePercent: 10
      };
      const testCases = [
        { hours: 1, expected: 15 },
        { hours: 2, expected: 20 },
        { hours: 5, expected: 35 },
        { hours: 10, expected: 50 },
        { hours: 15, expected: 50 }
      ];
      testCases.forEach(({ hours, expected }) => {
        const result = calculateDynamicUrgentFee(workOrder, hours);
        expect(result).toBe(expected);
      });
    });
    it('should respect custom parameters', () => {
      const workOrder = {
        baseFee: 100000,
        urgentFeePercent: 5,
        platformFeePercent: 10
      };
      const result = calculateDynamicUrgentFee(
        workOrder,
        4,
        30,
        2,
        10
      );
      expect(result).toBe(25);
    });
    it('should not exceed maximum limit', () => {
      const workOrder = {
        baseFee: 100000,
        urgentFeePercent: 45,
        platformFeePercent: 10
      };
      const result = calculateDynamicUrgentFee(workOrder, 2);
      expect(result).toBe(50);
    });
  });

  describe('calculateGradeBasedFees', () => {
    const baseWorkOrder = {
      baseFee: 200000,
      urgentFeePercent: 0,
      platformFeePercent: 20
    };
    it('should apply bronze grade (no discount)', () => {
      const workerGrade = { level: 1, name: 'Bronze' };
      const result = calculateGradeBasedFees(baseWorkOrder, workerGrade);
      expect(result.gradeInfo?.level).toBe(1);
      expect(result.gradeInfo?.name).toBe('Bronze');
      expect(result.gradeInfo?.multiplier).toBe(1.0);
      expect(result.platformFee).toBe(40000);
      expect(result.workerPayment).toBe(160000);
    });
    it('should apply silver grade (10% discount)', () => {
      const workerGrade = { level: 2, name: 'Silver' };
      const result = calculateGradeBasedFees(baseWorkOrder, workerGrade);
      expect(result.gradeInfo?.multiplier).toBe(0.9);
      expect(result.platformFee).toBe(36000);
      expect(result.workerPayment).toBe(164000);
    });
    it('should apply gold grade (20% discount)', () => {
      const workerGrade = { level: 3, name: 'Gold' };
      const result = calculateGradeBasedFees(baseWorkOrder, workerGrade);
      expect(result.gradeInfo?.multiplier).toBe(0.8);
      expect(result.platformFee).toBe(32000);
      expect(result.workerPayment).toBe(168000);
    });
    it('should apply platinum grade (30% discount)', () => {
      const workerGrade = { level: 4, name: 'Platinum' };
      const result = calculateGradeBasedFees(baseWorkOrder, workerGrade);
      expect(result.gradeInfo?.multiplier).toBe(0.7);
      expect(result.platformFee).toBe(28000);
      expect(result.workerPayment).toBe(172000);
    });
    it('should apply diamond grade (40% discount)', () => {
      const workerGrade = { level: 5, name: 'Diamond' };
      const result = calculateGradeBasedFees(baseWorkOrder, workerGrade);
      expect(result.gradeInfo?.multiplier).toBe(0.6);
      expect(result.platformFee).toBe(24000);
      expect(result.workerPayment).toBe(176000);
    });
    it('should handle invalid grade level', () => {
      const workerGrade = { level: 99, name: 'Invalid' };
      const result = calculateGradeBasedFees(baseWorkOrder, workerGrade);
      expect(result.gradeInfo?.multiplier).toBe(1.0);
    });
  });

  describe('getGradeMultiplier', () => {
    it('should return correct multipliers for valid grades', () => {
      expect(getGradeMultiplier(1)).toBe(1.0);
      expect(getGradeMultiplier(2)).toBe(0.9);
      expect(getGradeMultiplier(3)).toBe(0.8);
      expect(getGradeMultiplier(4)).toBe(0.7);
      expect(getGradeMultiplier(5)).toBe(0.6);
    });
    it('should return default multiplier for invalid grade', () => {
      expect(getGradeMultiplier(0)).toBe(1.0);
      expect(getGradeMultiplier(99)).toBe(1.0);
      expect(getGradeMultiplier(-1)).toBe(1.0);
    });
  });

  describe('validateWorkOrder', () => {
    it('should validate correct work order', () => {
      const workOrder = {
        baseFee: 100000,
        urgentFeePercent: 10,
        platformFeePercent: 15
      };
      const result = validateWorkOrder(workOrder);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
    it('should detect invalid base fee', () => {
      const workOrder = {
        baseFee: 0,
        urgentFeePercent: 10,
        platformFeePercent: 15
      };
      const result = validateWorkOrder(workOrder);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Base fee must be greater than 0');
    });
    it('should detect invalid urgent fee percentage', () => {
      const workOrder = {
        baseFee: 100000,
        urgentFeePercent: 150,
        platformFeePercent: 15
      };
      const result = validateWorkOrder(workOrder);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Urgent fee percentage must be between 0 and 100');
    });
    it('should detect invalid platform fee percentage', () => {
      const workOrder = {
        baseFee: 100000,
        urgentFeePercent: 10,
        platformFeePercent: 60
      };
      const result = validateWorkOrder(workOrder);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Platform fee percentage must be between 0 and 50');
    });
    it('should generate warnings for high fees', () => {
      const workOrder = {
        baseFee: 100000,
        urgentFeePercent: 40,
        platformFeePercent: 25
      };
      const result = validateWorkOrder(workOrder);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Urgent fee is above 30%. Customer confirmation may be required.');
      expect(result.warnings).toContain('Platform fee is above 20%.');
    });
    it('should handle negative percentages', () => {
      const workOrder = {
        baseFee: 100000,
        urgentFeePercent: -10,
        platformFeePercent: -5
      };
      const result = validateWorkOrder(workOrder);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Urgent fee percentage must be between 0 and 100');
      expect(result.errors).toContain('Platform fee percentage must be between 0 and 50');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete payment calculation with all features', () => {
      const workOrder = {
        baseFee: 300000,
        urgentFeePercent: 15,
        platformFeePercent: 18,
        discountPercent: 8,
        taxPercent: 10,
        currentUrgentFeePercent: 25
      };
      const workerGrade = { level: 3, name: 'Gold' };
      const result = calculateGradeBasedFees(workOrder, workerGrade);
      expect(result.baseFee).toBe(300000);
      expect(result.discountAmount).toBe(24000);
      expect(result.discountedBaseFee).toBe(276000);
      expect(result.urgentFee).toBe(69000);
      expect(result.totalFee).toBe(345000);
      expect(result.platformFee).toBe(49680);
      expect(result.workerPayment).toBe(295320);
      expect(result.taxAmount).toBe(34500);
      expect(result.customerTotalPayment).toBe(379500);
      expect(result.gradeInfo?.level).toBe(3);
      expect(result.gradeInfo?.name).toBe('Gold');
      expect(result.gradeInfo?.multiplier).toBe(0.8);
      const validation = validateWorkOrder(workOrder);
      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toHaveLength(0);
    });
    it('should handle edge cases correctly', () => {
      const workOrder = {
        baseFee: 1,
        urgentFeePercent: 0,
        platformFeePercent: 0,
        discountPercent: 0,
        taxPercent: 0
      };
      const result = calculatePayment(workOrder);
      expect(result.totalFee).toBe(1);
      expect(result.workerPayment).toBe(1);
      expect(result.customerTotalPayment).toBe(1);
      expect(result.urgentFee).toBe(0);
      expect(result.platformFee).toBe(0);
      expect(result.taxAmount).toBe(0);
      expect(result.discountAmount).toBe(0);
    });
  });
}); 