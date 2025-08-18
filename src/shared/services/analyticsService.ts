import { JobService } from './jobService';
import { AuthService } from './authService';
import { ConstructionJob, User } from '../../types';

export interface AnalyticsData {
  // 시공금액 분석
  revenueAnalysis: {
    totalRevenue: number;
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
      
      return {
        revenueAnalysis: await this.getRevenueAnalysis(filteredJobs),
        contractorAnalysis: await this.getContractorAnalysis(filteredJobs),
        locationAnalysis: await this.getLocationAnalysis(filteredJobs),
        sellerAnalysis: await this.getSellerAnalysis(filteredJobs),
        timeAnalysis: await this.getTimeAnalysis(filteredJobs)
      };
    } catch (error) {
      console.error('분석 데이터 가져오기 실패:', error);
      throw new Error('분석 데이터를 가져올 수 없습니다.');
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

  // 시공금액 분석
  private static async getRevenueAnalysis(jobs: ConstructionJob[]) {
    const completedJobs = jobs.filter(job => job.status === 'completed');
    
    // 총 수익 계산
    const totalRevenue = completedJobs.reduce((sum, job) => {
      return sum + job.items.reduce((itemSum, item) => itemSum + item.totalPrice, 0);
    }, 0);
    
    // 평균 수익
    const averageRevenue = completedJobs.length > 0 ? totalRevenue / completedJobs.length : 0;
    
    // 월별 수익
    const monthlyRevenue = this.calculateMonthlyRevenue(completedJobs);
    
    // 상태별 수익
    const revenueByStatus = this.calculateRevenueByStatus(jobs);
    
    return {
      totalRevenue,
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
        const jobRevenue = job.items.reduce((sum, item) => sum + item.totalPrice, 0);
        
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
      const jobRevenue = job.items.reduce((sum, item) => sum + item.totalPrice, 0);
      
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
      const jobRevenue = job.items.reduce((sum, item) => sum + item.totalPrice, 0);
      
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
      const revenue = job.items.reduce((sum, item) => sum + item.totalPrice, 0);
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
      const revenue = job.items.reduce((sum, item) => sum + item.totalPrice, 0);
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
