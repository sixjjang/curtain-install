// 사용자 타입
export type UserRole = 'seller' | 'contractor' | 'admin' | 'customer';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  phoneNumbers?: string; // 숫자만 추출된 전화번호 (검색용)
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
  // 판매자 정보 (직접 저장)
  companyName?: string; // 판매자 상호명
  // 시공자 사업 정보 (직접 저장)
  businessName?: string; // 상호명
  businessNumber?: string; // 사업자등록번호
  businessAddress?: string; // 사업장주소
  businessType?: string; // 업태
  businessCategory?: string; // 종목
  businessLicenseImage?: string; // 사업자등록증 이미지 URL
}

// 판매자 픽업 정보 타입
export interface SellerPickupInfo {
  companyName: string;
  phone: string;
  phoneNumbers?: string; // 숫자만 추출된 픽업 전화번호 (검색용)
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
  businessName?: string; // 상호명
  businessNumber?: string; // 사업자등록번호
  businessAddress?: string; // 사업장주소
  businessType?: string; // 업태
  businessCategory?: string; // 종목
  businessLicenseImage?: string; // 사업자등록증 이미지 URL
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

// 포인트 거래 타입
export interface PointTransaction {
  id: string;
  userId: string;
  userRole: 'seller' | 'contractor';
  type: 'charge' | 'withdraw' | 'escrow' | 'release' | 'refund' | 'payment';
  amount: number;
  balance: number; // 거래 후 잔액
  description: string;
  jobId?: string; // 관련 작업 ID
  relatedJobId?: string; // 관련 작업 ID (별칭)
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
  adminId?: string; // 관리자 승인 ID
  notes?: string;
}

// 포인트 에스크로 타입
export interface PointEscrow {
  id: string;
  jobId: string;
  sellerId: string;
  contractorId?: string;
  amount: number;
  status: 'pending' | 'released' | 'refunded' | 'disputed';
  createdAt: Date;
  releasedAt?: Date;
  refundedAt?: Date;
  disputeDeadline: Date; // 자동 지급 시간
  notes?: string;
}

// 시스템 설정 타입
// 작업 취소 기록 타입
export interface JobCancellation {
  id: string;
  jobId: string;
  contractorId: string;
  contractorName: string;
  cancelledAt: Date;
  reason?: string;
  cancellationNumber: number; // 해당 시공자의 N번째 취소
  totalCancellationsToday: number; // 오늘 총 취소 횟수
  feeAmount?: number; // 취소 수수료 금액
  feeRate?: number; // 적용된 수수료율
}

// 작업 보상 기록 타입
export interface JobCompensation {
  id: string;
  jobId: string;
  contractorId: string;
  contractorName: string;
  compensationType: 'product_not_ready' | 'customer_absent' | 'schedule_change';
  compensationAmount: number;
  compensationRate: number;
  reason: string;
  compensatedAt: Date;
  processedBy: string; // 처리한 관리자 ID
}

// 일정 변경 기록 타입
export interface JobScheduleChange {
  id: string;
  jobId: string;
  contractorId: string;
  contractorName: string;
  oldScheduledDate: Date;
  newScheduledDate: Date;
  changeReason: string;
  changedAt: Date;
  changedBy: string; // 변경한 시공자 ID
  feeAmount?: number; // 일정 변경 수수료
  feeRate?: number; // 적용된 수수료율
}

// 시스템 설정 타입
export interface SystemSettings {
  id: string;
  escrowAutoReleaseHours: number; // 에스크로 자동 지급 시간 (시간 단위)
  // 취소 정책 설정
  jobCancellationPolicy: {
    maxCancellationHours: number; // 수락 후 취소 가능 시간 (시간 단위)
    maxDailyCancellations: number; // 하루 최대 취소 횟수
    cancellationFeeRate: number; // 취소 수수료율 (기본 5%)
  };
  // 보상 정책 설정
  compensationPolicy: {
    productNotReadyRate: number; // 제품 준비 미완료 시 보상율 (기본 30%)
    customerAbsentRate: number; // 소비자 부재 시 보상율 (기본 100%)
    scheduleChangeFeeRate: number; // 일정 변경 시 수수료율 (기본 0%)
  };
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string; // 관리자 ID
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
  title: string;
  description: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  scheduledDate?: Date;
  completedDate?: Date;
  budget?: {
    min: number;
    max: number;
  };
  status: 'pending' | 'assigned' | 'product_preparing' | 'product_ready' | 'pickup_completed' | 'in_progress' | 'completed' | 'cancelled' | 'product_not_ready' | 'customer_absent' | 'schedule_changed';
  sellerId: string;
  customerId?: string;
  contractorId?: string;
  contractorName?: string;
  // 취소 관련 정보
  acceptedAt?: Date; // 시공자가 작업을 수락한 시간
  cancelledAt?: Date; // 작업이 취소된 시간
  cancellationReason?: string; // 취소 사유
  items?: JobItem[];
  requirements?: string[];
  pickupInfo?: PickupInfo;
  progressHistory?: JobProgressStep[];
  finalAmount?: number;
  isInternal?: boolean;
  images?: string[];
  workInstructions?: WorkInstruction[];
  createdAt: Date;
  updatedAt: Date;
  customerSatisfaction?: number;
  satisfactionComment?: string;
  satisfactionSubmittedAt?: Date;
  recommendToOthers?: boolean;
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

// 포인트 잔액 타입 (간단한 버전)
export interface PointBalance {
  balance: number;
  totalCharged?: number; // 총 충전 금액
  totalWithdrawn?: number; // 총 인출 금액
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
