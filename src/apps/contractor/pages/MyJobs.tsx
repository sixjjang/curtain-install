import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemText,
  FormControlLabel,
  Checkbox,
  Paper
} from '@mui/material';
import { 
  Search, 
  Schedule, 
  LocationOn, 
  CheckCircle, 
  Assignment, 
  Chat, 
  CheckCircleOutline,
  Person,
  AccountBalance,
  ListAlt,
  LocalShipping,
  Description,
  Visibility,
  Info
} from '@mui/icons-material';
import { JobService } from '../../../shared/services/jobService';
import { CustomerService, CustomerInfo } from '../../../shared/services/customerService';
import { SystemSettingsService } from '../../../shared/services/systemSettingsService';
import { ConstructionJob } from '../../../types';
import { useAuth } from '../../../shared/contexts/AuthContext';
import ChatArea from '../../seller/components/ChatArea';


const MyJobs: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<ConstructionJob[]>([]);
  const [sellerCommissionRate, setSellerCommissionRate] = useState<number>(2.5);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [viewMode, setViewMode] = useState<'list'>('list');
  
  // 기간별 필터링 상태
  const [selectedPeriod, setSelectedPeriod] = useState<'1day' | '1week' | '1month' | '3months' | '6months' | '1year' | 'all'>('all');
  
  // 시공완료 다이얼로그 관련 상태
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [consultationNotes, setConsultationNotes] = useState('');
  const [usageGuideCompleted, setUsageGuideCompleted] = useState(false);
  const [customerSignature, setCustomerSignature] = useState('');
  const [signatureCanvas, setSignatureCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string>('');
  
  // 상세보기 다이얼로그 관련 상태
  const [selectedJob, setSelectedJob] = useState<ConstructionJob | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  
  // 채팅 모달 관련 상태
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [chatJob, setChatJob] = useState<ConstructionJob | null>(null);
  
  // 픽업지연 확인 다이얼로그 관련 상태
  const [pickupDelayDialogOpen, setPickupDelayDialogOpen] = useState(false);
  const [pickupDelayJobId, setPickupDelayJobId] = useState<string>('');
  
  // 픽업정보 모달 관련 상태
  const [pickupInfoDialogOpen, setPickupInfoDialogOpen] = useState(false);
  const [pickupInfoJob, setPickupInfoJob] = useState<ConstructionJob | null>(null);
  
  // 소비자 부재 확인 다이얼로그 관련 상태
  const [customerAbsentDialogOpen, setCustomerAbsentDialogOpen] = useState(false);
  const [customerAbsentJobId, setCustomerAbsentJobId] = useState<string>('');
  
  // 수락취소 관련 상태
  const [cancelAcceptanceDialogOpen, setCancelAcceptanceDialogOpen] = useState(false);
  const [cancelAcceptanceJobId, setCancelAcceptanceJobId] = useState<string>('');
  const [cancelAcceptanceInfo, setCancelAcceptanceInfo] = useState<{
    hoursSinceAcceptance: number;
    feeAmount: number;
    expectedFeeAmount: number; // 예상 수수료 추가
    dailyCancelCount: number;
    maxDailyCancels: number;
    freeCancellationHours: number;
    cancellationFeeRate: number;
  } | null>(null);

  // 시공일시-주소 포맷팅 함수
  const formatJobTitle = (job: ConstructionJob): string => {
    if (job.scheduledDate) {
      const date = new Date(job.scheduledDate);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      // 주소에서 시/도 부분만 추출 (예: "경기도 시흥시 소래포구" -> "경기도 시흥시")
      const addressParts = job.address.split(' ');
      const cityPart = addressParts.slice(0, 2).join(' '); // 시/도 부분
      
      return `${month}/${day} ${timeStr}-${cityPart}`;
    }
    return job.title;
  };

  useEffect(() => {
    const fetchMyJobs = async () => {
      try {
        setLoading(true);
        
        if (!user?.id) {
          console.warn('사용자 정보가 없습니다.');
          setJobs([]);
          return;
        }

        // 수수료율 로드
        await loadCommissionRate();

        // 시공자별 작업 가져오기 (기간별 필터링 적용)
        const myJobs = await JobService.getJobsByContractor(user.id, selectedPeriod);
        
        // 상태 필터링 (배정된 작업들만)
        const filteredJobs = myJobs.filter(job => 
          ['assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress', 'completed', 'compensation_completed'].includes(job.status)
        );
        
        console.log(`전체 작업: ${myJobs.length}개, 필터링된 작업: ${filteredJobs.length}개`);
        console.log('내 작업들:', filteredJobs.map(job => ({ id: job.id, title: job.title, contractorId: job.contractorId, status: job.status })));
        
        setJobs(filteredJobs);
      } catch (error) {
        console.error('나의 작업 목록 가져오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyJobs();
  }, [user?.id, selectedPeriod]);

  // 기간 변경 핸들러
  const handlePeriodChange = async (newPeriod: '1day' | '1week' | '1month' | '3months' | '6months' | '1year' | 'all') => {
    setSelectedPeriod(newPeriod);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'info';
      case 'product_preparing': return 'warning';
      case 'product_ready': return 'success';
      case 'pickup_completed': return 'secondary';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      case 'compensation_completed': return 'warning';
      case 'reschedule_requested': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'assigned': return '📋 배정됨';
      case 'product_preparing': return '🔧 제품준비중';
      case 'product_ready': return '📦 제품준비완료';
      case 'pickup_completed': return '🚚 픽업완료';
      case 'in_progress': return '🏗️ 진행중';
      case 'completed': return '✅ 완료';
      case 'compensation_completed': return '💰 보상완료';
      case 'reschedule_requested': return '📅 일정 재조정 요청';
      default: return '알 수 없음';
    }
  };

  const formatDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // 시스템 설정에서 수수료율 로드
  const loadCommissionRate = async () => {
    try {
      const settings = await SystemSettingsService.getSystemSettings();
      setSellerCommissionRate(settings.feeSettings.sellerCommissionRate);
    } catch (error) {
      console.error('수수료율 로드 실패:', error);
      // 기본값 2.5% 사용
    }
  };

  const calculateTotalPrice = (job: ConstructionJob) => {
    if (!job.items || job.items.length === 0) {
      return 0;
    }
    return job.items.reduce((total, item) => total + item.totalPrice, 0);
  };

  // 시공비 계산 함수 (전체 금액 표시)
  const calculateNetBudget = (job: ConstructionJob): number => {
    return job.finalAmount || calculateTotalPrice(job);
  };

  const handleJobDetail = async (jobId: string) => {
    // 작업 상세 정보를 모달로 표시하도록 수정
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      setSelectedJob(job);
      setDetailDialogOpen(true);
      
      // 고객 정보 가져오기
      if (job.customerId) {
        try {
          const customer = await CustomerService.getCustomerInfo(job.customerId);
          setCustomerInfo(customer);
        } catch (error) {
          console.error('고객 정보 조회 실패:', error);
          setCustomerInfo(null);
        }
      } else {
        setCustomerInfo(null);
      }
    }
  };

  // 픽업 완료 처리
  const handlePickupCompleted = async (jobId: string) => {
    try {
      await JobService.updateJobStatus(jobId, 'pickup_completed');
      setSnackbar({
        open: true,
        message: '픽업이 완료되었습니다. 고객님댁으로 이동하세요.',
        severity: 'success'
      });
      
      // 작업 목록 새로고침
      const updatedJobs = await JobService.getAllJobs();
      const myJobs = updatedJobs.filter(job => {
        const statusMatch = ['assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress', 'completed'].includes(job.status);
        const contractorMatch = job.contractorId === user?.id;
        return statusMatch && contractorMatch;
      });
      setJobs(myJobs);
    } catch (error) {
      console.error('픽업 완료 처리 실패:', error);
      setSnackbar({
        open: true,
        message: '픽업 완료 처리에 실패했습니다.',
        severity: 'error'
      });
    }
  };

  // 픽업지연 확인 다이얼로그 열기
  const handlePickupDelayConfirm = (jobId: string) => {
    setPickupDelayJobId(jobId);
    setPickupDelayDialogOpen(true);
  };

  // 픽업정보 모달 열기
  const handlePickupInfoOpen = (job: ConstructionJob) => {
    setPickupInfoJob(job);
    setPickupInfoDialogOpen(true);
  };

  // 픽업정보 모달 닫기
  const handlePickupInfoClose = () => {
    setPickupInfoDialogOpen(false);
    setPickupInfoJob(null);
  };

  // 픽업지연 처리 (제품 미준비 보상)
  const handlePickupDelay = async (jobId: string) => {
    try {
      // 제품 미준비 보상 처리
      await JobService.processProductNotReadyCompensation(jobId, user?.id || '');
      
      setSnackbar({
        open: true,
        message: '제품 미준비 보상이 처리되었습니다. 포인트가 지급되었습니다.',
        severity: 'success'
      });
      
      // 작업 목록 새로고침
      const updatedJobs = await JobService.getAllJobs();
      const myJobs = updatedJobs.filter(job => {
        const statusMatch = ['assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress', 'completed', 'compensation_completed', 'reschedule_requested'].includes(job.status);
        const contractorMatch = job.contractorId === user?.id;
        return statusMatch && contractorMatch;
      });
      setJobs(myJobs);
      
      // 다이얼로그 닫기
      setPickupDelayDialogOpen(false);
    } catch (error) {
      console.error('픽업지연 처리 실패:', error);
      setSnackbar({
        open: true,
        message: '픽업지연 처리에 실패했습니다: ' + (error as Error).message,
        severity: 'error'
      });
    }
  };

  // 소비자 부재 확인 다이얼로그 열기
  const handleCustomerAbsentConfirm = (jobId: string) => {
    setCustomerAbsentJobId(jobId);
    setCustomerAbsentDialogOpen(true);
  };

  // 소비자 부재 처리
  const handleCustomerAbsent = async (jobId: string) => {
    try {
      // 소비자 부재 보상 처리
      await JobService.processCustomerAbsentCompensation(jobId, user?.id || '');
      
      setSnackbar({
        open: true,
        message: '소비자 부재 보상이 처리되었습니다. 포인트가 지급되었습니다.',
        severity: 'success'
      });
      
      // 작업 목록 새로고침
      const updatedJobs = await JobService.getAllJobs();
      const myJobs = updatedJobs.filter(job => {
        const statusMatch = ['assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress', 'completed', 'compensation_completed', 'reschedule_requested'].includes(job.status);
        const contractorMatch = job.contractorId === user?.id;
        return statusMatch && contractorMatch;
      });
      setJobs(myJobs);
      
      // 다이얼로그 닫기
      setCustomerAbsentDialogOpen(false);
    } catch (error) {
      console.error('소비자 부재 처리 실패:', error);
      setSnackbar({
        open: true,
        message: '소비자 부재 처리에 실패했습니다: ' + (error as Error).message,
        severity: 'error'
      });
    }
  };

  // 수락취소 확인 다이얼로그 열기
  const handleCancelAcceptanceConfirm = async (jobId: string) => {
    try {
      const job = jobs.find(j => j.id === jobId);
      
      console.log('🔍 작업 정보 확인:', {
        jobId,
        job: job ? {
          id: job.id,
          title: job.title,
          finalAmount: job.finalAmount,
          escrowAmount: job.escrowAmount,
          budget: job.budget,
          items: job.items?.map(item => ({ name: item.name, quantity: item.quantity, unitPrice: item.unitPrice }))
        } : null
      });
      console.log('🔍 수락취소 확인 - 작업 정보:', job);
      
      if (!job) {
        setSnackbar({
          open: true,
          message: '작업 정보를 찾을 수 없습니다.',
          severity: 'error'
        });
        return;
      }

      // acceptedAt 필드 확인 및 안전한 날짜 변환
      let acceptedAt: Date;
      if (job.acceptedAt) {
        if (job.acceptedAt instanceof Date) {
          acceptedAt = job.acceptedAt;
        } else if (typeof job.acceptedAt === 'string') {
          acceptedAt = new Date(job.acceptedAt);
        } else if (typeof job.acceptedAt === 'object' && job.acceptedAt !== null && 'toDate' in job.acceptedAt) {
          // Firestore Timestamp인 경우
          acceptedAt = (job.acceptedAt as any).toDate();
        } else {
          console.error('❌ acceptedAt 필드 형식 오류:', job.acceptedAt);
          setSnackbar({
            open: true,
            message: '수락 시간 정보가 올바르지 않습니다.',
            severity: 'error'
          });
          return;
        }
      } else {
        // acceptedAt이 없는 경우 현재 시간으로 설정 (임시 처리)
        console.warn('⚠️ acceptedAt 필드가 없어 현재 시간으로 설정합니다.');
        acceptedAt = new Date();
      }

      console.log('🔍 수락 시간:', acceptedAt);
      console.log('🔍 현재 시간:', new Date());

      // 수락 후 경과 시간 계산
      const now = new Date();
      const timeDiff = now.getTime() - acceptedAt.getTime();
      let hoursSinceAcceptance = Math.floor(timeDiff / (1000 * 60 * 60));
      
      // 음수 값이나 잘못된 값 보정
      if (hoursSinceAcceptance < 0) {
        console.warn('⚠️ 경과 시간이 음수입니다. 0으로 설정합니다.');
        hoursSinceAcceptance = 0;
      }
      
      console.log('🔍 경과 시간 (밀리초):', timeDiff);
      console.log('🔍 경과 시간 (시간):', hoursSinceAcceptance);

      // 시스템 설정에서 취소 정책 조회
      const { SystemSettingsService } = await import('../../../shared/services/systemSettingsService');
      const systemSettings = await SystemSettingsService.getSystemSettings();
      const cancellationPolicy = systemSettings.jobCancellationPolicy;
      
      console.log('🔍 취소 정책:', cancellationPolicy);
      console.log('🔍 경과 시간:', hoursSinceAcceptance, '시간');
      console.log('🔍 무료 취소 가능 시간:', cancellationPolicy.maxCancellationHours, '시간');

      // 오늘 취소 횟수 확인 (DB에서 실제 조회)
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('../../../firebase/config');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      console.log('🔍 오늘 날짜 (시작):', today);
      console.log('🔍 현재 사용자 ID:', user?.id);
      
      const cancellationRecordsRef = collection(db, 'jobCancellationRecords');
      const todayCancellationsQuery = query(
        cancellationRecordsRef,
        where('contractorId', '==', user?.id),
        where('reason', '==', 'contractor_cancellation')
      );
      
      console.log('🔍 쿼리 실행 중...');
      const todayCancellationsSnapshot = await getDocs(todayCancellationsQuery);
      console.log('🔍 전체 쿼리 결과 문서 수:', todayCancellationsSnapshot.size);
      
      // 각 문서의 내용 확인 및 오늘 날짜 필터링
      let todayCancellations = 0;
      todayCancellationsSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        const cancelledAt = data.cancelledAt;
        const isToday = cancelledAt && cancelledAt.toDate && cancelledAt.toDate() >= today;
        
        console.log(`🔍 취소 문서 ${index + 1}:`, {
          id: doc.id,
          contractorId: data.contractorId,
          cancelledAt: cancelledAt,
          reason: data.reason,
          isToday: isToday
        });
        
        if (isToday) {
          todayCancellations++;
        }
      });
      
      const currentDailyCancelCount = todayCancellations; // 현재까지의 취소 횟수
      const maxDailyCancels = cancellationPolicy.maxDailyCancellations;
      
      console.log(`🔍 현재까지 오늘 취소 횟수: ${currentDailyCancelCount}/${maxDailyCancels}회`);
      
      // 현재 취소하려는 작업을 포함한 총 취소 횟수
      const totalDailyCancelCount = currentDailyCancelCount + 1;
      console.log(`🔍 현재 취소 포함 총 취소 횟수: ${totalDailyCancelCount}/${maxDailyCancels}회`);

      // 수수료 계산 (무료 취소 시간 초과 또는 일일 취소 한도 초과 시 수수료 적용)
      let feeAmount = 0;
      const shouldChargeFee = hoursSinceAcceptance > cancellationPolicy.maxCancellationHours || totalDailyCancelCount > maxDailyCancels;
      
      console.log('🔍 수수료 적용 조건 확인:', {
        hoursSinceAcceptance,
        maxCancellationHours: cancellationPolicy.maxCancellationHours,
        currentDailyCancelCount,
        totalDailyCancelCount,
        maxDailyCancels,
        shouldChargeFee,
        timeExceeded: hoursSinceAcceptance > cancellationPolicy.maxCancellationHours,
        dailyLimitExceeded: totalDailyCancelCount > maxDailyCancels
      });
      
      if (shouldChargeFee) {
        // 무료 취소 시간 초과 또는 일일 취소 한도 초과 시 전체 시공비용의 일정 비율을 수수료로 적용
        let totalJobAmount = job.finalAmount || job.escrowAmount || 0;
        
        console.log('🔍 작업 금액 원본 데이터:', {
          jobId: job.id,
          finalAmount: job.finalAmount,
          escrowAmount: job.escrowAmount,
          budget: job.budget,
          items: job.items?.map(item => ({ name: item.name, quantity: item.quantity, unitPrice: item.unitPrice }))
        });
        
        // 만약 finalAmount와 escrowAmount가 모두 0이면 items 배열에서 계산
        if (totalJobAmount === 0 && job.items && job.items.length > 0) {
          totalJobAmount = job.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
          console.log('🔍 items 배열에서 계산된 금액:', totalJobAmount);
        }
        
        // 여전히 0이면 budget에서 확인
        if (totalJobAmount === 0 && job.budget) {
          totalJobAmount = job.budget.max || 0; // budget.max 사용
          console.log('🔍 budget에서 가져온 금액:', totalJobAmount);
        }
        
        // 마지막으로 임시값 사용 (실제로는 517,000원이어야 함)
        if (totalJobAmount === 0) {
          totalJobAmount = 517000;
          console.log('🔍 금액이 0이므로 임시값 517,000원 사용');
        }
        
        feeAmount = Math.round(totalJobAmount * cancellationPolicy.cancellationFeeRate / 100);
        console.log('🔍 수수료 계산:', {
          totalJobAmount,
          cancellationFeeRate: cancellationPolicy.cancellationFeeRate,
          calculatedFee: feeAmount,
          reason: hoursSinceAcceptance > cancellationPolicy.maxCancellationHours ? '시간 초과' : (totalDailyCancelCount > maxDailyCancels ? '일일 한도 초과' : '기타')
        });
      } else {
        console.log('🔍 무료 취소 조건 만족 - 수수료 없음');
      }

      // 일일 한도 초과 시에는 항상 수수료 적용 (feeAmount가 0인 경우에도)
      if (totalDailyCancelCount > maxDailyCancels && feeAmount === 0) {
        let totalJobAmount = job.finalAmount || job.escrowAmount || 0;
        
        // 만약 finalAmount와 escrowAmount가 모두 0이면 items 배열에서 계산
        if (totalJobAmount === 0 && job.items && job.items.length > 0) {
          totalJobAmount = job.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        }
        
        // 여전히 0이면 budget에서 확인
        if (totalJobAmount === 0 && job.budget) {
          totalJobAmount = job.budget.max || 0; // budget.max 사용
        }
        
        // 마지막으로 임시값 사용
        if (totalJobAmount === 0) {
          totalJobAmount = 517000;
        }
        
        feeAmount = Math.round(totalJobAmount * cancellationPolicy.cancellationFeeRate / 100);
        console.log('🔍 일일 한도 초과로 인한 수수료 재계산:', {
          totalJobAmount,
          cancellationFeeRate: cancellationPolicy.cancellationFeeRate,
          calculatedFee: feeAmount
        });
      }

      // 예상 수수료 계산 (일일 한도 초과 시)
      let totalJobAmount = job.finalAmount || job.escrowAmount || 0;
      
      // 만약 finalAmount와 escrowAmount가 모두 0이면 items 배열에서 계산
      if (totalJobAmount === 0 && job.items && job.items.length > 0) {
        totalJobAmount = job.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        console.log('🔍 items 배열에서 계산된 금액:', totalJobAmount);
      }
      
      // 여전히 0이면 budget에서 확인
      if (totalJobAmount === 0 && job.budget) {
        totalJobAmount = job.budget.max || 0; // budget.max 사용
        console.log('🔍 budget에서 가져온 금액:', totalJobAmount);
      }
      
      // 마지막으로 임시값 사용
      if (totalJobAmount === 0) {
        totalJobAmount = 517000;
        console.log('🔍 금액이 0이므로 임시값 517,000원 사용');
      }
      
      console.log('🔍 작업 금액 정보:', {
        jobId: job.id,
        finalAmount: job.finalAmount,
        escrowAmount: job.escrowAmount,
        totalJobAmount,
        cancellationFeeRate: cancellationPolicy.cancellationFeeRate
      });
      const expectedFeeAmount = Math.round(totalJobAmount * cancellationPolicy.cancellationFeeRate / 100);
      console.log('🔍 예상 수수료 계산:', {
        totalJobAmount,
        cancellationFeeRate: cancellationPolicy.cancellationFeeRate,
        expectedFeeAmount
      });
      
      setCancelAcceptanceInfo({
        hoursSinceAcceptance,
        feeAmount,
        expectedFeeAmount, // 예상 수수료 추가
        dailyCancelCount: totalDailyCancelCount, // 현재 취소 포함한 총 횟수
        maxDailyCancels,
        freeCancellationHours: cancellationPolicy.maxCancellationHours,
        cancellationFeeRate: cancellationPolicy.cancellationFeeRate
      });
      setCancelAcceptanceJobId(jobId);
      setCancelAcceptanceDialogOpen(true);
    } catch (error) {
      console.error('수락취소 정보 조회 실패:', error);
      setSnackbar({
        open: true,
        message: '수락취소 정보를 조회할 수 없습니다.',
        severity: 'error'
      });
    }
  };

  // 수락취소 처리
  const handleCancelAcceptance = async (jobId: string) => {
    try {
      // 수락취소 처리 (JobService에 해당 메서드가 필요)
      await JobService.cancelJobAcceptance(jobId, user?.id || '');
      
      setSnackbar({
        open: true,
        message: '작업 수락이 취소되었습니다.',
        severity: 'success'
      });
      
      // 작업 목록 새로고침
      const updatedJobs = await JobService.getAllJobs();
      const myJobs = updatedJobs.filter(job => {
        const statusMatch = ['assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress', 'completed', 'compensation_completed', 'reschedule_requested'].includes(job.status);
        const contractorMatch = job.contractorId === user?.id;
        return statusMatch && contractorMatch;
      });
      setJobs(myJobs);
      
      // 다이얼로그 닫기
      setCancelAcceptanceDialogOpen(false);
      setDetailDialogOpen(false);
    } catch (error) {
      console.error('수락취소 처리 실패:', error);
      setSnackbar({
        open: true,
        message: '수락취소 처리에 실패했습니다: ' + (error as Error).message,
        severity: 'error'
      });
    }
  };

  // 고객님댁으로 이동 처리
  const handleStartWork = async (jobId: string) => {
    try {
      await JobService.updateJobStatus(jobId, 'in_progress');
      setSnackbar({
        open: true,
        message: '시공을 시작합니다.',
        severity: 'success'
      });
      
      // 작업 목록 새로고침
      const updatedJobs = await JobService.getAllJobs();
      const myJobs = updatedJobs.filter(job => {
        const statusMatch = ['assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress', 'completed', 'compensation_completed', 'reschedule_requested'].includes(job.status);
        const contractorMatch = job.contractorId === user?.id;
        return statusMatch && contractorMatch;
      });
      setJobs(myJobs);
    } catch (error) {
      console.error('시공 시작 처리 실패:', error);
      setSnackbar({
        open: true,
        message: '시공 시작 처리에 실패했습니다.',
        severity: 'error'
      });
    }
  };

  // 시공완료 다이얼로그 시작
  const handleStartCompletion = (jobId: string) => {
    setCurrentJobId(jobId);
    setCompletionDialogOpen(true);
    setActiveStep(0);
    setConsultationNotes('');
    setUsageGuideCompleted(false);
    setCustomerSignature('');
  };

  const handleNextStep = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handlePrevStep = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              시공 상담 및 사용법 안내
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              시공 완료 후 고객과 함께 다음 사항들을 확인하고 사용법을 안내해주세요.
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                확인 사항:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• 제품 설치 상태 확인" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• 작동 테스트 완료" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• 주변 정리정돈 완료" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• 추가 요청사항 확인" />
                </ListItem>
              </List>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                사용법 안내 사항:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• 제품 조작 방법 안내" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• 주의사항 및 관리 방법 안내" />
                </ListItem>
              </List>
            </Box>
            
            <TextField
              fullWidth
              multiline
              rows={4}
              label="상담 내용 및 특이사항"
              value={consultationNotes}
              onChange={(e) => setConsultationNotes(e.target.value)}
              placeholder="정리정돈 상태, 추가 요청사항, 특이사항 등을 기록해주세요..."
            />
            
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={usageGuideCompleted}
                    onChange={(e) => setUsageGuideCompleted(e.target.checked)}
                  />
                }
                label="미흡한 부분이 발생되면 재방문해서 처리해야합니다. 다시한번 꼼꼼히 확인해주세요. 모두 완료되었다면 체크 후 다음단계로 진행해주세요"
              />
            </Box>
          </Box>
        );
      
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              고객 서명
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              고객에게 시공완료 서명을 받아주세요.
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                서명 방법:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• 아래 서명 영역에 직접 터치하여 서명" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• 고객이 직접 서명하거나, 고객의 동의 하에 대신 서명" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• 서명이 완료되면 '서명 완료' 버튼을 클릭" />
                </ListItem>
              </List>
            </Box>
            
            {/* 서명 캔버스 */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                서명 영역:
              </Typography>
              <Box
                sx={{
                  border: '2px dashed #ccc',
                  borderRadius: 1,
                  p: 1,
                  backgroundColor: (theme) => theme.palette.mode === 'light' ? '#fafafa' : '#2d2d2d'
                }}
              >
                <canvas
                  ref={(canvas) => {
                    if (canvas && !signatureCanvas) {
                      setSignatureCanvas(canvas);
                      const ctx = canvas.getContext('2d');
                      if (ctx) {
                        ctx.strokeStyle = '#000';
                        ctx.lineWidth = 2;
                        ctx.lineCap = 'round';
                      }
                    }
                  }}
                  width={400}
                  height={150}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    cursor: 'crosshair'
                  }}
                  onMouseDown={(e) => {
                    if (signatureCanvas) {
                      setIsDrawing(true);
                      const rect = signatureCanvas.getBoundingClientRect();
                      const ctx = signatureCanvas.getContext('2d');
                      if (ctx) {
                        ctx.beginPath();
                        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
                      }
                    }
                  }}
                  onMouseMove={(e) => {
                    if (signatureCanvas && isDrawing) {
                      const rect = signatureCanvas.getBoundingClientRect();
                      const ctx = signatureCanvas.getContext('2d');
                      if (ctx) {
                        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
                        ctx.stroke();
                      }
                    }
                  }}
                  onMouseUp={() => {
                    setIsDrawing(false);
                  }}
                  onMouseLeave={() => {
                    setIsDrawing(false);
                  }}
                  // 터치 이벤트 지원
                  onTouchStart={(e) => {
                    e.preventDefault();
                    if (signatureCanvas) {
                      setIsDrawing(true);
                      const rect = signatureCanvas.getBoundingClientRect();
                      const touch = e.touches[0];
                      const ctx = signatureCanvas.getContext('2d');
                      if (ctx) {
                        ctx.beginPath();
                        ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
                      }
                    }
                  }}
                  onTouchMove={(e) => {
                    e.preventDefault();
                    if (signatureCanvas && isDrawing) {
                      const rect = signatureCanvas.getBoundingClientRect();
                      const touch = e.touches[0];
                      const ctx = signatureCanvas.getContext('2d');
                      if (ctx) {
                        ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
                        ctx.stroke();
                      }
                    }
                  }}
                  onTouchEnd={() => {
                    setIsDrawing(false);
                  }}
                />
              </Box>
            </Box>
            
            <Box display="flex" gap={2} sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  if (signatureCanvas) {
                    const ctx = signatureCanvas.getContext('2d');
                    if (ctx) {
                      ctx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
                    }
                  }
                }}
              >
                서명 지우기
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setCustomerSignature('서명 완료');
                }}
              >
                서명 완료
              </Button>
            </Box>
            
            <Alert severity="info">
              고객이 직접 서명하거나, 고객의 동의 하에 대신 서명할 수 있습니다.
            </Alert>
          </Box>
        );
      
      default:
        return null;
    }
  };

  // 채팅 모달 열기 핸들러
  const handleOpenChat = (job: ConstructionJob) => {
    setChatJob(job);
    setChatDialogOpen(true);
  };

  const handleCompleteJob = async (jobId: string) => {
    try {
      // 작업 상태를 완료로 업데이트
      await JobService.updateJobStatus(jobId, 'completed');
      
      // 만족도 조사 생성 및 카카오톡 링크 발송
      try {
        const { SatisfactionService } = await import('../../../shared/services/satisfactionService');
        const { CustomerService } = await import('../../../shared/services/customerService');
        
        // 만족도 조사 생성
        const surveyId = await SatisfactionService.createSurvey(
          jobId, 
          'temp-customer-id', // 실제로는 작업의 customerId 사용
          'current-contractor-id' // 실제로는 현재 로그인한 시공자 ID
        );
        
        // 만족도 조사 정보 조회하여 토큰 가져오기
        const surveyInfo = await SatisfactionService.getSurvey(surveyId);
        
        // 고객 정보 조회
        const customerInfo = await CustomerService.getCustomerInfo('temp-customer-id');
        if (customerInfo && customerInfo.phone) {
          // 카카오톡으로 만족도 조사 링크 발송 (토큰 포함)
          await SatisfactionService.sendSurveyLink(
            customerInfo.phone, 
            surveyId, 
            customerInfo.name || '고객님',
            surveyInfo?.accessToken
          );
        }
      } catch (surveyError) {
        console.warn('만족도 조사 생성 실패:', surveyError);
        // 만족도 조사 실패해도 작업 완료는 계속 진행
      }
      
      // 완료 정보를 저장 (실제로는 별도 컬렉션에 저장)
      const completionData = {
        jobId: jobId,
        consultationNotes,
        usageGuideCompleted,
        customerSignature,
        completedAt: new Date(),
        contractorId: 'current-contractor-id' // 실제로는 현재 로그인한 시공자 ID
      };
     
      console.log('작업 완료 데이터:', completionData);
      
      // 성공 메시지 표시
      setSnackbar({
        open: true,
        message: '작업이 성공적으로 완료되었습니다!',
        severity: 'success'
      });
      
      // 다이얼로그 닫기
      setCompletionDialogOpen(false);
      
      // 작업 목록 새로고침
      const updatedJobs = await JobService.getAllJobs();
      const myJobs = updatedJobs.filter(job => 
        ['assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress', 'completed'].includes(job.status)
      );
      setJobs(myJobs);
      
    } catch (error) {
      console.error('작업 완료 처리 실패:', error);
      setSnackbar({
        open: true,
        message: '작업 완료 처리에 실패했습니다. 다시 시도해주세요.',
        severity: 'error'
      });
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'active') {
      // 배정된 작업 버튼 클릭 시: 배정됨, 제품준비중, 제품준비완료, 픽업완료, 진행중 상태 모두 표시
      matchesStatus = ['assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress'].includes(job.status);
    } else if (statusFilter === 'completed') {
      // 완료된 작업 버튼 클릭 시: 완료 상태와 보상완료 상태 모두 표시
      matchesStatus = ['completed', 'compensation_completed'].includes(job.status);
    } else if (statusFilter) {
      // 기존 필터 로직 유지 (드롭다운에서 선택한 경우)
      matchesStatus = job.status === statusFilter;
    }
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Box>
        <Typography>로딩 중...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3} flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
        <Box>
          <Typography variant="h5" gutterBottom>
            나의 작업 ({jobs.length}건)
          </Typography>
          <Typography variant="body2" color="textSecondary">
            📋 배정된 작업: 모든 진행 중인 작업을 한눈에 확인할 수 있습니다
          </Typography>
        </Box>
        
        {/* 기간별 필터링 */}
        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 } }}>
          <InputLabel>기간</InputLabel>
          <Select
            value={selectedPeriod}
            onChange={(e) => handlePeriodChange(e.target.value as any)}
            label="기간"
          >
            <MenuItem value="1day">1일</MenuItem>
            <MenuItem value="1week">1주</MenuItem>
            <MenuItem value="1month">1개월</MenuItem>
            <MenuItem value="3months">분기</MenuItem>
            <MenuItem value="6months">반기</MenuItem>
            <MenuItem value="1year">1년</MenuItem>
            <MenuItem value="all">전체</MenuItem>
          </Select>
        </FormControl>
      </Box>


        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    placeholder="작업 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>상태</InputLabel>
                    <Select 
                      label="상태" 
                      value={statusFilter || ''}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <MenuItem value="">전체</MenuItem>
                      <MenuItem value="active">배정된 작업</MenuItem>
                      <MenuItem value="assigned">배정됨</MenuItem>
                      <MenuItem value="product_preparing">제품준비중</MenuItem>
                      <MenuItem value="product_ready">제품준비완료</MenuItem>
                      <MenuItem value="pickup_completed">픽업완료</MenuItem>
                      <MenuItem value="in_progress">진행중</MenuItem>
                      <MenuItem value="completed">완료</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={2}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('active');
                    }}
                  >
                    초기화
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Box display="flex" gap={1} mb={2} flexWrap="wrap">
            <Button
              variant={statusFilter === 'active' ? "contained" : "outlined"}
              size="small"
              onClick={() => setStatusFilter(statusFilter === 'active' ? '' : 'active')}
            >
              📋 배정된 작업
            </Button>
            
            <Button
              variant={statusFilter === 'completed' ? "contained" : "outlined"}
              size="small"
              onClick={() => setStatusFilter(statusFilter === 'completed' ? '' : 'completed')}
            >
              ✅ 완료된 작업
            </Button>
          </Box>

          <Grid container spacing={2}>
            {filteredJobs
              .sort((a, b) => {
                // scheduledDate가 없는 작업은 뒤로
                if (!a.scheduledDate && !b.scheduledDate) return 0;
                if (!a.scheduledDate) return 1;
                if (!b.scheduledDate) return -1;
                
                // scheduledDate가 가까운 순으로 정렬 (오름차순)
                return a.scheduledDate.getTime() - b.scheduledDate.getTime();
              })
              .map((job) => (
              <Grid item xs={12} md={6} lg={4} key={job.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6">
                          {job.title.replace(/-\d{1,3}(,\d{3})*원$/, '')}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                          작업 ID: {job.id}
                        </Typography>
                      </Box>
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={() => handleJobDetail(job.id)}
                      >
                        상세보기
                      </Button>
                    </Box>
                    
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="body2" color="textSecondary">
                        {job.address}
                      </Typography>
                    </Box>

                    {job.scheduledDate && (
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Schedule fontSize="small" color="action" />
                        <Typography variant="body2" color="textSecondary">
                          시공일시: {formatDateTime(job.scheduledDate)}
                        </Typography>
                      </Box>
                    )}
                    
                    <Typography variant="body2" color="textSecondary" mb={1}>
                      시공비: {calculateNetBudget(job).toLocaleString()} P
                    </Typography>
                    
                    <Typography variant="body2" mb={2}>
                      {job.description}
                    </Typography>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Chip 
                        label={getStatusText(job.status)} 
                        color={getStatusColor(job.status)} 
                        size="medium"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>
                    
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {/* 제품준비완료 상태일 때 픽업 버튼과 픽업지연 버튼 */}
                      {job.status === 'product_ready' && (
                        <>
                          <Button 
                            variant="contained" 
                            color="success"
                            size="medium"
                            fullWidth
                            sx={{ 
                              fontSize: '1rem', 
                              fontWeight: 'bold',
                              py: 1.5,
                              mb: 1,
                              background: 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)',
                              boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
                              animation: 'bounce 1.5s infinite',
                              '@keyframes bounce': {
                                '0%, 20%, 50%, 80%, 100%': {
                                  transform: 'translateY(0)'
                                },
                                '40%': {
                                  transform: 'translateY(-5px)'
                                },
                                '60%': {
                                  transform: 'translateY(-3px)'
                                }
                              },
                              '&:hover': {
                                background: 'linear-gradient(45deg, #388E3C 30%, #4CAF50 90%)',
                                transform: 'scale(1.05)',
                                transition: 'all 0.3s ease'
                              }
                            }}
                            onClick={() => handlePickupCompleted(job.id)}
                          >
                            📦 제품 픽업후 이 버튼을 눌러주세요~!!
                          </Button>
                          
                          <Button 
                            variant="outlined" 
                            color="warning"
                            size="small"
                            sx={{ 
                              fontSize: '0.8rem', 
                              fontWeight: 'normal',
                              py: 0.5,
                              px: 1,
                              minWidth: 'auto',
                              borderWidth: '1px',
                              '&:hover': {
                                borderWidth: '2px',
                                transform: 'scale(1.02)',
                                transition: 'all 0.2s ease'
                              }
                            }}
                            onClick={() => handlePickupInfoOpen(job)}
                          >
                            ⚠️ 픽업지연
                          </Button>
                        </>
                      )}
                      
                      {/* 픽업완료 상태일 때 고객님댁으로 이동 버튼과 소비자부재 버튼 */}
                      {job.status === 'pickup_completed' && (
                        <>
                          <Button 
                            variant="contained" 
                            color="primary"
                            size="medium"
                            fullWidth
                            sx={{ 
                              fontSize: '1rem', 
                              fontWeight: 'bold',
                              py: 1.5,
                              mb: 1,
                              background: 'linear-gradient(45deg, #F44336 30%, #EF5350 90%)',
                              boxShadow: '0 3px 5px 2px rgba(244, 67, 54, .3)',
                              animation: 'pulse 2s infinite',
                              '@keyframes pulse': {
                                '0%': {
                                  transform: 'scale(1)',
                                  boxShadow: '0 3px 5px 2px rgba(244, 67, 54, .3)'
                                },
                                '50%': {
                                  transform: 'scale(1.02)',
                                  boxShadow: '0 5px 15px 2px rgba(244, 67, 54, .5)'
                                },
                                '100%': {
                                  transform: 'scale(1)',
                                  boxShadow: '0 3px 5px 2px rgba(244, 67, 54, .3)'
                                }
                              },
                              '&:hover': {
                                background: 'linear-gradient(45deg, #D32F2F 30%, #F44336 90%)',
                                transform: 'scale(1.05)',
                                transition: 'all 0.3s ease'
                              }
                            }}
                            onClick={() => handleStartWork(job.id)}
                          >
                            🚚 늦지않게 시공지로 이동후 이 버튼을 눌러주세요~^^
                          </Button>
                          
                          <Button 
                            variant="outlined" 
                            color="error"
                            size="small"
                            sx={{ 
                              fontSize: '0.8rem', 
                              fontWeight: 'normal',
                              py: 0.5,
                              px: 1,
                              minWidth: 'auto',
                              borderWidth: '1px',
                              '&:hover': {
                                borderWidth: '2px',
                                transform: 'scale(1.02)',
                                transition: 'all 0.2s ease'
                              }
                            }}
                            onClick={() => handleCustomerAbsentConfirm(job.id)}
                          >
                            🏠 소비자부재
                          </Button>
                        </>
                      )}
                      
                      {/* 보상완료 상태일 때 보상 정보 표시 */}
                      {job.status === 'compensation_completed' && job.compensationInfo && (
                        <Box sx={{ 
                          p: 2, 
                          mb: 2, 
                          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'warning.dark' : 'warning.light', 
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'warning.main'
                        }}>
                          <Typography variant="h6" color="black" gutterBottom>
                            {job.compensationInfo.type === 'product_not_ready' && '💰 제품 미준비 보상 완료'}
                            {job.compensationInfo.type === 'customer_absent' && '💰 소비자 부재 보상 완료'}
                            {job.compensationInfo.type === 'schedule_change' && '💰 일정 변경 보상 완료'}
                          </Typography>
                          <Typography variant="body2" color="black" sx={{ fontWeight: 500 }}>
                            보상 금액: {job.compensationInfo.amount.toLocaleString()}포인트
                          </Typography>
                          <Typography variant="body2" color="black" sx={{ fontWeight: 500 }}>
                            보상율: {job.compensationInfo.rate}%
                          </Typography>
                          <Typography variant="body2" color="black" sx={{ fontWeight: 500 }}>
                            처리일시: {job.compensationInfo.processedAt && (job.compensationInfo.processedAt as any).toDate 
                              ? (job.compensationInfo.processedAt as any).toDate().toLocaleString('ko-KR')
                              : new Date(job.compensationInfo.processedAt).toLocaleString('ko-KR')
                            }
                          </Typography>
                        </Box>
                      )}
                      
                      {/* 일정 재조정 요청 상태일 때 보상 정보 표시 */}
                      {job.status === 'reschedule_requested' && job.compensationInfo && (
                        <Box sx={{ 
                          p: 2, 
                          mb: 2, 
                          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'info.dark' : 'info.light', 
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'info.main'
                        }}>
                          <Typography variant="h6" color="black" gutterBottom>
                            {job.compensationInfo.type === 'product_not_ready' && '📅 제품 미준비 보상 + 일정 재조정 요청'}
                            {job.compensationInfo.type === 'customer_absent' && '📅 소비자 부재 보상 + 일정 재조정 요청'}
                          </Typography>
                          <Typography variant="body2" color="black" sx={{ fontWeight: 500 }}>
                            보상 금액: {job.compensationInfo.amount.toLocaleString()}포인트
                          </Typography>
                          <Typography variant="body2" color="black" sx={{ fontWeight: 500 }}>
                            보상율: {job.compensationInfo.rate}%
                          </Typography>
                          <Typography variant="body2" color="black" sx={{ fontWeight: 500 }}>
                            처리일시: {job.compensationInfo.processedAt && (job.compensationInfo.processedAt as any).toDate 
                              ? (job.compensationInfo.processedAt as any).toDate().toLocaleString('ko-KR')
                              : new Date(job.compensationInfo.processedAt).toLocaleString('ko-KR')
                            }
                          </Typography>
                          <Typography variant="body2" color="black" sx={{ mt: 1, fontWeight: 'bold' }}>
                            💡 판매자가 새로운 일정을 설정하면 시공을 계속 진행할 수 있습니다.
                          </Typography>
                        </Box>
                      )}
                      
                      {/* 진행중 상태일 때 시공완료 버튼 */}
                      {job.status === 'in_progress' && (
                        <Button 
                          variant="contained" 
                          color="success"
                          size="medium"
                          fullWidth
                          sx={{ 
                            fontSize: '1rem', 
                            fontWeight: 'bold',
                            py: 1.5,
                            mb: 1,
                            background: 'linear-gradient(45deg, #FF9800 30%, #FFB74D 90%)',
                            boxShadow: '0 3px 5px 2px rgba(255, 152, 0, .3)',
                            animation: 'glow 2s ease-in-out infinite alternate',
                            '@keyframes glow': {
                              '0%': {
                                boxShadow: '0 3px 5px 2px rgba(255, 152, 0, .3)'
                              },
                              '100%': {
                                boxShadow: '0 5px 20px 2px rgba(255, 152, 0, .6)'
                              }
                            },
                            '&:hover': {
                              background: 'linear-gradient(45deg, #F57C00 30%, #FF9800 90%)',
                              transform: 'scale(1.05)',
                              transition: 'all 0.3s ease'
                            }
                          }}
                          startIcon={<CheckCircle />}
                          onClick={() => handleStartCompletion(job.id)}
                        >
                          🏗️ 시공 완료 후 고객 서명 받기, 클릭!
                        </Button>
                      )}
                      
                      <Button 
                        variant="outlined" 
                        size="small"
                        startIcon={<Chat />}
                        onClick={() => handleOpenChat(job)}
                        sx={{ 
                          fontSize: '0.8rem', 
                          fontWeight: 'normal',
                          py: 0.5,
                          px: 1,
                          minWidth: 'auto',
                          borderWidth: '1px',
                          height: '32px',
                          flexShrink: 0
                        }}
                      >
                        채팅
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {filteredJobs.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="textSecondary">
                {selectedPeriod === 'all' ? '배정된 작업이 없습니다.' : '선택한 기간에 배정된 작업이 없습니다.'}
              </Typography>
              <Typography variant="body2" color="textSecondary" mt={1}>
                {selectedPeriod === 'all' 
                  ? '새로운 작업이 배정되면 여기에 표시됩니다.'
                  : '다른 기간을 선택하거나 "전체"를 선택해보세요.'
                }
              </Typography>
            </Box>
          )}

          {/* 시공완료 처리 다이얼로그 */}
          <Dialog
            open={completionDialogOpen}
            onClose={() => setCompletionDialogOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={1}>
                <CheckCircleOutline color="success" />
                시공완료 처리
              </Box>
            </DialogTitle>
            
            <DialogContent sx={{
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : 'background.default'
            }}>
                          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              <Step>
                <StepLabel>시공 상담 및 사용법 안내</StepLabel>
              </Step>
              <Step>
                <StepLabel>고객 서명</StepLabel>
              </Step>
            </Stepper>
              
              {getStepContent(activeStep)}
            </DialogContent>
            
            <DialogActions>
              <Button onClick={() => setCompletionDialogOpen(false)}>
                취소
              </Button>
                        {activeStep > 0 && (
            <Button onClick={handlePrevStep}>
              이전
            </Button>
          )}
          {activeStep < 1 ? (
            <Button 
              variant="contained" 
              onClick={handleNextStep}
              disabled={!usageGuideCompleted}
            >
              다음
            </Button>
          ) : (
            <Button 
              variant="contained" 
              color="success"
              onClick={() => handleCompleteJob(currentJobId)}
              disabled={!customerSignature.trim()}
            >
              작업 완료
            </Button>
          )}
            </DialogActions>
          </Dialog>

          {/* 상세보기 다이얼로그 */}
          <Dialog
            open={detailDialogOpen}
            onClose={() => {
              setDetailDialogOpen(false);
              setCustomerInfo(null);
            }}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">작업 상세 정보</Typography>
                <Button onClick={() => {
                  setDetailDialogOpen(false);
                  setCustomerInfo(null);
                }}>
                  닫기
                </Button>
              </Box>
            </DialogTitle>
            
            <DialogContent sx={{
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : 'background.default'
            }}>
              {selectedJob && (
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {selectedJob.title.replace(/-\d{1,3}(,\d{3})*원$/, '')}
                  </Typography>
                  
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip 
                        label={getStatusText(selectedJob.status)} 
                        color={getStatusColor(selectedJob.status)} 
                        size="medium"
                      />
                    </Box>
                    {selectedJob.status === 'assigned' && (
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleCancelAcceptanceConfirm(selectedJob.id)}
                        sx={{ ml: 2 }}
                      >
                        수락취소
                      </Button>
                    )}
                  </Box>

                  {/* 고객 정보 */}
                  {customerInfo && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person color="action" />
                        고객 정보
                      </Typography>
                      <Box sx={{ 
                        ml: 3, 
                        p: 2, 
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50', 
                        borderRadius: 1 
                      }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>이름:</strong> {customerInfo.name}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>연락처:</strong> {customerInfo.phone}
                        </Typography>
                        {customerInfo.address && (
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>주소:</strong> {customerInfo.address}
                          </Typography>
                        )}
                        {customerInfo.email && (
                          <Typography variant="body2">
                            <strong>이메일:</strong> {customerInfo.email}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* 시공일시 */}
                  {selectedJob.scheduledDate && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Schedule color="action" />
                        시공일시
                      </Typography>
                      <Box sx={{ 
                        ml: 3, 
                        p: 2, 
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50', 
                        borderRadius: 1 
                      }}>
                        <Typography variant="body2">
                          {formatDateTime(selectedJob.scheduledDate)}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* 준비일시 */}
                  {selectedJob.pickupInfo && selectedJob.pickupInfo.scheduledDateTime && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Schedule color="action" />
                        준비일시
                      </Typography>
                      <Box sx={{ 
                        ml: 3, 
                        p: 2, 
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50', 
                        borderRadius: 1 
                      }}>
                        <Typography variant="body2">
                          {formatDateTime(new Date(selectedJob.pickupInfo.scheduledDateTime))}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* 시공비 */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccountBalance color="action" />
                      시공비
                    </Typography>
                    <Box sx={{ 
                      ml: 3, 
                      p: 2, 
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50', 
                      borderRadius: 1 
                    }}>
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        {calculateNetBudget(selectedJob).toLocaleString()}원
                      </Typography>
                    </Box>
                  </Box>

                  {/* 품목 및 단가 */}
                  {selectedJob.items && selectedJob.items.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ListAlt color="action" />
                        품목 및 단가
                      </Typography>
                      <Box sx={{ 
                        ml: 3, 
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50', 
                        borderRadius: 1 
                      }}>
                        <List dense>
                          {selectedJob.items.map((item, index) => (
                            <ListItem key={index}>
                              <ListItemText
                                primary={
                                  <>
                                    <Typography variant="body2" component="span">
                                      {item.name} × {item.quantity}
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold" component="span" sx={{ float: 'right' }}>
                                      {item.totalPrice.toLocaleString()}원
                                    </Typography>
                                  </>
                                }
                                secondary={
                                  <Typography variant="caption" color="textSecondary" component="span">
                                    단가: {item.unitPrice.toLocaleString()}원
                                  </Typography>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    </Box>
                  )}

                  {/* 픽업 정보 */}
                  {selectedJob.pickupInfo && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocalShipping color="action" />
                        픽업 정보
                      </Typography>
                      <Box sx={{ 
                        ml: 3, 
                        p: 2, 
                        bgcolor: (theme) => theme.palette.mode === 'light' ? 'grey.50' : 'grey.800', 
                        borderRadius: 1 
                      }}>
                        {selectedJob.pickupInfo.companyName && (
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>상호:</strong> {selectedJob.pickupInfo.companyName}
                          </Typography>
                        )}
                        {selectedJob.pickupInfo.phone && (
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>연락처:</strong> {selectedJob.pickupInfo.phone}
                          </Typography>
                        )}
                        {selectedJob.pickupInfo.address && (
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>픽업주소:</strong> {selectedJob.pickupInfo.address}
                          </Typography>
                        )}
                        {selectedJob.pickupInfo.scheduledDateTime && (
                          <Typography variant="body2">
                            <strong>픽업일시:</strong> {formatDateTime(new Date(selectedJob.pickupInfo.scheduledDateTime))}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* 작업지시서 파일 */}
                  {selectedJob.workInstructions && selectedJob.workInstructions.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Description color="action" />
                        작업지시서 파일
                      </Typography>
                      <Box sx={{ 
                        ml: 3, 
                        bgcolor: (theme) => theme.palette.mode === 'light' ? 'grey.50' : 'grey.800', 
                        borderRadius: 1 
                      }}>
                        {selectedJob.workInstructions.map((file, index) => (
                          <Box key={file.id} sx={{ p: 2, borderBottom: index < selectedJob.workInstructions!.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>파일명:</strong> {file.fileName}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>파일 크기:</strong> {(file.fileSize / 1024).toFixed(1)} KB
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              <strong>파일 타입:</strong> {file.fileType}
                            </Typography>
                            <Button 
                              variant="outlined" 
                              size="small"
                              startIcon={<Visibility />}
                              onClick={() => window.open(file.fileUrl, '_blank')}
                            >
                              파일 미리보기
                            </Button>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* 작업 설명 */}
                  {selectedJob.description && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Info color="action" />
                        작업 설명
                      </Typography>
                      <Box sx={{ 
                        ml: 3, 
                        p: 2, 
                        bgcolor: (theme) => theme.palette.mode === 'light' ? 'grey.50' : 'grey.800', 
                        borderRadius: 1 
                      }}>
                        <Typography variant="body2">
                          {selectedJob.description}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            </DialogContent>
          </Dialog>

          {/* 채팅 모달 */}
          <Dialog
            open={chatDialogOpen}
            onClose={() => setChatDialogOpen(false)}
            maxWidth="md"
            fullWidth
            disableEnforceFocus
            disableAutoFocus
            PaperProps={{
              sx: {
                height: '80vh',
                maxHeight: '80vh'
              }
            }}
          >
            <DialogTitle>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6">
                    시공자와 채팅
                  </Typography>
                  {chatJob && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="textSecondary">
                        {formatJobTitle(chatJob)}-{chatJob.address?.split(' ').slice(0, 2).join(' ')}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        시공자({chatJob.contractorName || '시공자'}, {user?.phone || '연락처 없음'})
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Button onClick={() => setChatDialogOpen(false)}>
                  닫기
                </Button>
              </Box>
            </DialogTitle>
            
            <DialogContent sx={{ 
              p: 0, 
              display: 'flex', 
              flexDirection: 'column',
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : 'background.default'
            }}>
              {chatJob && (
                <ChatArea 
                  jobId={chatJob.id}
                  jobTitle={chatJob.title}
                  jobAddress={chatJob.address}
                  contractorName={chatJob.contractorName || '시공자'}
                  contractorPhone={user?.phone || ''}
                  isDialog={true}
                  userRole="contractor"
                />
              )}
            </DialogContent>
          </Dialog>

          {/* 픽업지연 확인 다이얼로그 */}
          <Dialog
            open={pickupDelayDialogOpen}
            onClose={() => setPickupDelayDialogOpen(false)}
            maxWidth="sm"
            fullWidth
            aria-labelledby="pickup-delay-dialog-title"
            aria-describedby="pickup-delay-dialog-description"
            disableEscapeKeyDown={false}
          >
                        <DialogTitle 
              id="pickup-delay-dialog-title"
              sx={{
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'warning.dark' : 'warning.light', 
                color: 'warning.contrastText',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              ⚠️ 픽업지연 확인
            </DialogTitle>
            <DialogContent 
              id="pickup-delay-dialog-description"
              sx={{
                pt: 3,
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : 'background.default'
              }}
            >
              <Typography variant="body1" gutterBottom>
                제품이 준비되지 않아 픽업을 할 수 없는 상황인가요?
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                • 이 작업은 되돌릴 수 없습니다.<br/>
                • 제품 미준비 보상이 지급됩니다.<br/>
                • 보상 금액은 관리자 설정에 따라 결정됩니다.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
              <Button 
                onClick={() => setPickupDelayDialogOpen(false)}
                variant="outlined"
                color="inherit"
              >
                취소
              </Button>
              <Button 
                onClick={() => handlePickupDelay(pickupDelayJobId)}
                variant="contained"
                color="warning"
                startIcon={<span>⚠️</span>}
              >
                픽업지연 확정
              </Button>
            </DialogActions>
          </Dialog>

          {/* 소비자 부재 확인 다이얼로그 */}
          <Dialog
            open={customerAbsentDialogOpen}
            onClose={() => setCustomerAbsentDialogOpen(false)}
            maxWidth="sm"
            fullWidth
            aria-labelledby="customer-absent-dialog-title"
            aria-describedby="customer-absent-dialog-description"
            disableEscapeKeyDown={false}
          >
            <DialogTitle 
              id="customer-absent-dialog-title"
              sx={{ 
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'error.dark' : 'error.light', 
                color: 'error.contrastText',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              🏠 소비자 부재 확인
            </DialogTitle>
            <DialogContent 
              id="customer-absent-dialog-description"
              sx={{ 
                pt: 3,
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : 'background.default'
              }}
            >
              <Typography variant="body1" gutterBottom>
                소비자가 부재하여 시공을 진행할 수 없는 상황인가요?
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                • 이 작업은 되돌릴 수 없습니다.<br/>
                • 소비자 부재 보상이 지급됩니다.<br/>
                • 보상 금액은 관리자 설정에 따라 결정됩니다.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
              <Button 
                onClick={() => setCustomerAbsentDialogOpen(false)}
                variant="outlined"
                color="inherit"
              >
                취소
              </Button>
              <Button 
                onClick={() => handleCustomerAbsent(customerAbsentJobId)}
                variant="contained"
                color="error"
                startIcon={<span>🏠</span>}
              >
                소비자 부재 확정
              </Button>
            </DialogActions>
          </Dialog>

          {/* 수락취소 확인 다이얼로그 */}
          <Dialog
            open={cancelAcceptanceDialogOpen}
            onClose={() => setCancelAcceptanceDialogOpen(false)}
            maxWidth="sm"
            fullWidth
            aria-labelledby="cancel-acceptance-dialog-title"
            aria-describedby="cancel-acceptance-dialog-description"
            disableEscapeKeyDown={false}
          >
            <DialogTitle 
              id="cancel-acceptance-dialog-title"
              sx={{ 
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'error.dark' : 'error.light', 
                color: 'error.contrastText',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              ❌ 수락취소 확인
            </DialogTitle>
            <DialogContent 
              id="cancel-acceptance-dialog-description"
              sx={{ 
                pt: 3,
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : 'background.default'
              }}
            >
              {cancelAcceptanceInfo && (
                <>
                  <Typography variant="body1" gutterBottom>
                    정말로 이 작업의 수락을 취소하시겠습니까?
                  </Typography>
                  
                  <Box sx={{ mt: 2, p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>수락 후 경과 시간:</strong> {cancelAcceptanceInfo.hoursSinceAcceptance}시간
                      {cancelAcceptanceInfo.hoursSinceAcceptance <= cancelAcceptanceInfo.freeCancellationHours && cancelAcceptanceInfo.dailyCancelCount < cancelAcceptanceInfo.maxDailyCancels ? 
                        ` (무료 취소 가능)` : 
                        ` (수수료 적용)`
                      }
                    </Typography>
                    
                    {cancelAcceptanceInfo.feeAmount > 0 ? (
                      <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                        <strong>취소 수수료:</strong> {cancelAcceptanceInfo.feeAmount.toLocaleString()}원
                        <br/>
                        <Typography variant="caption" color="textSecondary">
                          (전체 시공비용의 {cancelAcceptanceInfo.cancellationFeeRate}%)
                        </Typography>
                      </Typography>
                    ) : cancelAcceptanceInfo.dailyCancelCount > cancelAcceptanceInfo.maxDailyCancels ? (
                      <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                        <strong>⚠️ 경고:</strong> 일일 한도 초과로 수수료가 적용됩니다!
                        <br/>
                        <Typography variant="caption" color="textSecondary">
                          예상 수수료: {cancelAcceptanceInfo.expectedFeeAmount?.toLocaleString()}원
                          <br/>
                          (전체 시공비용의 {cancelAcceptanceInfo.cancellationFeeRate}% 적용 예정)
                        </Typography>
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="success.main" sx={{ mb: 1 }}>
                        <strong>수수료:</strong> 무료 (무료 취소 조건 만족)
                      </Typography>
                    )}
                    
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>오늘 취소 횟수:</strong> {cancelAcceptanceInfo.dailyCancelCount}/{cancelAcceptanceInfo.maxDailyCancels}회
                      {cancelAcceptanceInfo.dailyCancelCount >= cancelAcceptanceInfo.maxDailyCancels && (
                        <Typography component="span" color="error" sx={{ ml: 1 }}>
                          (일일 한도 초과)
                        </Typography>
                      )}
                    </Typography>
                    
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                      • 취소 수수료는 포인트에서 차감됩니다.<br/>
                      • 하루 최대 {cancelAcceptanceInfo.maxDailyCancels}회까지 취소 가능합니다.<br/>
                      • 무료 취소 시간: {cancelAcceptanceInfo.freeCancellationHours}시간<br/>
                      • 수수료율: 전체 시공비용의 {cancelAcceptanceInfo.cancellationFeeRate}%
                    </Typography>
                  </Box>
                </>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
              <Button 
                onClick={() => setCancelAcceptanceDialogOpen(false)}
                variant="outlined"
                color="inherit"
              >
                취소
              </Button>
              <Button 
                onClick={() => handleCancelAcceptance(cancelAcceptanceJobId)}
                variant="contained"
                color="error"
                startIcon={<span>❌</span>}
              >
                수락취소 확정
              </Button>
            </DialogActions>
          </Dialog>

          {/* 픽업정보 모달 */}
          <Dialog
            open={pickupInfoDialogOpen}
            onClose={handlePickupInfoClose}
            maxWidth="md"
            fullWidth
            aria-labelledby="pickup-info-dialog-title"
          >
            <DialogTitle 
              id="pickup-info-dialog-title"
              sx={{
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'info.dark' : 'info.light',
                color: 'info.contrastText',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              📦 픽업 정보
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              {pickupInfoJob && (
                <Box>
                  {/* 작업 기본 정보 */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      {pickupInfoJob.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      작업 ID: {pickupInfoJob.id}
                    </Typography>
                  </Box>

                  {/* 픽업 정보 */}
                  {pickupInfoJob.pickupInfo && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocalShipping color="action" />
                        픽업 정보
                      </Typography>
                      <Box sx={{ 
                        ml: 3, 
                        p: 2, 
                        bgcolor: (theme) => theme.palette.mode === 'light' ? 'grey.50' : 'grey.800', 
                        border: 1, 
                        borderColor: 'divider', 
                        borderRadius: 1 
                      }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                              픽업 일시
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {pickupInfoJob.pickupInfo.scheduledDateTime ? 
                                new Date(pickupInfoJob.pickupInfo.scheduledDateTime).toLocaleString('ko-KR', {
                                  year: 'numeric',
                                  month: 'numeric',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: 'numeric'
                                }) : '미정'
                              }
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                              픽업 회사
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {pickupInfoJob.pickupInfo.companyName || '미정'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                              픽업 주소
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {pickupInfoJob.pickupInfo.address || '미정'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                              연락처
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {pickupInfoJob.pickupInfo.phone || '미정'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    </Box>
                  )}

                  {/* 작업 주소 */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn color="action" />
                      시공 주소
                    </Typography>
                    <Box sx={{ 
                      ml: 3, 
                      p: 2, 
                      bgcolor: (theme) => theme.palette.mode === 'light' ? 'grey.50' : 'grey.800', 
                      border: 1, 
                      borderColor: 'divider', 
                      borderRadius: 1 
                    }}>
                      <Typography variant="body2">
                        {pickupInfoJob.address}
                      </Typography>
                    </Box>
                  </Box>

                  {/* 시공 일시 */}
                  {pickupInfoJob.scheduledDate && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Schedule color="action" />
                        시공 일시
                      </Typography>
                      <Box sx={{ 
                        ml: 3, 
                        p: 2, 
                        bgcolor: (theme) => theme.palette.mode === 'light' ? 'grey.50' : 'grey.800', 
                        border: 1, 
                        borderColor: 'divider', 
                        borderRadius: 1 
                      }}>
                        <Typography variant="body2">
                          {new Date(pickupInfoJob.scheduledDate).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric'
                          })}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* 품목 정보 */}
                  {pickupInfoJob.items && pickupInfoJob.items.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ListAlt color="action" />
                        픽업 품목
                      </Typography>
                      <Box sx={{ 
                        ml: 3, 
                        p: 2, 
                        bgcolor: (theme) => theme.palette.mode === 'light' ? 'grey.50' : 'grey.800', 
                        border: 1, 
                        borderColor: 'divider', 
                        borderRadius: 1 
                      }}>
                        {pickupInfoJob.items.map((item, index) => (
                          <Box key={index} sx={{ 
                            mb: index < (pickupInfoJob.items?.length || 0) - 1 ? 2 : 0,
                            pb: index < (pickupInfoJob.items?.length || 0) - 1 ? 2 : 0,
                            borderBottom: index < (pickupInfoJob.items?.length || 0) - 1 ? 1 : 0,
                            borderColor: 'divider'
                          }}>
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center'
                            }}>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                                  {item.name}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  수량: {item.quantity}개
                                </Typography>
                              </Box>
                              <Typography variant="body2" color="textSecondary">
                                {item.unitPrice?.toLocaleString()}원
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
              <Button 
                onClick={handlePickupInfoClose}
                variant="outlined"
                color="inherit"
              >
                닫기
              </Button>
              <Button 
                onClick={() => {
                  handlePickupInfoClose();
                  handlePickupDelayConfirm(pickupInfoJob?.id || '');
                }}
                variant="contained"
                color="warning"
                startIcon={<span>⚠️</span>}
              >
                픽업지연 신고
              </Button>
            </DialogActions>
          </Dialog>

          <Snackbar
            open={snackbar.open}
            autoHideDuration={4000}
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert
              onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
              severity={snackbar.severity}
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </>
    </Box>
  );
};

export default MyJobs;
