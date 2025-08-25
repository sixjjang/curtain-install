import { JobService } from './jobService';
import { AuthService } from './authService';
import { ConstructionJob, User } from '../../types';
import { SystemSettingsService } from './systemSettingsService';

export interface AnalyticsData {
  // 사용자 통계
  userStats: {
    totalUsers: number;
    pendingApprovals: number;
    activeContractors: number;
    totalSellers: number;
    totalCustomers: number;
  };
  
  // 작업 통계
  jobStats: {
    totalJobs: number;
    completedJobs: number;
    inProgressJobs: number;
    pendingJobs: number;
    cancelledJobs: number;
  };
  
  // 평점 분석
  ratingAnalysis: {
    averageRating: number;
    totalRatings: number;
    ratingDistribution: { rating: number; count: number }[];
  };
  
  // 시공금액 분석
  revenueAnalysis: {
    totalRevenue: number;
    totalTransactionAmount: number; // 총 거래액 (참고용)
    averageRevenue: number;
    monthlyRevenue: { month: string; revenue: number }[];
    revenueByStatus: { status: string; revenue: number }[];
  };
  
  // 시공자별 분석
  contractorAnalysis: {
    topContractors: { contractorId: string; name: string; jobs: number; revenue: number }[];
    contractorPerformance: { contractorId: string; name: string; avgTime: number; rating: number }[];
    contractorDistribution: { level: number; count: number }[];
  };
  
  // 지역별 분석
  locationAnalysis: {
    topLocations: { location: string; jobs: number; revenue: number }[];
    locationDistribution: { district: string; count: number }[];
  };
  
  // 판매자별 분석
  sellerAnalysis: {
    topSellers: { sellerId: string; name: string; jobs: number; revenue: number }[];
    sellerPerformance: { sellerId: string; name: string; avgRating: number; totalSales: number }[];
  };
  
  // 시공시간별 분석
  timeAnalysis: {
    averageCompletionTime: number;
    timeByStatus: { status: string; avgTime: number }[];
    monthlyCompletionTime: { month: string; avgTime: number }[];
    timeDistribution: { range: string; count: number }[];
    timeOfDayDistribution: { timeSlot: string; count: number; percentage: number }[];
  };
}

export class AnalyticsService {
  // 전체 분석 데이터 가져오기
  static async getAnalyticsData(period: 'daily' | 'weekly' | 'monthly' | 'all' = 'all'): Promise<AnalyticsData> {
    try {
      const allJobs = await JobService.getAllJobs();
      const filteredJobs = this.filterJobsByPeriod(allJobs, period);
      
      console.log('🔍 AnalyticsService - 전체 작업 수:', allJobs.length);
      console.log('🔍 AnalyticsService - 필터된 작업 수:', filteredJobs.length);
      
      const userStats = await this.getUserStats();
      const jobStats = await this.getJobStats(allJobs);
      const ratingAnalysis = await this.getRatingAnalysis(allJobs);
      const revenueAnalysis = await this.getRevenueAnalysis(filteredJobs);
      const contractorAnalysis = await this.getContractorAnalysis(filteredJobs);
      const locationAnalysis = await this.getLocationAnalysis(filteredJobs);
      const sellerAnalysis = await this.getSellerAnalysis(filteredJobs);
      const timeAnalysis = await this.getTimeAnalysis(filteredJobs);
      
      const result = {
        userStats,
        jobStats,
        ratingAnalysis,
        revenueAnalysis,
        contractorAnalysis,
        locationAnalysis,
        sellerAnalysis,
        timeAnalysis
      };
      
      console.log('📊 AnalyticsService - 반환 데이터:', result);
      return result;
    } catch (error) {
      console.error('분석 데이터 가져오기 실패:', error);
      // 에러 발생 시 기본값 반환
      return {
        userStats: {
          totalUsers: 0,
          pendingApprovals: 0,
          activeContractors: 0,
          totalSellers: 0,
          totalCustomers: 0
        },
        jobStats: {
          totalJobs: 0,
          completedJobs: 0,
          inProgressJobs: 0,
          pendingJobs: 0,
          cancelledJobs: 0
        },
        ratingAnalysis: {
          averageRating: 0,
          totalRatings: 0,
          ratingDistribution: []
        },
        revenueAnalysis: {
          totalRevenue: 0,
          totalTransactionAmount: 0,
          averageRevenue: 0,
          monthlyRevenue: [],
          revenueByStatus: []
        },
        contractorAnalysis: {
          topContractors: [],
          contractorPerformance: [],
          contractorDistribution: []
        },
        locationAnalysis: {
          topLocations: [],
          locationDistribution: []
        },
        sellerAnalysis: {
          topSellers: [],
          sellerPerformance: []
        },
        timeAnalysis: {
          averageCompletionTime: 0,
          timeByStatus: [],
          monthlyCompletionTime: [],
          timeDistribution: [],
          timeOfDayDistribution: []
        }
      };
    }
  }

  // 기간별 작업 필터링
  private static filterJobsByPeriod(jobs: ConstructionJob[], period: 'daily' | 'weekly' | 'monthly' | 'all'): ConstructionJob[] {
    if (period === 'all') return jobs;
    
    const now = new Date();
    const filteredJobs = jobs.filter(job => {
      let targetDate: Date;
      
      if (job.status === 'completed' && job.completedDate) {
        targetDate = job.completedDate;
      } else {
        targetDate = job.updatedAt;
      }

      switch (period) {
        case 'daily':
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          return targetDate >= today;
        case 'weekly':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return targetDate >= weekAgo;
        case 'monthly':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return targetDate >= monthAgo;
        default:
          return true;
      }
    });
    
    return filteredJobs;
  }

  // 사용자 통계
  private static async getUserStats() {
    try {
      const allUsers = await AuthService.getAllUsers();
      
      const totalUsers = allUsers.length;
      const pendingApprovals = allUsers.filter(user => user.approvalStatus === 'pending').length;
      const activeContractors = allUsers.filter(user => 
        user.role === 'contractor' && user.approvalStatus === 'approved' && user.isActive !== false
      ).length;
      const totalSellers = allUsers.filter(user => user.role === 'seller').length;
      const totalCustomers = allUsers.filter(user => user.role === 'customer').length;
      
      return {
        totalUsers,
        pendingApprovals,
        activeContractors,
        totalSellers,
        totalCustomers
      };
    } catch (error) {
      console.error('사용자 통계 계산 실패:', error);
      return {
        totalUsers: 0,
        pendingApprovals: 0,
        activeContractors: 0,
        totalSellers: 0,
        totalCustomers: 0
      };
    }
  }

  // 작업 통계
  private static async getJobStats(jobs: ConstructionJob[]) {
    const totalJobs = jobs.length;
    const completedJobs = jobs.filter(job => job.status === 'completed').length;
    const inProgressJobs = jobs.filter(job => 
      job.status === 'assigned' || job.status === 'in_progress' || job.status === 'product_preparing'
    ).length;
    const pendingJobs = jobs.filter(job => job.status === 'pending').length;
    const cancelledJobs = jobs.filter(job => job.status === 'cancelled').length;
    
    return {
      totalJobs,
      completedJobs,
      inProgressJobs,
      pendingJobs,
      cancelledJobs
    };
  }

  // 평점 분석
  private static async getRatingAnalysis(jobs: ConstructionJob[]) {
    const jobsWithRatings = jobs.filter(job => job.customerSatisfaction && job.customerSatisfaction > 0);
    const totalRatings = jobsWithRatings.length;
    
    const averageRating = totalRatings > 0 
      ? jobsWithRatings.reduce((sum, job) => sum + (job.customerSatisfaction || 0), 0) / totalRatings
      : 0;
    
    // 평점 분포 계산
    const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: jobsWithRatings.filter(job => job.customerSatisfaction === rating).length
    }));
    
    return {
      averageRating,
      totalRatings,
      ratingDistribution
    };
  }

  // 시공금액 분석
  private static async getRevenueAnalysis(jobs: ConstructionJob[]) {
    const completedJobs = jobs.filter(job => job.status === 'completed');
    
    // 시스템 설정에서 수수료율 가져오기
    const systemSettings = await SystemSettingsService.getSystemSettings();
    const sellerCommissionRate = systemSettings.feeSettings.sellerCommissionRate;
    const contractorCommissionRate = systemSettings.feeSettings.contractorCommissionRate;
    
    // 총 거래액 계산 (기존 방식)
    const totalTransactionAmount = completedJobs.reduce((sum, job) => {
      return sum + (job.items?.reduce((itemSum, item) => itemSum + item.totalPrice, 0) || 0);
    }, 0);
    
    // 실제 플랫폼 수익 계산 (수수료 수익)
    const totalRevenue = completedJobs.reduce((sum, job) => {
      const jobAmount = job.items?.reduce((itemSum, item) => itemSum + item.totalPrice, 0) || 0;
      
      // 판매자 수수료 (예: 100,000원 작업에서 3,000원)
      const sellerFee = jobAmount * (sellerCommissionRate / 100);
      
      // 시공자 수수료 (예: 100,000원에서 0% = 0원)
      const contractorFee = jobAmount * (contractorCommissionRate / 100);
      
      // 플랫폼 총 수익 = 판매자 수수료 + 시공자 수수료
      return sum + sellerFee + contractorFee;
    }, 0);
    
    // 평균 수익
    const averageRevenue = completedJobs.length > 0 ? totalRevenue / completedJobs.length : 0;
    
    // 월별 수익
    const monthlyRevenue = this.calculateMonthlyRevenue(completedJobs);
    
    // 상태별 수익
    const revenueByStatus = this.calculateRevenueByStatus(jobs);
    
    console.log('💰 수익 분석:', {
      totalTransactionAmount: totalTransactionAmount.toLocaleString(),
      totalRevenue: totalRevenue.toLocaleString(),
      sellerCommissionRate: `${sellerCommissionRate}%`,
      contractorCommissionRate: `${contractorCommissionRate}%`,
      completedJobsCount: completedJobs.length
    });
    
    return {
      totalRevenue,
      totalTransactionAmount, // 총 거래액 (참고용)
      averageRevenue,
      monthlyRevenue,
      revenueByStatus
    };
  }

  // 시공자별 분석
  private static async getContractorAnalysis(jobs: ConstructionJob[]) {
    const contractorMap = new Map<string, { jobs: number; revenue: number; totalTime: number; ratings: number[] }>();
    
    // 시공자별 데이터 수집
    for (const job of jobs) {
      if (job.contractorId) {
        const existing = contractorMap.get(job.contractorId) || { jobs: 0, revenue: 0, totalTime: 0, ratings: [] };
        const jobRevenue = job.items?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;
        
        existing.jobs += 1;
        existing.revenue += jobRevenue;
        
        // 시공 시간 계산
        if (job.progressHistory && job.progressHistory.length > 1) {
          const startTime = job.progressHistory[0].timestamp;
          const endTime = job.progressHistory[job.progressHistory.length - 1].timestamp;
          const timeDiff = endTime.getTime() - startTime.getTime();
          existing.totalTime += timeDiff;
        }
        
        contractorMap.set(job.contractorId, existing);
      }
    }
    
    // 시공자 정보 가져오기
    const topContractors: { contractorId: string; name: string; jobs: number; revenue: number }[] = [];
    const contractorPerformance: { contractorId: string; name: string; avgTime: number; rating: number }[] = [];
    
    for (const [contractorId, data] of Array.from(contractorMap.entries())) {
      try {
        const contractor = await AuthService.getUserById(contractorId);
        if (contractor) {
          topContractors.push({
            contractorId,
            name: contractor.name,
            jobs: data.jobs,
            revenue: data.revenue
          });
          
          contractorPerformance.push({
            contractorId,
            name: contractor.name,
            avgTime: data.jobs > 0 ? data.totalTime / data.jobs / (1000 * 60 * 60) : 0, // 시간 단위
            rating: contractor.role === 'contractor' ? (contractor as any).rating || 0 : 0
          });
        }
      } catch (error) {
        console.warn(`시공자 정보 가져오기 실패: ${contractorId}`, error);
      }
    }
    
    // 상위 시공자 정렬
    topContractors.sort((a, b) => b.revenue - a.revenue);
    contractorPerformance.sort((a, b) => b.rating - a.rating);
    
    // 레벨별 분포 (시공자만)
    const contractorJobs = jobs.filter(job => job.contractorId);
    const levelDistribution = new Map<number, number>();
    
    for (const job of contractorJobs) {
      if (job.contractorId) {
        try {
          const contractor = await AuthService.getUserById(job.contractorId);
          if (contractor && contractor.role === 'contractor') {
            const level = (contractor as any).level || 1;
            levelDistribution.set(level, (levelDistribution.get(level) || 0) + 1);
          }
        } catch (error) {
          console.warn(`시공자 레벨 정보 가져오기 실패: ${job.contractorId}`, error);
        }
      }
    }
    
    const contractorDistribution = Array.from(levelDistribution.entries()).map(([level, count]) => ({
      level,
      count
    }));
    
    return {
      topContractors: topContractors.slice(0, 10),
      contractorPerformance: contractorPerformance.slice(0, 10),
      contractorDistribution
    };
  }

  // 지역별 분석
  private static async getLocationAnalysis(jobs: ConstructionJob[]) {
    const locationMap = new Map<string, { jobs: number; revenue: number }>();
    
    for (const job of jobs) {
      const district = this.extractDistrict(job.address);
      const existing = locationMap.get(district) || { jobs: 0, revenue: 0 };
      const jobRevenue = job.items?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;
      
      existing.jobs += 1;
      existing.revenue += jobRevenue;
      locationMap.set(district, existing);
    }
    
    const topLocations = Array.from(locationMap.entries()).map(([location, data]) => ({
      location,
      jobs: data.jobs,
      revenue: data.revenue
    })).sort((a, b) => b.revenue - a.revenue);
    
    const locationDistribution = Array.from(locationMap.entries()).map(([district, data]) => ({
      district,
      count: data.jobs
    }));
    
    return {
      topLocations: topLocations.slice(0, 10),
      locationDistribution
    };
  }

  // 판매자별 분석
  private static async getSellerAnalysis(jobs: ConstructionJob[]) {
    const sellerMap = new Map<string, { jobs: number; revenue: number }>();
    
    for (const job of jobs) {
      const existing = sellerMap.get(job.sellerId) || { jobs: 0, revenue: 0 };
      const jobRevenue = job.items?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;
      
      existing.jobs += 1;
      existing.revenue += jobRevenue;
      sellerMap.set(job.sellerId, existing);
    }
    
    const topSellers: { sellerId: string; name: string; jobs: number; revenue: number }[] = [];
    const sellerPerformance: { sellerId: string; name: string; avgRating: number; totalSales: number }[] = [];
    
    for (const [sellerId, data] of Array.from(sellerMap.entries())) {
      try {
        const seller = await AuthService.getUserById(sellerId);
        if (seller) {
          topSellers.push({
            sellerId,
            name: seller.name,
            jobs: data.jobs,
            revenue: data.revenue
          });
          
          sellerPerformance.push({
            sellerId,
            name: seller.name,
            avgRating: seller.role === 'seller' ? (seller as any).rating || 0 : 0,
            totalSales: seller.role === 'seller' ? (seller as any).totalSales || 0 : 0
          });
        }
      } catch (error) {
        console.warn(`판매자 정보 가져오기 실패: ${sellerId}`, error);
      }
    }
    
    topSellers.sort((a, b) => b.revenue - a.revenue);
    sellerPerformance.sort((a, b) => b.avgRating - a.avgRating);
    
    return {
      topSellers: topSellers.slice(0, 10),
      sellerPerformance: sellerPerformance.slice(0, 10)
    };
  }

  // 시공시간별 분석
  private static async getTimeAnalysis(jobs: ConstructionJob[]) {
    const completedJobs = jobs.filter(job => job.status === 'completed');
    let totalTime = 0;
    let validJobs = 0;
    
    // 평균 완료 시간 계산
    for (const job of completedJobs) {
      if (job.progressHistory && job.progressHistory.length > 1) {
        const startTime = job.progressHistory[0].timestamp;
        const endTime = job.progressHistory[job.progressHistory.length - 1].timestamp;
        const timeDiff = endTime.getTime() - startTime.getTime();
        totalTime += timeDiff;
        validJobs += 1;
      }
    }
    
    const averageCompletionTime = validJobs > 0 ? totalTime / validJobs / (1000 * 60 * 60) : 0; // 시간 단위
    
    // 상태별 평균 시간
    const timeByStatus = this.calculateTimeByStatus(jobs);
    
    // 월별 완료 시간
    const monthlyCompletionTime = this.calculateMonthlyCompletionTime(completedJobs);
    
    // 시간 분포
    const timeDistribution = this.calculateTimeDistribution(completedJobs);
    
    // 시간대별 분포
    const timeOfDayDistribution = this.calculateTimeOfDayDistribution(jobs);
    
    return {
      averageCompletionTime,
      timeByStatus,
      monthlyCompletionTime,
      timeDistribution,
      timeOfDayDistribution
    };
  }

  // 헬퍼 메서드들
  private static calculateMonthlyRevenue(jobs: ConstructionJob[]) {
    const monthlyMap = new Map<string, number>();
    
    for (const job of jobs) {
      const month = job.completedDate?.toISOString().slice(0, 7) || job.updatedAt.toISOString().slice(0, 7);
      const revenue = job.items?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + revenue);
    }
    
    return Array.from(monthlyMap.entries()).map(([month, revenue]) => ({
      month,
      revenue
    })).sort((a, b) => a.month.localeCompare(b.month));
  }

  private static calculateRevenueByStatus(jobs: ConstructionJob[]) {
    const statusMap = new Map<string, number>();
    
    for (const job of jobs) {
      const revenue = job.items?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;
      statusMap.set(job.status, (statusMap.get(job.status) || 0) + revenue);
    }
    
    return Array.from(statusMap.entries()).map(([status, revenue]) => ({
      status,
      revenue
    }));
  }

  private static extractDistrict(address: string): string {
    // 주소에서 구 단위 추출
    const match = address.match(/([가-힣]+구)/);
    return match ? match[1] : '기타';
  }

  private static calculateTimeByStatus(jobs: ConstructionJob[]) {
    const statusMap = new Map<string, { totalTime: number; count: number }>();
    
    for (const job of jobs) {
      if (job.progressHistory && job.progressHistory.length > 1) {
        const startTime = job.progressHistory[0].timestamp;
        const endTime = job.progressHistory[job.progressHistory.length - 1].timestamp;
        const timeDiff = endTime.getTime() - startTime.getTime();
        
        const existing = statusMap.get(job.status) || { totalTime: 0, count: 0 };
        existing.totalTime += timeDiff;
        existing.count += 1;
        statusMap.set(job.status, existing);
      }
    }
    
    return Array.from(statusMap.entries()).map(([status, data]) => ({
      status,
      avgTime: data.count > 0 ? data.totalTime / data.count / (1000 * 60 * 60) : 0
    }));
  }

  private static calculateMonthlyCompletionTime(jobs: ConstructionJob[]) {
    const monthlyMap = new Map<string, { totalTime: number; count: number }>();
    
    for (const job of jobs) {
      if (job.progressHistory && job.progressHistory.length > 1) {
        const month = job.completedDate?.toISOString().slice(0, 7) || job.updatedAt.toISOString().slice(0, 7);
        const startTime = job.progressHistory[0].timestamp;
        const endTime = job.progressHistory[job.progressHistory.length - 1].timestamp;
        const timeDiff = endTime.getTime() - startTime.getTime();
        
        const existing = monthlyMap.get(month) || { totalTime: 0, count: 0 };
        existing.totalTime += timeDiff;
        existing.count += 1;
        monthlyMap.set(month, existing);
      }
    }
    
    return Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      avgTime: data.count > 0 ? data.totalTime / data.count / (1000 * 60 * 60) : 0
    })).sort((a, b) => a.month.localeCompare(b.month));
  }

  private static calculateTimeDistribution(jobs: ConstructionJob[]) {
    const ranges = [
      { range: '1시간 미만', min: 0, max: 1 },
      { range: '1-3시간', min: 1, max: 3 },
      { range: '3-6시간', min: 3, max: 6 },
      { range: '6-12시간', min: 6, max: 12 },
      { range: '12시간 이상', min: 12, max: Infinity }
    ];
    
    const distribution = ranges.map(range => ({
      range: range.range,
      count: 0
    }));
    
    for (const job of jobs) {
      if (job.progressHistory && job.progressHistory.length > 1) {
        const startTime = job.progressHistory[0].timestamp;
        const endTime = job.progressHistory[job.progressHistory.length - 1].timestamp;
        const timeDiff = endTime.getTime() - startTime.getTime();
        const hours = timeDiff / (1000 * 60 * 60);
        
        for (let i = 0; i < ranges.length; i++) {
          if (hours >= ranges[i].min && hours < ranges[i].max) {
            distribution[i].count += 1;
            break;
          }
        }
      }
    }
    
    return distribution;
  }

  private static calculateTimeOfDayDistribution(jobs: ConstructionJob[]) {
    const timeSlots = [
      { timeSlot: '새벽 (00:00-06:00)', min: 0, max: 6 },
      { timeSlot: '오전 (06:00-12:00)', min: 6, max: 12 },
      { timeSlot: '오후 (12:00-18:00)', min: 12, max: 18 },
      { timeSlot: '저녁 (18:00-24:00)', min: 18, max: 24 }
    ];
    
    const distribution = timeSlots.map(slot => ({
      timeSlot: slot.timeSlot,
      count: 0,
      percentage: 0
    }));
    
    let totalJobs = 0;
    
    for (const job of jobs) {
      if (job.progressHistory && job.progressHistory.length > 0) {
        // 작업 시작 시간을 기준으로 분석
        const startTime = job.progressHistory[0].timestamp;
        const hour = startTime.getHours();
        
        for (let i = 0; i < timeSlots.length; i++) {
          if (hour >= timeSlots[i].min && hour < timeSlots[i].max) {
            distribution[i].count += 1;
            totalJobs += 1;
            break;
          }
        }
      }
    }
    
    // 퍼센트 계산
    if (totalJobs > 0) {
      distribution.forEach(slot => {
        slot.percentage = Math.round((slot.count / totalJobs) * 100);
      });
    }
    
    return distribution;
  }
}
