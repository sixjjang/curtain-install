// Pricing Calculator for Curtain Installation Platform

// Urgency levels
export const URGENCY_LEVELS = {
  NORMAL: 'normal',
  URGENT: 'urgent',
  EMERGENCY: 'emergency',
  SAME_DAY: 'same_day'
};

// Time slots for pricing
export const TIME_SLOTS = {
  MORNING: 'morning',    // 09:00-12:00
  AFTERNOON: 'afternoon', // 12:00-17:00
  EVENING: 'evening',    // 17:00-21:00
  NIGHT: 'night'         // 21:00-09:00 (next day)
};

// Pricing calculator class
class PricingCalculator {
  constructor() {
    this.defaultSettings = {
      basePrice: 50000, // 기본 설치 비용
      pricePerMeter: 15000, // 미터당 추가 비용
      urgentFeePercent: 15, // 기본 긴급 수수료
      emergencyFeePercent: 25, // 긴급 수수료
      sameDayFeePercent: 35, // 당일 수수료
      nightFeePercent: 20, // 야간 수수료
      weekendFeePercent: 10, // 주말 수수료
      holidayFeePercent: 15, // 공휴일 수수료
      maxUrgentFeePercent: 50, // 최대 긴급 수수료
      timeBasedIncreases: {
        [TIME_SLOTS.MORNING]: 0,
        [TIME_SLOTS.AFTERNOON]: 0,
        [TIME_SLOTS.EVENING]: 5,
        [TIME_SLOTS.NIGHT]: 20
      }
    };
  }

  // Calculate urgent fee with time-based progression
  calculateUrgentFee(baseFee, urgencyLevel, requestTime, sellerSettings = {}) {
    if (urgencyLevel === URGENCY_LEVELS.NORMAL) {
      return baseFee;
    }

    const settings = { ...this.defaultSettings, ...sellerSettings };
    const currentTime = Date.now();
    const elapsedTimeMinutes = (currentTime - requestTime) / (1000 * 60);

    let urgentFeePercent = 0;

    switch (urgencyLevel) {
      case URGENCY_LEVELS.URGENT:
        urgentFeePercent = settings.urgentFeePercent;
        break;
      case URGENCY_LEVELS.EMERGENCY:
        urgentFeePercent = settings.emergencyFeePercent;
        break;
      case URGENCY_LEVELS.SAME_DAY:
        urgentFeePercent = settings.sameDayFeePercent;
        break;
      default:
        return baseFee;
    }

    // Time-based fee increase (more urgent as time passes)
    if (elapsedTimeMinutes > 0) {
      const maxIncrease = settings.maxUrgentFeePercent - urgentFeePercent;
      const increaseRatePerMinute = maxIncrease / 60; // 1시간 내 최대치 도달
      const timeIncrease = Math.min(
        increaseRatePerMinute * elapsedTimeMinutes,
        maxIncrease
      );
      urgentFeePercent += timeIncrease;
    }

    return baseFee * (1 + urgentFeePercent / 100);
  }

  // Calculate time-based fees
  calculateTimeBasedFee(baseFee, installationTime, sellerSettings = {}) {
    const settings = { ...this.defaultSettings, ...sellerSettings };
    const hour = new Date(installationTime).getHours();
    const dayOfWeek = new Date(installationTime).getDay();

    let timeFeePercent = 0;

    // Time slot fees
    if (hour >= 9 && hour < 12) {
      timeFeePercent += settings.timeBasedIncreases[TIME_SLOTS.MORNING];
    } else if (hour >= 12 && hour < 17) {
      timeFeePercent += settings.timeBasedIncreases[TIME_SLOTS.AFTERNOON];
    } else if (hour >= 17 && hour < 21) {
      timeFeePercent += settings.timeBasedIncreases[TIME_SLOTS.EVENING];
    } else {
      timeFeePercent += settings.timeBasedIncreases[TIME_SLOTS.NIGHT];
    }

    // Weekend fees
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
      timeFeePercent += settings.weekendFeePercent;
    }

    return baseFee * (1 + timeFeePercent / 100);
  }

  // Calculate base installation fee
  calculateBaseFee(projectData, sellerSettings = {}) {
    const settings = { ...this.defaultSettings, ...sellerSettings };
    
    let baseFee = settings.basePrice;

    // Add per-meter cost
    if (projectData.curtainWidth && projectData.curtainHeight) {
      const area = projectData.curtainWidth * projectData.curtainHeight;
      baseFee += area * settings.pricePerMeter;
    }

    // Add complexity factors
    if (projectData.complexity) {
      const complexityMultiplier = this.getComplexityMultiplier(projectData.complexity);
      baseFee *= complexityMultiplier;
    }

    // Add material costs
    if (projectData.materials) {
      const materialCost = this.calculateMaterialCost(projectData.materials);
      baseFee += materialCost;
    }

    return baseFee;
  }

  // Get complexity multiplier
  getComplexityMultiplier(complexity) {
    const multipliers = {
      'simple': 1.0,
      'moderate': 1.2,
      'complex': 1.5,
      'very_complex': 2.0
    };
    return multipliers[complexity] || 1.0;
  }

  // Calculate material costs
  calculateMaterialCost(materials) {
    let totalCost = 0;
    
    materials.forEach(material => {
      const basePrice = this.getMaterialBasePrice(material.type);
      const quantity = material.quantity || 1;
      const qualityMultiplier = this.getQualityMultiplier(material.quality);
      
      totalCost += basePrice * quantity * qualityMultiplier;
    });

    return totalCost;
  }

  // Get material base prices
  getMaterialBasePrice(materialType) {
    const prices = {
      'curtain_rod': 15000,
      'curtain_rings': 5000,
      'brackets': 8000,
      'screws': 2000,
      'anchors': 3000,
      'curtain_fabric': 25000,
      'lining': 15000,
      'tiebacks': 12000
    };
    return prices[materialType] || 0;
  }

  // Get quality multiplier
  getQualityMultiplier(quality) {
    const multipliers = {
      'basic': 1.0,
      'standard': 1.3,
      'premium': 1.8,
      'luxury': 2.5
    };
    return multipliers[quality] || 1.0;
  }

  // Calculate total project cost
  calculateTotalCost(projectData, sellerSettings = {}) {
    const baseFee = this.calculateBaseFee(projectData, sellerSettings);
    
    // Apply urgency fee
    const urgencyFee = this.calculateUrgentFee(
      baseFee,
      projectData.urgencyLevel || URGENCY_LEVELS.NORMAL,
      projectData.requestTime || Date.now(),
      sellerSettings
    );

    // Apply time-based fee
    const timeBasedFee = this.calculateTimeBasedFee(
      urgencyFee,
      projectData.installationTime || new Date(),
      sellerSettings
    );

    // Add additional fees
    const additionalFees = this.calculateAdditionalFees(projectData, sellerSettings);

    // Apply grade-based fee adjustment
    const contractorGrade = projectData.contractorGrade || 'C';
    const gradeAdjustedFee = this.calculateGradeFee(
      timeBasedFee + additionalFees,
      contractorGrade,
      sellerSettings
    );

    const gradeFeeInfo = this.getGradeFeeInfo(contractorGrade, sellerSettings);
    const gradeAdjustment = gradeAdjustedFee - (timeBasedFee + additionalFees);

    return {
      baseFee: Math.round(baseFee),
      urgencyFee: Math.round(urgencyFee - baseFee),
      timeBasedFee: Math.round(timeBasedFee - urgencyFee),
      additionalFees: Math.round(additionalFees),
      gradeAdjustment: Math.round(gradeAdjustment),
      totalCost: Math.round(gradeAdjustedFee),
      gradeInfo: gradeFeeInfo,
      breakdown: {
        base: Math.round(baseFee),
        urgency: Math.round(urgencyFee - baseFee),
        timeBased: Math.round(timeBasedFee - urgencyFee),
        additional: Math.round(additionalFees),
        gradeAdjustment: Math.round(gradeAdjustment),
        total: Math.round(gradeAdjustedFee)
      }
    };
  }

  // Calculate additional fees
  calculateAdditionalFees(projectData, sellerSettings = {}) {
    const settings = { ...this.defaultSettings, ...sellerSettings };
    let additionalFees = 0;

    // Distance fee
    if (projectData.distance) {
      const distanceFee = Math.max(0, (projectData.distance - 10) * 1000); // 10km 이후 1km당 1,000원
      additionalFees += distanceFee;
    }

    // Parking fee
    if (projectData.parkingRequired) {
      additionalFees += 5000; // 주차비
    }

    // Elevator fee
    if (projectData.floor && projectData.floor > 3) {
      additionalFees += 3000; // 3층 이상 엘리베이터 수수료
    }

    // Special equipment fee
    if (projectData.specialEquipment) {
      additionalFees += 10000; // 특수 장비 사용료
    }

    // Rush hour fee
    if (projectData.rushHour) {
      additionalFees += 8000; // 러시아워 수수료
    }

    return additionalFees;
  }

  // Calculate contractor payment
  calculateContractorPayment(totalCost, contractorGrade, sellerSettings = {}) {
    const settings = { ...this.defaultSettings, ...sellerSettings };
    
    // Base contractor percentage
    let contractorPercentage = 70; // 기본 70%

    // Adjust based on contractor grade
    const gradeAdjustments = {
      'A': 0.05,  // A등급: +5%
      'B': 0.02,  // B등급: +2%
      'C': 0,     // C등급: 기본
      'D': -0.05  // D등급: -5%
    };

    contractorPercentage += (gradeAdjustments[contractorGrade] || 0) * 100;

    // Ensure percentage is within reasonable bounds
    contractorPercentage = Math.max(50, Math.min(85, contractorPercentage));

    return {
      contractorPayment: Math.round(totalCost * (contractorPercentage / 100)),
      platformFee: Math.round(totalCost * ((100 - contractorPercentage) / 100)),
      contractorPercentage: contractorPercentage
    };
  }

  // Get pricing estimate for customer
  getPricingEstimate(projectData, sellerSettings = {}) {
    const totalCost = this.calculateTotalCost(projectData, sellerSettings);
    const contractorPayment = this.calculateContractorPayment(
      totalCost.totalCost,
      projectData.contractorGrade || 'C',
      sellerSettings
    );

    return {
      ...totalCost,
      ...contractorPayment,
      estimate: {
        min: Math.round(totalCost.totalCost * 0.9), // 10% 할인 가능
        max: Math.round(totalCost.totalCost * 1.1), // 10% 추가 가능
        recommended: totalCost.totalCost
      },
      savings: {
        normalPrice: Math.round(totalCost.totalCost * 1.2), // 정상가 대비
        savingsAmount: Math.round(totalCost.totalCost * 0.2),
        savingsPercent: 20
      }
    };
  }

  // Format price for display
  formatPrice(price, currency = 'KRW') {
    if (currency === 'KRW') {
      return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
        minimumFractionDigits: 0
      }).format(price);
    }
    return price.toLocaleString();
  }

  // Get urgency level description
  getUrgencyDescription(urgencyLevel) {
    const descriptions = {
      [URGENCY_LEVELS.NORMAL]: {
        title: '일반',
        description: '일반적인 설치 일정',
        timeframe: '1-3일 내',
        icon: '📅'
      },
      [URGENCY_LEVELS.URGENT]: {
        title: '긴급',
        description: '빠른 설치가 필요한 경우',
        timeframe: '24시간 내',
        icon: '⚡'
      },
      [URGENCY_LEVELS.EMERGENCY]: {
        title: '긴급',
        description: '매우 긴급한 설치',
        timeframe: '12시간 내',
        icon: '🚨'
      },
      [URGENCY_LEVELS.SAME_DAY]: {
        title: '당일',
        description: '당일 설치',
        timeframe: '당일',
        icon: '🔥'
      }
    };
    return descriptions[urgencyLevel] || descriptions[URGENCY_LEVELS.NORMAL];
  }

  // Validate project data
  validateProjectData(projectData) {
    const errors = [];

    if (!projectData.curtainWidth || projectData.curtainWidth <= 0) {
      errors.push('커튼 너비를 입력해주세요.');
    }

    if (!projectData.curtainHeight || projectData.curtainHeight <= 0) {
      errors.push('커튼 높이를 입력해주세요.');
    }

    if (!projectData.installationTime) {
      errors.push('설치 시간을 선택해주세요.');
    }

    if (projectData.urgencyLevel && !Object.values(URGENCY_LEVELS).includes(projectData.urgencyLevel)) {
      errors.push('유효하지 않은 긴급도 수준입니다.');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}

// Create singleton instance
const pricingCalculator = new PricingCalculator();

export default pricingCalculator;
export { URGENCY_LEVELS, TIME_SLOTS, GRADE_FEE_RATES }; 