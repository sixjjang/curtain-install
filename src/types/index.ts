// 사용자 타입
export type UserRole = 'seller' | 'contractor' | 'admin' | 'customer';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

// 생체인증 관련 타입
export interface BiometricSettings {
  enabled: boolean;
  available: boolean;
  lastUsed?: Date;
}

// 자동 로그인 관련 타입
export interface AutoLoginSettings {
  enabled: boolean;
  rememberMe: boolean;
  lastLoginTime?: Date;
}

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
  admin?: AdminInfo;
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
  // 안내사항 확인 정보
  guidanceConfirmed?: {
    contractorGuidanceVersion?: number; // 시공자 안내사항 확인 버전
    sellerGuidanceVersion?: number; // 판매자 안내사항 확인 버전
    confirmedAt?: Date; // 확인 시간
    lastDailyVisit?: Date; // 마지막 일일 방문 확인 시간
  };
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

// 관리자 정보 타입
export interface AdminInfo {
  totalUsers: number;
  totalJobs: number;
  totalRevenue: number;
  systemSettings: {
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    maxFileSize: number;
    allowedFileTypes: string[];
  };
}

// 게시판 관련 타입
export type BoardType = 'notice' | 'admin-chat' | 'suggestion';
export type BoardCategory = 'notice' | 'admin-chat' | 'suggestion';

export interface BoardPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  boardType: BoardType;
  category: BoardCategory;
  createdAt: Date;
  updatedAt: Date;
  isPinned?: boolean; // 공지사항 고정
  isRead?: boolean; // 읽음 여부
  viewCount: number;
  replyCount: number;
  // 건의하기 관련
  status?: 'pending' | 'in-progress' | 'completed'; // 건의 상태
  adminReply?: string; // 관리자 답변
  adminReplyAt?: Date; // 관리자 답변 시간
  adminReplyBy?: string; // 답변한 관리자 ID
  // 채팅 관련
  chatRoomId?: string; // 채팅방 ID
  lastMessage?: string; // 마지막 메시지
  lastMessageAt?: Date; // 마지막 메시지 시간
  lastMessageBy?: string; // 마지막 메시지 작성자 ID
  unreadCount?: number; // 안읽은 메시지 수
}

export interface BoardReply {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  createdAt: Date;
  updatedAt: Date;
  isAdminReply?: boolean; // 관리자 답변 여부
}

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
  type: 'charge' | 'withdraw' | 'escrow' | 'release' | 'refund' | 'payment' | 'compensation' | 'deduction';
  amount: number;
  balance: number; // 거래 후 잔액
  description: string;
  jobId?: string; // 관련 작업 ID
  relatedJobId?: string; // 관련 작업 ID (별칭)
  compensationType?: 'product_not_ready' | 'customer_absent' | 'schedule_change'; // 보상 타입
  deductionType?: 'fee' | 'penalty' | 'job_cancellation_fee' | 'other'; // 차감 타입
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
  adminId?: string; // 관리자 승인 ID
  notes?: string;
  bankInfo?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  relatedTransactionId?: string;
  transferId?: string;
  transferCompletedAt?: Date; // 관련 거래 ID (환불 시 원본 거래 ID)
}

// 수동 계좌이체 충전 요청 타입
export interface ManualChargeRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  depositName?: string; // 입금자명
  depositAmount?: number; // 실제 입금 금액
  depositDate?: Date; // 입금 날짜
  adminNote?: string; // 관리자 메모
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  completedBy?: string; // 처리한 관리자 ID
}

// 관리자 알림 타입
export interface AdminNotification {
  id: string;
  type: 'manual_charge_request' | 'system_alert' | 'user_issue';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
  readBy?: string;
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
  // 수수료 설정
  feeSettings: {
    sellerCommissionRate: number; // 판매자 수수료율 (기본 3%)
    contractorCommissionRate: number; // 시공자 수수료율 (기본 2%)
  };
  // 토스페이먼츠 계좌 설정
  tossAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    isActive: boolean;
  };
  // 수동 계좌이체 계좌 설정
  manualAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    isActive: boolean;
  };
  // PWA 설정
  pwaSettings?: {
    appIcon: string;
    appName: string;
    appDescription: string;
    themeColor: string;
    backgroundColor: string;
  };
  // 사용자 안내사항 설정
  userGuidanceSettings: {
    contractorGuidance: {
      title: string; // 시공자 안내 제목
      content: string; // 시공자 안내 내용 (HTML 지원)
      version: number; // 안내사항 버전
    };
    sellerGuidance: {
      title: string; // 판매자 안내 제목
      content: string; // 판매자 안내 내용 (HTML 지원)
      version: number; // 안내사항 버전
    };
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

// 엑셀 업로드 작업 타입
export interface ExcelJobData {
  id: string;
  title: string;
  description: string;
  scheduledDate?: string;
  scheduledTime?: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  travelFee?: number;
  blindsQuantity?: number;
  curtainsQuantity?: number;
  pickupCompanyName?: string;
  pickupPhone?: string;
  pickupAddress?: string;
  pickupScheduledDate?: string;
  pickupScheduledTime?: string;
  workInstructions?: WorkInstruction[];
  status: 'pending' | 'ready' | 'error';
  errorMessage?: string;
  isSelected: boolean;
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
  status: 'pending' | 'assigned' | 'product_preparing' | 'product_ready' | 'pickup_completed' | 'in_progress' | 'completed' | 'cancelled' | 'product_not_ready' | 'customer_absent' | 'schedule_changed' | 'compensation_completed' | 'reschedule_requested';
  sellerId: string;
  sellerName?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  contractorId?: string;
  contractorName?: string;
  contractorPhone?: string;
  // 금액 관련 정보
  travelFee?: number;
  finalAmount?: number;
  escrowAmount?: number;
  // 일정 관련 정보
  preparationDate?: Date;
  pickupScheduledDate?: Date;
  // 픽업 관련 정보
  pickupCompanyName?: string;
  pickupPhone?: string;
  pickupAddress?: string;
  // 취소 관련 정보
  acceptedAt?: Date; // 시공자가 작업을 수락한 시간
  cancelledAt?: Date; // 작업이 취소된 시간
  cancellationReason?: string; // 취소 사유
  cancellationInfo?: {
    cancelledBy: string; // 취소한 시공자 ID
    cancelledAt: Date; // 취소 시간
    feeAmount: number; // 취소 수수료
    hoursSinceAcceptance: number; // 수락 후 경과 시간
    reason: string; // 취소 사유
  };
  items?: JobItem[];
  requirements?: string[];
  pickupInfo?: PickupInfo;
  progressHistory?: JobProgressStep[];
  isInternal?: boolean;
  images?: string[];
  workInstructions?: WorkInstruction[];
  compensationInfo?: {
    type: 'product_not_ready' | 'customer_absent' | 'schedule_change';
    amount: number;
    rate: number;
    processedAt: Date;
    processedBy: string;
  };
  rescheduleInfo?: {
    type: 'product_not_ready' | 'customer_absent';
    requestedAt: Date;
    requestedBy: string;
    newScheduledDate?: Date;
    confirmedAt?: Date;
    confirmedBy?: string;
  };
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
  accessToken?: string; // 접근 토큰 (로그인 없이 접근 가능하도록)
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
  senderProfileImage?: string; // 발신자 프로필 이미지 URL
  content: string;
  timestamp: Date;
  isRead: boolean;
  imageUrl?: string; // 이미지 URL (이미지 메시지인 경우)
  messageType?: 'text' | 'image'; // 메시지 타입 (기본값: 'text')
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

// 평점 기반 수수료율 정책 타입
export interface RatingBasedCommissionPolicy {
  id: string;
  minRating: number; // 최소 평점
  maxRating: number; // 최대 평점 (선택사항)
  commissionRate: number; // 수수료율 (%)
  description: string; // 정책 설명
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 평점 기반 정지 정책 타입
export interface RatingBasedSuspensionPolicy {
  id: string;
  minRating: number; // 최소 평점
  maxRating: number; // 최대 평점 (선택사항)
  suspensionDays: number; // 정지 일수 (0: 정지 없음, -1: 영구정지)
  description: string; // 정책 설명
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 시공자 레벨 관리 타입
export interface ContractorLevel {
  id: string;
  level: number;
  name: string; // 레벨 명칭 (예: 신입시공자, 최고급시공자)
  completedJobsCount: number; // 완료 시공건 수
  benefits: string[]; // 혜택 목록
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

// 광고 타입
export interface Advertisement {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  position: 'sidebar' | 'dashboard' | 'chat' | 'login';
  isActive: boolean;
  clickCount: number; // 클릭수
  publishStartDate: Date; // 게시 시작일
  publishEndDate: Date; // 게시 종료일
  isExpired: boolean; // 게시기간 만료 여부
  extensionRequested: boolean; // 연장 요청 여부
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
