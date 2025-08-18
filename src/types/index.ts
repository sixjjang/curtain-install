// 사용자 타입
export type UserRole = 'seller' | 'contractor' | 'admin' | 'customer';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  approvalStatus: ApprovalStatus;
  approvalDate?: Date;
  approvedBy?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive?: boolean;
  profileImage?: string;
  loginMethod?: 'email' | 'kakao' | 'google';
  contractor?: ContractorInfo;
  seller?: SellerInfo;
  warningMessage?: string; // 승인 대기 중 경고 메시지
}

// 판매자 픽업 정보 타입
export interface SellerPickupInfo {
  companyName: string;
  phone: string;
  address: string;
}

// 판매자 정보 타입
export interface SellerInfo {
  companyName: string;
  businessNumber: string;
  businessAddress: string;
  businessType: string;
  businessCategory: string;
  businessLicenseImage?: string; // 사업자등록증 이미지 URL
  rating: number;
  completedJobs: number;
  totalSales: number;
  points: number;
  pickupInfo?: SellerPickupInfo; // 픽업 정보 (선택사항)
}

// 판매자 타입 (기존 SellerInfo와 동일하지만 별칭으로 제공)
export type Seller = SellerInfo;

// 시공자 정보 타입
export interface ContractorInfo {
  name: string;
  phone: string;
  email: string;
  location?: {
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  serviceAreas: string[];
  experience: string; // 시공경력 (예: "5년", "3년 6개월")
  bankAccount: string;
  bankName: string;
  accountHolder: string; // 예금주
  idCardImage?: string; // 본인 반명함판 사진 URL
  rating: number;
  completedJobs: number;
  totalJobs: number; // 총 시공 건수
  totalEarnings: number;
  level: number;
  points: number;
}

// 옵션 타입
export interface PricingOption {
  id: string;
  name: string;
  price: number;
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 작업 품목 타입
export interface JobItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  options?: string[]; // 선택된 옵션 ID들
  optionPrices?: number; // 옵션 가격 합계
}

// 픽업 정보 타입
export interface PickupInfo {
  companyName: string;
  address: string;
  phone: string;
  scheduledDateTime: string;
}

// 작업지시서 파일 타입
export interface WorkInstruction {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: 'image' | 'pdf' | 'document';
  fileSize: number;
  uploadedAt: Date;
  uploadedBy: string;
}

// 작업 진행 단계별 시간 추적 타입
export interface JobProgressStep {
  status: ConstructionJob['status'];
  timestamp: Date;
  contractorId?: string;
  note?: string; // 추가 메모
}

// 시공 작업 타입
export interface ConstructionJob {
  id: string;
  sellerId: string;
  customerId: string;
  contractorId?: string;
  title: string;
  description: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  budget: {
    min: number;
    max: number;
  };
  items: JobItem[];
  status: 'pending' | 'assigned' | 'product_preparing' | 'product_ready' | 'pickup_completed' | 'in_progress' | 'completed' | 'cancelled';
  isInternal?: boolean; // 자사 직접 시공 여부
  createdAt: Date;
  updatedAt: Date;
  scheduledDate?: Date;
  completedDate?: Date;
  images: string[];
  requirements: string[];
  pickupInfo?: PickupInfo; // 픽업 정보 (선택사항)
  progressHistory?: JobProgressStep[]; // 작업 진행 단계별 시간 추적
  finalAmount?: number; // 확정된 최종 금액
  customerSatisfaction?: number; // 고객 만족도 평가 점수 (1-5)
  workInstructions?: WorkInstruction[]; // 작업지시서 파일들
}

// 평가 타입
export interface Review {
  id: string;
  jobId: string;
  reviewerId: string;
  reviewerRole: 'customer' | 'seller';
  contractorId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  categories: {
    professionalism: number;
    quality: number;
    punctuality: number;
    communication: number;
  };
}

// 만족도 조사 응답 타입
export interface SurveyResponse {
  questionId: string;
  answer: string | number | boolean;
  category?: string;
}

// 만족도 조사 타입
export interface SatisfactionSurvey {
  id: string;
  jobId: string;
  customerId: string;
  contractorId: string;
  responses: SurveyResponse[];
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 레벨 시스템 타입
export interface LevelSystem {
  level: number;
  experience: number;
  experienceToNext: number;
  title: string;
  benefits: string[];
  hourlyRateMultiplier: number;
  commissionRate: number;
}

// 알림 타입
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}

// 결제 타입
export interface Payment {
  id: string;
  jobId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  method: 'card' | 'transfer' | 'cash';
  createdAt: Date;
  completedAt?: Date;
}

// 채팅 메시지 타입
export interface ChatMessage {
  id: string;
  jobId: string;
  senderId: string;
  senderType: 'contractor' | 'seller' | 'customer';
  senderName: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

// 채팅방 타입
export interface ChatRoom {
  id: string;
  jobId: string;
  participants: {
    id: string;
    type: 'contractor' | 'seller' | 'customer';
    name: string;
  }[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// 고객 타입 (채팅용)
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  jobId: string;
}

// 긴급시공건 설정 타입
export interface EmergencyJobSettings {
  id: string;
  hoursWithin: number; // 몇 시간 이내
  additionalPercentage: number; // 추가 금액 퍼센트
  additionalAmount: number; // 추가 금액 (500원 단위로 계산)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 포인트 거래 타입
export interface PointTransaction {
  id: string;
  userId: string;
  userRole: 'seller' | 'contractor';
  type: 'charge' | 'payment' | 'withdrawal' | 'refund';
  amount: number;
  balance: number;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  relatedJobId?: string;
  createdAt: Date;
  completedAt?: Date;
}

// 포인트 잔액 타입
export interface PointBalance {
  userId: string;
  userRole: 'seller' | 'contractor';
  balance: number;
  totalCharged: number;
  totalWithdrawn: number;
  updatedAt: Date;
}

// 시공자 레벨 관리 타입
export interface ContractorLevel {
  id: string;
  level: number;
  name: string; // 레벨 명칭 (예: 신입시공자, 최고급시공자)
  commissionRate: number; // 수수료율 (%)
  hourlyRateMultiplier: number; // 시급 배수
  benefits: string[]; // 혜택 목록
  requirements: {
    minExperience: number; // 최소 경력 (개월)
    minJobs: number; // 최소 완료 작업 수
    minRating: number; // 최소 평점
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 자주 사용하는 설명 예시 타입
export interface JobDescriptionTemplate {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'curtain' | 'blind' | 'cleaning' | 'installation';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 작업 요구사항 뱃지 타입
export interface JobRequirementBadge {
  id: string;
  name: string;
  description: string;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  icon?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
