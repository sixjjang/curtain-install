import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Snackbar
} from '@mui/material';
import {
  LocationOn,
  Schedule,
  AttachMoney,
  Description,
  CheckCircle,
  Pending,
  ArrowBack,
  Chat,
  Assignment,
  Info,
  CheckCircleOutline,
  PlayArrow,
  Stop
} from '@mui/icons-material';
import { JobService } from '../../../shared/services/jobService';
import { CustomerService, CustomerInfo } from '../../../shared/services/customerService';
import { ConstructionJob } from '../../../types';
import { useAuth } from '../../../shared/contexts/AuthContext';

const JobDetail: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<ConstructionJob | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [consultationNotes, setConsultationNotes] = useState('');
  const [usageGuideCompleted, setUsageGuideCompleted] = useState(false);
  const [customerSignature, setCustomerSignature] = useState('');
  const [signatureCanvas, setSignatureCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    const fetchJobAndCustomer = async () => {
      if (!jobId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // 작업 정보 가져오기
        const jobData = await JobService.getJobById(jobId);
        setJob(jobData);
        
        // 고객 정보 가져오기
        try {
          const customerData = await CustomerService.getCustomerInfo(jobData.customerId);
          if (customerData) {
            setCustomerInfo(customerData);
          }
        } catch (customerError) {
          console.warn('고객 정보 가져오기 실패:', customerError);
          // 고객 정보가 없어도 작업은 계속 진행
        }
      } catch (error) {
        console.error('작업 상세 정보 가져오기 실패:', error);
        setError(error instanceof Error ? error.message : '작업을 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobAndCustomer();
  }, [jobId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'assigned': return 'info';
      case 'product_preparing': return 'warning';
      case 'product_ready': return 'success';
      case 'pickup_completed': return 'secondary';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'assigned': return '배정됨';
      case 'product_preparing': return '제품준비중';
      case 'product_ready': return '제품준비완료';
      case 'pickup_completed': return '픽업완료';
      case 'in_progress': return '진행중';
      case 'completed': return '완료';
      default: return '알 수 없음';
    }
  };



  const formatDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes}분`;
  };

  const calculateTotalPrice = () => {
    if (!job?.items || job.items.length === 0) {
      return 0;
    }
    return job.items.reduce((total, item) => total + item.totalPrice, 0);
  };

  // 완료 프로세스 관련 함수들
  const handleStartCompletion = () => {
    setCompletionDialogOpen(true);
    setActiveStep(0);
  };

  const handleNextStep = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handlePrevStep = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

    const handleCompleteJob = async () => {
    try {
      // 작업 상태를 완료로 업데이트
      await JobService.updateJobStatus(job!.id, 'completed');
      
      // 만족도 조사 생성 및 카카오톡 링크 발송
      try {
        const { SatisfactionService } = await import('../../../shared/services/satisfactionService');
        const { CustomerService } = await import('../../../shared/services/customerService');
        
        // 만족도 조사 생성
        const surveyId = await SatisfactionService.createSurvey(
          job!.id, 
          job!.customerId, 
          'current-contractor-id' // 실제로는 현재 로그인한 시공자 ID
        );
        
        // 고객 정보 조회
        const customerInfo = await CustomerService.getCustomerInfo(job!.customerId);
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
        jobId: job!.id,
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
      
      // 작업 정보 새로고침
      const updatedJob = await JobService.getJobById(job!.id);
      setJob(updatedJob);
      
    } catch (error) {
      console.error('작업 완료 처리 실패:', error);
      setSnackbar({
        open: true,
        message: '작업 완료 처리에 실패했습니다. 다시 시도해주세요.',
        severity: 'error'
      });
    }
  };

  // 픽업 완료 처리
  const handlePickupCompleted = async () => {
    try {
      await JobService.updateJobStatus(job!.id, 'pickup_completed');
      
      // 작업 정보 새로고침
      const updatedJob = await JobService.getJobById(job!.id);
      setJob(updatedJob);
      
      setSnackbar({
        open: true,
        message: '픽업이 완료되었습니다. 고객님댁으로 이동하세요.',
        severity: 'success'
      });
    } catch (error) {
      console.error('픽업 완료 처리 실패:', error);
      setSnackbar({
        open: true,
        message: '픽업 완료 처리에 실패했습니다.',
        severity: 'error'
      });
    }
  };

  // 고객님댁으로 이동 처리
  const handleStartWork = async () => {
    try {
      await JobService.updateJobStatus(job!.id, 'in_progress');
      
      // 작업 정보 새로고침
      const updatedJob = await JobService.getJobById(job!.id);
      setJob(updatedJob);
      
      setSnackbar({
        open: true,
        message: '시공을 시작합니다.',
        severity: 'success'
      });
    } catch (error) {
      console.error('시공 시작 처리 실패:', error);
      setSnackbar({
        open: true,
        message: '시공 시작 처리에 실패했습니다.',
        severity: 'error'
      });
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              시공 상담 및 점검
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              시공 완료 후 고객과 함께 다음 사항들을 확인해주세요.
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
                  <ListItemText primary="• 고객 만족도 확인" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• 추가 요청사항 확인" />
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
              placeholder="고객과 상담한 내용이나 특이사항을 기록해주세요..."
            />
          </Box>
        );
      
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              사용법 안내
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              고객에게 제품 사용법을 안내해주세요.
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                안내 사항:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• 제품 조작 방법 설명" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• 주의사항 및 관리 방법" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• A/S 연락처 안내" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• 보증 기간 안내" />
                </ListItem>
              </List>
            </Box>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={usageGuideCompleted}
                  onChange={(e) => setUsageGuideCompleted(e.target.checked)}
                />
              }
              label="사용법 안내를 완료했습니다"
            />
          </Box>
        );
      
             case 2:
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
                   backgroundColor: '#fafafa'
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

  const handleAcceptJob = async (jobId: string) => {
    try {
      await JobService.updateJobStatus(jobId, 'assigned');
      // 작업 상태 업데이트 후 페이지 새로고침
      const updatedJob = await JobService.getJobById(jobId);
      setJob(updatedJob);
    } catch (error) {
      console.error('작업 수락 실패:', error);
    }
  };

  if (loading) {
    return (
      <Box>
        <Typography>로딩 중...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Box display="flex" alignItems="center" mb={3}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/contractor/jobs')}
            sx={{ mr: 2 }}
          >
            목록으로
          </Button>
          <Typography variant="h4">
            오류 발생
          </Typography>
        </Box>
        <Card>
          <CardContent>
            <Typography variant="h6" color="error" gutterBottom>
              작업을 불러올 수 없습니다
            </Typography>
            <Typography variant="body1" color="textSecondary">
              {error}
            </Typography>
            <Button
              variant="contained"
              onClick={() => window.location.reload()}
              sx={{ mt: 2 }}
            >
              다시 시도
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // 수락되지 않은 작업에 대한 접근 제한
  if (job && job.status === 'pending') {
    return (
      <Box>
        <Box display="flex" alignItems="center" mb={3}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/contractor/jobs')}
            sx={{ mr: 2 }}
          >
            목록으로
          </Button>
          <Typography variant="h4">
            접근 제한
          </Typography>
        </Box>
        <Card>
          <CardContent>
            <Typography variant="h6" color="warning.main" gutterBottom>
              아직 수락하지 않은 작업입니다
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              이 작업의 상세 정보를 확인하려면 먼저 작업을 수락해야 합니다.
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              작업 제목: {job.title}
            </Typography>
            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                color="success"
                onClick={() => handleAcceptJob(job.id)}
              >
                작업 수락하기
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/contractor/jobs')}
              >
                목록으로 돌아가기
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (!job) {
    return (
      <Box>
        <Box display="flex" alignItems="center" mb={3}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/contractor/jobs')}
            sx={{ mr: 2 }}
          >
            목록으로
          </Button>
          <Typography variant="h4">
            작업을 찾을 수 없습니다
          </Typography>
        </Box>
        <Card>
          <CardContent>
            <Typography variant="body1" color="textSecondary">
              요청하신 작업 ID: {jobId}
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/contractor/jobs')}
              sx={{ mt: 2 }}
            >
              작업 목록으로
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/contractor/jobs')}
          sx={{ mr: 2 }}
        >
          목록으로
        </Button>
        <Typography variant="h4">
          시공 작업 상세
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* 작업 정보 */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {job.title}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    작업 ID: #{job.id}
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2} mb={3}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <LocationOn color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2">{job.address}</Typography>
                  </Box>
                </Grid>
                {job.scheduledDate && (
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Schedule color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2">{formatDateTime(job.scheduledDate)}</Typography>
                    </Box>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <AttachMoney color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2">총 금액: {calculateTotalPrice().toLocaleString()}원</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <CheckCircle color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2">상태: {getStatusText(job.status)}</Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                작업 상세 내용
              </Typography>
              <Typography variant="body1" paragraph>
                {job.description}
              </Typography>

              {job.items && job.items.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom>
                    제품 정보
                  </Typography>
                  <TableContainer component={Paper} sx={{ mb: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>제품명</TableCell>
                          <TableCell align="right">수량</TableCell>
                          <TableCell align="right">단가</TableCell>
                          <TableCell align="right">총액</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {job.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">{item.unitPrice.toLocaleString()}원</TableCell>
                            <TableCell align="right">{item.totalPrice.toLocaleString()}원</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} align="right">
                            <strong>총 금액</strong>
                          </TableCell>
                          <TableCell align="right">
                            <strong>{calculateTotalPrice().toLocaleString()}원</strong>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}

              {job.requirements && job.requirements.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom>
                    요구사항
                  </Typography>
                  <List dense>
                    {job.requirements.map((requirement, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={requirement} />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}

              {/* 픽업 정보 섹션 */}
              {job.pickupInfo && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    픽업 정보
                  </Typography>
                  <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#f9f9f9' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <Info color="action" sx={{ mr: 1 }} />
                          <Typography variant="body2" fontWeight="bold">
                            상호: {job.pickupInfo.companyName}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <Info color="action" sx={{ mr: 1 }} />
                          <Typography variant="body2" fontWeight="bold">
                            연락처: {job.pickupInfo.phone}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <LocationOn color="action" sx={{ mr: 1 }} />
                          <Typography variant="body2" fontWeight="bold">
                            픽업 주소: {job.pickupInfo.address}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <Schedule color="action" sx={{ mr: 1 }} />
                          <Typography variant="body2" fontWeight="bold">
                            준비예정일시: {job.pickupInfo.scheduledDateTime ? 
                              new Date(job.pickupInfo.scheduledDateTime).toLocaleString('ko-KR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : '미정'
                            }
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 작업 상태 및 액션 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                작업 상태
              </Typography>
              
              <Box display="flex" alignItems="center" mb={2}>
                <Chip 
                  label={getStatusText(job.status)} 
                  color={getStatusColor(job.status)} 
                  icon={<Pending />}
                  sx={{ mr: 1 }}
                />
                <Typography variant="body2">
                  {job.status === 'pending' && '시공자 배정 대기 중'}
                  {job.status === 'assigned' && '시공자 배정 완료'}
                  {job.status === 'product_preparing' && '제품 준비 중'}
                  {job.status === 'product_ready' && '제품 준비 완료 - 픽업 대기'}
                  {job.status === 'pickup_completed' && '픽업 완료 - 고객님댁으로 이동'}
                  {job.status === 'in_progress' && '작업 진행 중'}
                  {job.status === 'completed' && '작업 완료'}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                액션
              </Typography>
              
              <Box display="flex" flexDirection="column" gap={2}>
                {job.status === 'pending' && (
                  <Button
                    variant="contained"
                    fullWidth
                    color="success"
                    onClick={() => handleAcceptJob(job.id)}
                  >
                    작업 수락
                  </Button>
                )}
                
                {job.status === 'assigned' && (
                  <>
                    <Button
                      variant="contained"
                      fullWidth
                      color="primary"
                      startIcon={<Chat />}
                      onClick={() => navigate(`/contractor/chat/${jobId}`)}
                    >
                      채팅하기
                    </Button>
                    
                    <Button
                      variant="outlined"
                      fullWidth
                      color="error"
                    >
                      작업 거절
                    </Button>
                  </>
                )}

                {job.status === 'product_preparing' && (
                  <>
                    <Button
                      variant="contained"
                      fullWidth
                      color="primary"
                      startIcon={<Chat />}
                      onClick={() => navigate(`/contractor/chat/${jobId}`)}
                    >
                      채팅하기
                    </Button>
                    
                    <Alert severity="info" sx={{ mt: 2 }}>
                      판매자가 제품을 준비하고 있습니다.
                    </Alert>
                  </>
                )}

                {job.status === 'product_ready' && (
                  <>
                    <Button
                      variant="contained"
                      fullWidth
                      color="success"
                      size="large"
                      sx={{ 
                        fontSize: '1.1rem', 
                        fontWeight: 'bold',
                        py: 2,
                        mb: 2,
                        background: 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)',
                        boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
                        animation: 'heartbeat 1.5s infinite',
                        '@keyframes heartbeat': {
                          '0%': {
                            transform: 'scale(1)',
                            boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)'
                          },
                          '14%': {
                            transform: 'scale(1.03)',
                            boxShadow: '0 4px 8px 2px rgba(76, 175, 80, .4)'
                          },
                          '28%': {
                            transform: 'scale(1)',
                            boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)'
                          },
                          '42%': {
                            transform: 'scale(1.03)',
                            boxShadow: '0 4px 8px 2px rgba(76, 175, 80, .4)'
                          },
                          '70%': {
                            transform: 'scale(1)',
                            boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)'
                          }
                        },
                        '&:hover': {
                          background: 'linear-gradient(45deg, #388E3C 30%, #4CAF50 90%)',
                          transform: 'scale(1.05)',
                          transition: 'all 0.3s ease'
                        }
                      }}
                      onClick={handlePickupCompleted}
                    >
                      📦 제품 픽업후 클릭~!!
                    </Button>
                    
                    <Button
                      variant="contained"
                      fullWidth
                      color="primary"
                      startIcon={<Chat />}
                      onClick={() => navigate(`/contractor/chat/${jobId}`)}
                    >
                      채팅하기
                    </Button>
                  </>
                )}

                {job.status === 'pickup_completed' && (
                  <>
                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      sx={{ 
                        fontSize: '1.1rem', 
                        fontWeight: 'bold',
                        py: 2,
                        mb: 2,
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
                      onClick={handleStartWork}
                    >
                      🚚 늦지않게 시공지로 이동후 이 버튼을 눌러주세요~^^
                    </Button>
                    
                    <Button
                      variant="contained"
                      fullWidth
                      color="primary"
                      startIcon={<Chat />}
                      onClick={() => navigate(`/contractor/chat/${jobId}`)}
                    >
                      채팅하기
                    </Button>
                  </>
                )}
                
                {job.status === 'in_progress' && (
                  <>
                    <Button
                      variant="contained"
                      fullWidth
                      color="primary"
                      startIcon={<Chat />}
                      onClick={() => navigate(`/contractor/chat/${jobId}`)}
                    >
                      채팅하기
                    </Button>
                    
                    <Button
                      variant="contained"
                      fullWidth
                      color="success"
                      startIcon={<CheckCircleOutline />}
                      onClick={handleStartCompletion}
                    >
                      시공완료 처리
                    </Button>
                    
                    <Button
                      variant="outlined"
                      fullWidth
                      color="error"
                    >
                      작업 거절
                    </Button>
                    
                    <Button
                      variant="outlined"
                      fullWidth
                    >
                      고객에게 문의
                    </Button>
                  </>
                )}
                
                {job.status === 'completed' && (
                  <>
                    <Button
                      variant="contained"
                      fullWidth
                      color="primary"
                      startIcon={<Chat />}
                      onClick={() => navigate(`/contractor/chat/${jobId}`)}
                    >
                      채팅하기
                    </Button>
                    
                    <Alert severity="success" sx={{ mt: 2 }}>
                      작업이 완료되었습니다.
                    </Alert>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* 고객 정보 */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                고객 정보
              </Typography>
              
              {customerInfo ? (
                <>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ mr: 2 }}>
                      {customerInfo.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1">{customerInfo.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {customerInfo.phone}
                      </Typography>
                      {customerInfo.email && (
                        <Typography variant="body2" color="textSecondary">
                          {customerInfo.email}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="textSecondary">
                      고객 평점: {customerInfo.rating ? `${customerInfo.rating.toFixed(1)}/5.0` : '평점 없음'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      총 작업: {customerInfo.totalJobs || 0}건
                    </Typography>
                  </Box>
                </>
              ) : (
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    고객 정보를 불러올 수 없습니다.
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    고객 ID: {job?.customerId}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
        
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            <Step>
              <StepLabel>시공 상담</StepLabel>
            </Step>
            <Step>
              <StepLabel>사용법 안내</StepLabel>
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
                     {activeStep < 2 ? (
             <Button 
               variant="contained" 
               onClick={handleNextStep}
               disabled={
                 (activeStep === 1 && !usageGuideCompleted)
               }
             >
               다음
             </Button>
           ) : (
            <Button 
              variant="contained" 
              color="success"
              onClick={handleCompleteJob}
              disabled={!customerSignature.trim()}
            >
              작업 완료
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
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
    </Box>
  );
};

export default JobDetail;
