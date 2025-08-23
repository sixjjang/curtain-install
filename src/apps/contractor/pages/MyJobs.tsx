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
  Paper,
  ToggleButtonGroup,
  ToggleButton
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
import { ConstructionJob } from '../../../types';
import { useAuth } from '../../../shared/contexts/AuthContext';
import ChatArea from '../../seller/components/ChatArea';


const MyJobs: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<ConstructionJob[]>([]);
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
  
  // 소비자 부재 확인 다이얼로그 관련 상태
  const [customerAbsentDialogOpen, setCustomerAbsentDialogOpen] = useState(false);
  const [customerAbsentJobId, setCustomerAbsentJobId] = useState<string>('');

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

  const calculateTotalPrice = (job: ConstructionJob) => {
    if (!job.items || job.items.length === 0) {
      return 0;
    }
    return job.items.reduce((total, item) => total + item.totalPrice, 0);
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
        
        // 고객 정보 조회
        const customerInfo = await CustomerService.getCustomerInfo('temp-customer-id');
        if (customerInfo && customerInfo.phone) {
          // 카카오톡으로 만족도 조사 링크 발송
          await SatisfactionService.sendSurveyLink(
            customerInfo.phone, 
            surveyId, 
            customerInfo.name || '고객님'
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
      // 완료된 작업 버튼 클릭 시: 완료 상태만 표시
      matchesStatus = job.status === 'completed';
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            나의 작업 ({jobs.length}건)
          </Typography>
          <Typography variant="body2" color="textSecondary">
            📋 배정된 작업: 모든 진행 중인 작업을 한눈에 확인할 수 있습니다
          </Typography>
        </Box>
        
        {/* 기간별 필터링 */}
        <ToggleButtonGroup
          value={selectedPeriod}
          exclusive
          onChange={(e, newPeriod) => {
            if (newPeriod !== null) {
              handlePeriodChange(newPeriod);
            }
          }}
          size="small"
        >
          <ToggleButton value="1day">1일</ToggleButton>
          <ToggleButton value="1week">1주</ToggleButton>
          <ToggleButton value="1month">1개월</ToggleButton>
          <ToggleButton value="3months">분기</ToggleButton>
          <ToggleButton value="6months">반기</ToggleButton>
          <ToggleButton value="1year">1년</ToggleButton>
          <ToggleButton value="all">전체</ToggleButton>
        </ToggleButtonGroup>
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
                        <Typography variant="caption" color="textSecondary">
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
                      총 금액: {calculateTotalPrice(job).toLocaleString()}원
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
                            onClick={() => handlePickupDelayConfirm(job.id)}
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
                          bgcolor: 'warning.light', 
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'warning.main'
                        }}>
                          <Typography variant="h6" color="warning.dark" gutterBottom>
                            {job.compensationInfo.type === 'product_not_ready' && '💰 제품 미준비 보상 완료'}
                            {job.compensationInfo.type === 'customer_absent' && '💰 소비자 부재 보상 완료'}
                            {job.compensationInfo.type === 'schedule_change' && '💰 일정 변경 보상 완료'}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            보상 금액: {job.compensationInfo.amount.toLocaleString()}포인트
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            보상율: {job.compensationInfo.rate}%
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            처리일시: {job.compensationInfo.processedAt.toLocaleString('ko-KR')}
                          </Typography>
                        </Box>
                      )}
                      
                      {/* 일정 재조정 요청 상태일 때 보상 정보 표시 */}
                      {job.status === 'reschedule_requested' && job.compensationInfo && (
                        <Box sx={{ 
                          p: 2, 
                          mb: 2, 
                          bgcolor: 'info.light', 
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'info.main'
                        }}>
                          <Typography variant="h6" color="info.dark" gutterBottom>
                            {job.compensationInfo.type === 'product_not_ready' && '📅 제품 미준비 보상 + 일정 재조정 요청'}
                            {job.compensationInfo.type === 'customer_absent' && '📅 소비자 부재 보상 + 일정 재조정 요청'}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            보상 금액: {job.compensationInfo.amount.toLocaleString()}포인트
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            보상율: {job.compensationInfo.rate}%
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            처리일시: {job.compensationInfo.processedAt.toLocaleString('ko-KR')}
                          </Typography>
                          <Typography variant="body2" color="info.dark" sx={{ mt: 1, fontWeight: 'bold' }}>
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
                  
                  <Box display="flex" alignItems="center" gap={1} mb={3}>
                    <Chip 
                      label={getStatusText(selectedJob.status)} 
                      color={getStatusColor(selectedJob.status)} 
                      size="medium"
                    />
                  </Box>

                  {/* 고객 정보 */}
                  {customerInfo && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person color="action" />
                        고객 정보
                      </Typography>
                      <Box sx={{ ml: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
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
                      <Box sx={{ ml: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
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
                      <Box sx={{ ml: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body2">
                          {formatDateTime(new Date(selectedJob.pickupInfo.scheduledDateTime))}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* 총 금액 */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccountBalance color="action" />
                      총 금액
                    </Typography>
                    <Box sx={{ ml: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        {calculateTotalPrice(selectedJob).toLocaleString()}원
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
                      <Box sx={{ ml: 3, bgcolor: 'grey.50', borderRadius: 1 }}>
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
          >
            <DialogTitle sx={{ 
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'warning.dark' : 'warning.light', 
              color: 'warning.contrastText',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              ⚠️ 픽업지연 확인
            </DialogTitle>
            <DialogContent sx={{ 
              pt: 3,
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : 'background.default'
            }}>
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
          >
            <DialogTitle sx={{ 
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'error.dark' : 'error.light', 
              color: 'error.contrastText',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              🏠 소비자 부재 확인
            </DialogTitle>
            <DialogContent sx={{ 
              pt: 3,
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : 'background.default'
            }}>
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
