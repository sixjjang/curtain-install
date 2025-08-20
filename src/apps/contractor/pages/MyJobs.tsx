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
import { Search, Schedule, LocationOn, CheckCircle, Assignment, Chat, CheckCircleOutline } from '@mui/icons-material';
import { JobService } from '../../../shared/services/jobService';
import { ConstructionJob } from '../../../types';
import { useAuth } from '../../../shared/contexts/AuthContext';


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
  
  // 시공완료 다이얼로그 관련 상태
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [consultationNotes, setConsultationNotes] = useState('');
  const [usageGuideCompleted, setUsageGuideCompleted] = useState(false);
  const [customerSignature, setCustomerSignature] = useState('');
  const [signatureCanvas, setSignatureCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string>('');

  useEffect(() => {
    const fetchMyJobs = async () => {
      try {
        setLoading(true);
        
        if (!user?.id) {
          console.warn('사용자 정보가 없습니다.');
          setJobs([]);
          return;
        }

        const allJobs = await JobService.getAllJobs();
        
        // 현재 로그인한 시공자의 작업만 필터링
        const myJobs = allJobs.filter(job => {
          // 상태 필터링
          const statusMatch = ['assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress', 'completed'].includes(job.status);
          
          // 시공자 ID 필터링
          const contractorMatch = job.contractorId === user.id;
          
          return statusMatch && contractorMatch;
        });
        
        console.log(`전체 작업: ${allJobs.length}개, 내 작업: ${myJobs.length}개`);
        console.log('내 작업들:', myJobs.map(job => ({ id: job.id, title: job.title, contractorId: job.contractorId, status: job.status })));
        
        setJobs(myJobs);
      } catch (error) {
        console.error('나의 작업 목록 가져오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyJobs();
  }, [user?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
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
      case 'assigned': return '📋 배정됨';
      case 'product_preparing': return '🔧 제품준비중';
      case 'product_ready': return '📦 제품준비완료';
      case 'pickup_completed': return '🚚 픽업완료';
      case 'in_progress': return '🏗️ 진행중';
      case 'completed': return '✅ 완료';
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

  const handleJobDetail = (jobId: string) => {
    navigate(`/contractor/jobs/${jobId}`);
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
        const statusMatch = ['assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress', 'completed'].includes(job.status);
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
        <Typography variant="h4" gutterBottom>
          나의 작업
        </Typography>
        <Typography>로딩 중...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            나의 작업
          </Typography>
          <Typography variant="body2" color="textSecondary">
            📋 배정된 작업: 모든 진행 중인 작업을 한눈에 확인할 수 있습니다
          </Typography>
        </Box>

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
            {filteredJobs.map((job) => (
              <Grid item xs={12} md={6} lg={4} key={job.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h6">{job.title} - {calculateTotalPrice(job).toLocaleString()}원</Typography>
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
                      {/* 제품준비완료 상태일 때 픽업 버튼 */}
                      {job.status === 'product_ready' && (
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
                      )}
                      
                      {/* 픽업완료 상태일 때 고객님댁으로 이동 버튼 */}
                      {job.status === 'pickup_completed' && (
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
                        onClick={() => navigate(`/contractor/chat/${job.id}`)}
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
                조건에 맞는 작업이 없습니다.
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
            
            <DialogContent>
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
