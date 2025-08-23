import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Paper,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Send as SendIcon,
  Chat as ChatIcon,
  Schedule,
  LocationOn,
  Person,
  AccountBalance,
  ListAlt,
  LocalShipping,
  Description,
  Visibility,
  Info,
  CheckCircle,
  ArrowBack,
  VisibilityOff,
  Visibility as VisibilityOn
} from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { JobService } from '../../../shared/services/jobService';
import { ConstructionJob } from '../../../types';
import { useParams, useSearchParams } from 'react-router-dom';
import ChatArea from '../components/ChatArea';

const ContractorChat: React.FC = () => {
  const { user } = useAuth();
  const { jobId: urlJobId } = useParams<{ jobId: string }>();
  const [searchParams] = useSearchParams();
  const queryJobId = searchParams.get('jobId');
  const jobId = urlJobId || queryJobId; // URL 파라미터 또는 쿼리 파라미터에서 jobId 가져오기
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [jobs, setJobs] = useState<ConstructionJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<ConstructionJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false); // 모바일에서 채팅창 표시 여부
  const [hideCompleted, setHideCompleted] = useState(true); // 완료된 작업 숨김 여부

  // 상세보기 다이얼로그 관련 상태
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailJob, setDetailJob] = useState<ConstructionJob | null>(null);
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [contractorInfo, setContractorInfo] = useState<any>(null);

  // 총 예산 계산 함수
  const calculateTotalBudget = (job: ConstructionJob): number => {
    if (job.items && job.items.length > 0) {
      return job.items.reduce((sum, item) => sum + item.totalPrice, 0);
    }
    return 0;
  };

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

  // 채팅 헤더용 제목 포맷팅 (금액 제거)
  const formatChatHeaderTitle = (job: ConstructionJob): string => {
    if (job.scheduledDate) {
      const date = new Date(job.scheduledDate);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      // 주소에서 시/도 부분만 추출
      const addressParts = job.address.split(' ');
      const cityPart = addressParts.slice(0, 2).join(' ');
      
      // 작업 내용 추가 (아이템 정보가 있다면)
      let jobDetails = '';
      if (job.items && job.items.length > 0) {
        const itemDescriptions = job.items.map(item => {
          // name 속성을 기반으로 작업 내용 판단
          if (item.name.toLowerCase().includes('블라인드')) {
            return `블라인드 ${item.quantity}창`;
          } else if (item.name.toLowerCase().includes('커튼')) {
            return `커튼 ${item.quantity}조`;
          }
          return `${item.name} ${item.quantity}개`;
        });
        jobDetails = `-${itemDescriptions.join(', ')}`;
      }
      
      return `${month}/${day} ${timeStr}-${cityPart}${jobDetails}`;
    }
    return job.title;
  };

  // 시공건 목록 불러오기
  useEffect(() => {
    const loadJobs = async () => {
      console.log('🔄 ContractorChat - loadJobs 시작, user:', user?.id);
      
      if (!user?.id) {
        console.log('❌ ContractorChat - 사용자 정보 없음');
        setLoading(false);
        setError('로그인이 필요합니다.');
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        console.log('📝 ContractorChat - 작업 목록 로딩 시작');
        
        // 타임아웃 설정 (10초)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('요청 시간이 초과되었습니다.')), 10000)
        );
        
        const jobsPromise = JobService.getAllJobs();
        const allJobs = await Promise.race([jobsPromise, timeoutPromise]) as any[];
        
        console.log('📋 ContractorChat - 전체 작업 수:', allJobs.length);
        
        // 판매자가 등록한 작업들만 필터링
        const myJobs = allJobs.filter(job => 
          job.sellerId === user.id && 
          ['pending', 'assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress', 'completed'].includes(job.status)
        );
        
        console.log('👤 ContractorChat - 내 작업 수:', myJobs.length);
        
        // 가장 가까운 일시 순으로 정렬
        const sortedJobs = myJobs.sort((a, b) => {
          if (!a.scheduledDate && !b.scheduledDate) return 0;
          if (!a.scheduledDate) return 1;
          if (!b.scheduledDate) return -1;
          
          const dateA = new Date(a.scheduledDate).getTime();
          const dateB = new Date(b.scheduledDate).getTime();
          return dateA - dateB; // 오름차순 정렬 (가장 가까운 일시가 먼저)
        });
        
        setJobs(sortedJobs);
        
        // URL 파라미터로 jobId가 전달된 경우 해당 작업을 선택
        if (jobId && sortedJobs.length > 0) {
          const targetJob = sortedJobs.find(job => job.id === jobId);
          if (targetJob) {
            setSelectedJob(targetJob);
            console.log('✅ ContractorChat - URL 파라미터로 작업 선택:', targetJob.id);
          } else {
            console.log('⚠️ ContractorChat - URL 파라미터의 jobId를 찾을 수 없음:', jobId);
            // jobId에 해당하는 작업이 없으면 첫 번째 작업 선택
            const availableJobs = hideCompleted ? sortedJobs.filter(job => job.status !== 'completed') : sortedJobs;
            if (availableJobs.length > 0) {
              setSelectedJob(availableJobs[0]);
            }
          }
        } else if (sortedJobs.length > 0 && !selectedJob) {
          // jobId가 없거나 이미 선택된 작업이 없을 때만 첫 번째 작업을 자동 선택
          const availableJobs = hideCompleted ? sortedJobs.filter(job => job.status !== 'completed') : sortedJobs;
          if (availableJobs.length > 0) {
            setSelectedJob(availableJobs[0]);
            console.log('✅ ContractorChat - 첫 번째 작업 선택:', availableJobs[0].id);
          } else if (sortedJobs.length > 0) {
            setSelectedJob(sortedJobs[0]);
            console.log('✅ ContractorChat - 첫 번째 작업 선택 (완료된 작업):', sortedJobs[0].id);
          }
        }
        
        console.log('✅ ContractorChat - 작업 목록 로딩 완료');
      } catch (error) {
        console.error('❌ ContractorChat - 시공건 목록 불러오기 실패:', error);
        const errorMessage = error instanceof Error ? error.message : '시공건 목록을 불러올 수 없습니다.';
        setError(errorMessage);
      } finally {
        console.log('🏁 ContractorChat - 로딩 상태 해제');
        setLoading(false);
      }
    };

    loadJobs();
  }, [user, hideCompleted, jobId]);

  // 선택된 시공건이 변경될 때 모바일에서 채팅창 표시
  useEffect(() => {
    if (selectedJob && isMobile) {
      setShowChat(true); // 모바일에서 작업 선택 시 채팅창 표시
    }
  }, [selectedJob, isMobile]);

  // 상세보기 처리
  const handleJobDetail = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      setDetailJob(job);
      setDetailDialogOpen(true);
      
      // 고객 정보 가져오기
      if (job.customerId) {
        try {
          const { CustomerService } = await import('../../../shared/services/customerService');
          const customer = await CustomerService.getCustomerInfo(job.customerId);
          setCustomerInfo(customer);
        } catch (error) {
          console.error('고객 정보 조회 실패:', error);
          setCustomerInfo(null);
        }
      } else {
        setCustomerInfo(null);
      }

      // 시공자 정보 가져오기
      if (job.contractorId) {
        try {
          const { AuthService } = await import('../../../shared/services/authService');
          const contractor = await AuthService.getUserById(job.contractorId);
          setContractorInfo(contractor);
        } catch (error) {
          console.error('시공자 정보 조회 실패:', error);
          setContractorInfo(null);
        }
      } else {
        setContractorInfo(null);
      }
    }
  };

  // 상세보기 다이얼로그 닫기
  const handleDetailClose = () => {
    setDetailDialogOpen(false);
    setDetailJob(null);
    setCustomerInfo(null);
    setContractorInfo(null);
  };



  // 날짜 및 시간 포맷팅
  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  // 상태 텍스트 변환
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'assigned': return '배정됨';
      case 'product_preparing': return '자재준비';
      case 'product_ready': return '자재완료';
      case 'pickup_completed': return '픽업완료';
      case 'in_progress': return '시공중';
      case 'completed': return '완료';
      default: return '알 수 없음';
    }
  };

  // 상태 색상 변환
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'assigned': return 'primary';
      case 'product_preparing': return 'warning';
      case 'product_ready': return 'info';
      case 'pickup_completed': return 'secondary';
      case 'in_progress': return 'success';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const handleJobSelect = (job: ConstructionJob) => {
    setSelectedJob(job);
  };

  const handleBackToList = () => {
    setShowChat(false);
  };

  // 완료된 작업 필터링
  const filteredJobs = hideCompleted ? jobs.filter(job => job.status !== 'completed') : jobs;

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" py={4}>
        <CircularProgress />
        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
          시공건 목록을 불러오는 중...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" py={4}>
        <Alert severity="error" sx={{ mb: 2, maxWidth: 400 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
        >
          페이지 새로고침
        </Button>
      </Box>
    );
  }

  // 모바일에서 채팅창 표시
  if (isMobile && showChat && selectedJob) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* 채팅 헤더 */}
        <Box sx={{ 
          position: 'sticky',
          top: 0,
          zIndex: 10,
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          bgcolor: 'background.paper',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <IconButton 
            onClick={handleBackToList}
            sx={{ flexShrink: 0 }}
            aria-label="목록으로 돌아가기"
          >
            <ArrowBack />
          </IconButton>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontWeight: 600,
                fontSize: '0.9rem',
                lineHeight: 1.2
              }}
            >
              {formatJobTitle(selectedJob)}
            </Typography>
            <Typography 
              variant="caption" 
              color="textSecondary" 
              sx={{ 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
                mt: 0.5,
                fontSize: '0.75rem',
                lineHeight: 1.2
              }}
            >
              {selectedJob.address.length > 25 
                ? `${selectedJob.address.substring(0, 25)}...` 
                : selectedJob.address
              }
            </Typography>
          </Box>
          <Chip 
            label={getStatusText(selectedJob.status)} 
            color={getStatusColor(selectedJob.status)} 
            size="small"
            sx={{ flexShrink: 0 }}
          />
        </Box>

        {/* 채팅 영역 */}
        <Box sx={{ flexGrow: 1 }}>
          <ChatArea selectedJob={selectedJob} isModal={true} />
        </Box>
      </Box>
    );
  }

  // 모바일에서 작업 목록 표시
  if (isMobile) {
    return (
      <Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, mx: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              내 시공 작업
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={hideCompleted ? <VisibilityOff /> : <VisibilityOn />}
              onClick={() => setHideCompleted(!hideCompleted)}
            >
              {hideCompleted ? '완료된 작업 표시' : '완료된 작업 숨김'}
            </Button>
          </Box>
          <List>
            {filteredJobs.length === 0 ? (
              <ListItem>
                <ListItemText 
                  primary="등록된 작업이 없습니다." 
                  secondary="새로운 시공 작업을 등록하면 시공자와 채팅할 수 있습니다."
                />
              </ListItem>
            ) : (
              filteredJobs.map((job) => (
                <Card 
                  key={job.id}
                  sx={{ 
                    mb: 2, 
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                  onClick={() => handleJobSelect(job)}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                        {formatJobTitle(job)}
                      </Typography>
                      <Chip 
                        label={getStatusText(job.status)} 
                        color={getStatusColor(job.status)} 
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {job.address}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      총금액: {job.finalAmount 
                        ? `${job.finalAmount.toLocaleString()}원` 
                        : calculateTotalBudget(job) > 0 
                          ? `${calculateTotalBudget(job).toLocaleString()}원`
                          : '예산 미정'
                      }
                    </Typography>
                  </CardContent>
                </Card>
              ))
            )}
          </List>
        </Box>
      </Box>
    );
  }

  // 데스크톱 레이아웃 (기존과 동일)
  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box display="flex" gap={2} sx={{ height: 'calc(100vh - 200px)' }}>
        {/* 시공건 목록 */}
        <Card sx={{ width: 300, flexShrink: 0 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                내 시공 작업
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={hideCompleted ? <VisibilityOff /> : <VisibilityOn />}
                onClick={() => setHideCompleted(!hideCompleted)}
              >
                {hideCompleted ? '완료된 작업 표시' : '완료된 작업 숨김'}
              </Button>
            </Box>
            <List sx={{ maxHeight: 'calc(100vh - 300px)', overflow: 'auto' }}>
              {filteredJobs.length === 0 ? (
                <ListItem>
                  <ListItemText 
                    primary="등록된 작업이 없습니다." 
                    secondary="새로운 시공 작업을 등록하면 시공자와 채팅할 수 있습니다."
                  />
                </ListItem>
              ) : (
                filteredJobs.map((job) => (
                  <ListItem 
                    key={job.id}
                    button
                    selected={selectedJob?.id === job.id}
                    onClick={() => setSelectedJob(job)}
                    sx={{ mb: 1, borderRadius: 1 }}
                  >
                    <ListItemText
                      primary={
                        <>
                          <Typography variant="subtitle2" noWrap component="span">
                            {formatJobTitle(job)}
                          </Typography>
                          <Chip 
                            label={getStatusText(job.status)} 
                            color={getStatusColor(job.status)} 
                            size="small"
                            sx={{ float: 'right' }}
                          />
                        </>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="textSecondary" noWrap component="span">
                            {job.address}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" component="span" display="block">
                            총금액: {job.finalAmount 
                              ? `${job.finalAmount.toLocaleString()}원` 
                              : calculateTotalBudget(job) > 0 
                                ? `${calculateTotalBudget(job).toLocaleString()}원`
                                : '예산 미정'
                            }
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))
              )}
            </List>
          </CardContent>
        </Card>

                 {/* 채팅 영역 */}
         <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
           <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 0 }}>
             <ChatArea 
               selectedJob={selectedJob} 
               onJobDetail={handleJobDetail}
             />
           </CardContent>
         </Card>
      </Box>

      {/* 상세보기 다이얼로그 */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={handleDetailClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          작업 상세 정보
        </DialogTitle>
        <DialogContent>
          {detailJob && (
            <Box>
              {/* 기본 정보 */}
              <Typography variant="h6" gutterBottom>
                {detailJob.title}
              </Typography>
              <Typography variant="body1" paragraph>
                {detailJob.description}
              </Typography>

              <Grid container spacing={2} mb={3}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <LocationOn color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2">{detailJob.address}</Typography>
                  </Box>
                </Grid>
                {detailJob.scheduledDate && (
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Schedule color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2">{formatDateTime(detailJob.scheduledDate)}</Typography>
                    </Box>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <AccountBalance color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2">총 금액: {calculateTotalBudget(detailJob).toLocaleString()}원</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <CheckCircle color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2">상태: {getStatusText(detailJob.status)}</Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* 고객 정보 */}
              {customerInfo && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person color="action" />
                    고객 정보
                  </Typography>
                  <Box sx={{ ml: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2">
                      이름: {customerInfo.name}
                    </Typography>
                    <Typography variant="body2">
                      연락처: {customerInfo.phone}
                    </Typography>
                    {customerInfo.email && (
                      <Typography variant="body2">
                        이메일: {customerInfo.email}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}

              {/* 시공자 정보 */}
              {contractorInfo && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person color="action" />
                    시공자 정보
                  </Typography>
                  <Box sx={{ ml: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2">
                      이름: {contractorInfo.name || contractorInfo.email}
                    </Typography>
                    <Typography variant="body2">
                      연락처: {contractorInfo.phone || '연락처 없음'}
                    </Typography>
                    {contractorInfo.email && (
                      <Typography variant="body2">
                        이메일: {contractorInfo.email}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}

              {/* 품목 및 단가 */}
              {detailJob.items && detailJob.items.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ListAlt color="action" />
                    품목 및 단가
                  </Typography>
                  <Box sx={{ ml: 3 }}>
                    {detailJob.items.map((item, index) => (
                      <Box key={index} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {item.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          수량: {item.quantity}개
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          단가: {item.unitPrice?.toLocaleString()}원
                        </Typography>
                        <Typography variant="body2" color="primary" fontWeight="bold">
                          소계: {item.totalPrice?.toLocaleString()}원
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* 준비일시 */}
              {detailJob.pickupInfo && detailJob.pickupInfo.scheduledDateTime && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalShipping color="action" />
                    준비일시
                  </Typography>
                  <Box sx={{ ml: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2">
                      {formatDateTime(new Date(detailJob.pickupInfo.scheduledDateTime))}
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
                    {calculateTotalBudget(detailJob).toLocaleString()}원
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDetailClose}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContractorChat;
