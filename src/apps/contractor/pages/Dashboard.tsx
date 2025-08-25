import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  LinearProgress,
  Alert,
  CircularProgress,
  Skeleton,
  Divider,
  IconButton,
  Paper,
  Stack,
  Badge,
  Tooltip,
  Rating
} from '@mui/material';
import {
  Work,
  TrendingUp,
  Star,
  Notifications,
  LocationOn,
  Schedule,
  CheckCircle,
  Pending,
  Chat,
  MonetizationOn,
  Speed,
  CalendarToday,
  ArrowForward,
  Visibility,
  Assignment,
  People,
  EmojiEvents,
  TrendingDown,
  AccessTime,
  CheckCircleOutline,
  Warning,
  Info
} from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { ContractorInfo, ConstructionJob, Notification } from '../../../types';
import { JobService } from '../../../shared/services/jobService';
import { NotificationService } from '../../../shared/services/notificationService';
import { ContractorService } from '../../../shared/services/contractorService';
import { PointService } from '../../../shared/services/pointService';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const contractor = user?.contractor;
  const navigate = useNavigate();

  // 총 예산 계산 함수
  const calculateTotalBudget = (job: ConstructionJob): number => {
    if (job.items && job.items.length > 0) {
      return job.items.reduce((sum, item) => sum + item.totalPrice, 0);
    }
    return 0;
  };
  
  // 상태 관리
  const [scheduledJobs, setScheduledJobs] = useState<ConstructionJob[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [chatNotifications, setChatNotifications] = useState<{[jobId: string]: number}>({});
  const [contractorStats, setContractorStats] = useState({
    totalJobs: 0,
    completedJobs: 0,
    totalEarnings: 0,
    rating: 0,
    level: 1,
    points: 0,
    pendingJobs: 0,
    inProgressJobs: 0,
    monthlyEarnings: 0,
    weeklyEarnings: 0,
    dailyEarnings: 0,
    completionRate: 0,
    averageRating: 0,
    totalReviews: 0
  });
  const [suspensionStatus, setSuspensionStatus] = useState<{
    isSuspended: boolean;
    suspensionEndDate: Date | null;
    remainingDays: number;
    reason: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 데이터 로딩
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        setError(null);

        // 병렬로 데이터 로딩
        const [jobsData, notificationsData, contractorStatsData, pointBalance, suspensionStatusData] = await Promise.allSettled([
          JobService.getJobsByContractor(user.id),
          NotificationService.getNotifications(user.id),
          ContractorService.getContractorStats(user.id),
          PointService.getPointBalance(user.id, 'contractor'),
          ContractorService.checkSuspensionStatus(user.id)
        ]);

        // 시공 작업 데이터 처리
        if (jobsData.status === 'fulfilled') {
          const jobs = jobsData.value;
          // 배정된 작업만 필터링 (최대 5개)
          const assignedJobs = jobs
            .filter(job => job.status === 'assigned' || job.status === 'in_progress')
            .slice(0, 5);
          setScheduledJobs(assignedJobs);

          // 통계 계산
          const totalJobs = jobs.length;
          const completedJobs = jobs.filter(job => job.status === 'completed').length;
          const pendingJobs = jobs.filter(job => job.status === 'pending').length;
          const inProgressJobs = jobs.filter(job => 
            job.status === 'assigned' || job.status === 'in_progress' || 
            job.status === 'product_preparing' || job.status === 'product_ready'
          ).length;

          // 수익 계산
          const totalEarnings = jobs
            .filter(job => job.status === 'completed')
            .reduce((sum, job) => sum + calculateTotalBudget(job), 0);

          // 월간/주간/일간 수익 계산 (간단한 예시)
          const now = new Date();
          const thisMonth = now.getMonth();
          const thisYear = now.getFullYear();
          
          const monthlyEarnings = jobs
            .filter(job => job.status === 'completed' && 
              new Date(job.completedDate || job.createdAt).getMonth() === thisMonth &&
              new Date(job.completedDate || job.createdAt).getFullYear() === thisYear)
            .reduce((sum, job) => sum + calculateTotalBudget(job), 0);

          const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

          setContractorStats(prev => ({
            ...prev,
            totalJobs,
            completedJobs,
            totalEarnings,
            pendingJobs,
            inProgressJobs,
            monthlyEarnings,
            completionRate
          }));
        }

        // 알림 데이터 처리
        if (notificationsData.status === 'fulfilled') {
          const notifs = notificationsData.value;
          // 읽지 않은 알림만 필터링 (최대 10개)
          const unreadNotifications = notifs
            .filter(notif => !notif.isRead)
            .slice(0, 10);
          setNotifications(unreadNotifications);

          // 채팅 알림 처리
          const chatNotifMap: {[jobId: string]: number} = {};
          notifs.forEach(notification => {
            if (notification.type === 'info' && notification.actionUrl?.includes('/chat/')) {
              const jobId = notification.actionUrl.split('/chat/')[1];
              if (jobId && !notification.isRead) {
                chatNotifMap[jobId] = (chatNotifMap[jobId] || 0) + 1;
              }
            }
          });
          setChatNotifications(chatNotifMap);
        }

        // 시공자 통계 데이터 처리
        if (contractorStatsData.status === 'fulfilled') {
          const stats = contractorStatsData.value;
          setContractorStats(prev => ({
            ...prev,
            rating: stats.rating || 0,
            level: stats.level || 1,
            averageRating: stats.rating || 0, // rating을 averageRating으로 사용
            totalReviews: 0 // 기본값으로 설정
          }));
        }

        // 포인트 잔액 처리
        if (pointBalance.status === 'fulfilled') {
          setContractorStats(prev => ({ ...prev, points: pointBalance.value }));
        }

        // 정지 상태 처리
        if (suspensionStatusData.status === 'fulfilled') {
          setSuspensionStatus(suspensionStatusData.value);
        }

      } catch (error) {
        console.error('대시보드 데이터 로드 실패:', error);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.id]);

  // 실시간 알림 구독
  useEffect(() => {
    if (user?.id) {
      const unsubscribe = NotificationService.subscribeToNotifications(user.id, (notifications) => {
        // 읽지 않은 알림만 필터링 (최대 10개)
        const unreadNotifications = notifications
          .filter(notif => !notif.isRead)
          .slice(0, 10);
        setNotifications(unreadNotifications);

        const chatNotifMap: {[jobId: string]: number} = {};
        
        notifications.forEach(notification => {
          if (notification.type === 'info' && notification.actionUrl?.includes('/chat/')) {
            const jobId = notification.actionUrl.split('/chat/')[1];
            if (jobId && !notification.isRead) {
              chatNotifMap[jobId] = (chatNotifMap[jobId] || 0) + 1;
            }
          }
        });
        
        setChatNotifications(chatNotifMap);
      });
      
      return unsubscribe;
    }
  }, [user?.id]);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'assigned': return '배정됨';
      case 'product_preparing': return '제품준비중';
      case 'product_ready': return '제품준비완료';
      case 'pickup_completed': return '픽업완료';
      case 'in_progress': return '시공중';
      case 'completed': return '완료';
      case 'cancelled': return '취소됨';
      case 'reschedule_requested': return '일정 재조정 요청';
      case 'compensation_completed': return '보상완료';
      case 'product_not_ready': return '제품 미준비';
      case 'customer_absent': return '고객 부재';
      case 'schedule_changed': return '일정 변경';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'assigned': return 'info';
      case 'product_preparing': return 'secondary';
      case 'product_ready': return 'success';
      case 'pickup_completed': return 'primary';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'reschedule_requested': return 'warning';
      case 'compensation_completed': return 'success';
      case 'product_not_ready': return 'error';
      case 'customer_absent': return 'error';
      case 'schedule_changed': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Pending />;
      case 'assigned': return <Assignment />;
      case 'product_preparing': return <Schedule />;
      case 'product_ready': return <CheckCircle />;
      case 'pickup_completed': return <CheckCircle />;
      case 'in_progress': return <Work />;
      case 'completed': return <CheckCircle />;
      case 'cancelled': return <Pending />;
      default: return <Work />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const getLevelProgress = () => {
    const currentLevel = contractorStats.level;
    const nextLevel = currentLevel + 1;
    const progress = (currentLevel % 1) * 100; // 레벨 진행률 계산
    return { currentLevel: Math.floor(currentLevel), nextLevel, progress };
  };

  const getRecentJobs = () => {
    return scheduledJobs.slice(0, 3);
  };

  const getJobsWithChatNotifications = () => {
    return scheduledJobs.filter(job => chatNotifications[job.id] > 0);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  const levelProgress = getLevelProgress();

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* 환영 메시지 */}
      <Box sx={{ mb: 3, px: { xs: 1, sm: 2, md: 3 } }}>
        <Typography variant="h4" gutterBottom>
          안녕하세요, {contractor?.name || user?.name || '시공자'}님! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          오늘도 안전하고 깔끔한 시공 부탁드립니다. 현재 {contractorStats.inProgressJobs}개의 작업이 진행중입니다.
        </Typography>
      </Box>

      {/* 정지 상태 알림 */}
      {suspensionStatus?.isSuspended && (
        <Box sx={{ mb: 3, px: { xs: 1, sm: 2, md: 3 } }}>
          <Alert 
            severity="warning" 
            icon={<Warning />}
            sx={{ 
              '& .MuiAlert-message': { 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 1 
              } 
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              신규 시공건 수락 정지
            </Typography>
            <Typography variant="body2">
              {suspensionStatus.reason}
            </Typography>
            {suspensionStatus.remainingDays === -1 ? (
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                영구정지 상태입니다.
              </Typography>
            ) : (
              <Typography variant="body2">
                정지 해제까지 <strong>{suspensionStatus.remainingDays}일</strong> 남았습니다.
                {suspensionStatus.suspensionEndDate && (
                  <span> (해제 예정일: {suspensionStatus.suspensionEndDate.toLocaleDateString()})</span>
                )}
              </Typography>
            )}
          </Alert>
        </Box>
      )}

      {/* 빠른 액션 버튼 */}
      <Paper sx={{ 
        p: { xs: 1, sm: 2 }, 
        mb: 3, 
        mx: { xs: 1, sm: 2, md: 3 },
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
      }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
          빠른 액션
        </Typography>
        <Grid container spacing={{ xs: 1, sm: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
                         <Button
               fullWidth
               variant="contained"
               startIcon={<Work />}
               onClick={() => navigate('/contractor/jobs')}
               sx={{ 
                 bgcolor: 'rgba(255,255,255,0.2)', 
                 color: 'white',
                 '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                 minHeight: { xs: '48px', sm: 'auto' },
                 fontSize: { xs: '0.875rem', sm: '1rem' }
               }}
             >
               시공건 찾기
             </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
                         <Button
               fullWidth
               variant="contained"
               startIcon={<Assignment />}
               onClick={() => navigate('/contractor/my-jobs')}
               sx={{ 
                 bgcolor: 'rgba(255,255,255,0.2)', 
                 color: 'white',
                 '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                 minHeight: { xs: '48px', sm: 'auto' },
                 fontSize: { xs: '0.875rem', sm: '1rem' }
               }}
             >
               내 작업
             </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
                         <Button
               fullWidth
               variant="contained"
               startIcon={<Chat />}
               onClick={() => navigate('/contractor/seller-chat')}
               sx={{ 
                 bgcolor: 'rgba(255,255,255,0.2)', 
                 color: 'white',
                 '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                 minHeight: { xs: '48px', sm: 'auto' },
                 fontSize: { xs: '0.875rem', sm: '1rem' }
               }}
             >
               판매자와 채팅
             </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
                         <Button
               fullWidth
               variant="contained"
               startIcon={<MonetizationOn />}
               onClick={() => navigate('/contractor/points')}
               sx={{ 
                 bgcolor: 'rgba(255,255,255,0.2)', 
                 color: 'white',
                 '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                 minHeight: { xs: '48px', sm: 'auto' },
                 fontSize: { xs: '0.875rem', sm: '1rem' }
               }}
             >
               포인트 관리
             </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* 수익 대시보드 */}
      <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} sx={{ mb: 3, px: { xs: 1, sm: 2, md: 3 } }}>
        <Grid item xs={12} sm={6} md={3}>
                     <Card sx={{ 
             background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
             color: 'white'
           }}>
             <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(contractorStats.totalEarnings)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    총 수익
                  </Typography>
                </Box>
                <MonetizationOn sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
                     <Card sx={{ 
             background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
             color: 'white'
           }}>
             <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(contractorStats.monthlyEarnings)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    이번 달 수익
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
                     <Card sx={{ 
             background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
             color: 'white'
           }}>
             <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {contractorStats.completedJobs}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    완료된 작업
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
                     <Card sx={{ 
             background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
             color: 'white'
           }}>
             <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(contractorStats.points)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    포인트 잔액
                  </Typography>
                </Box>
                <Star sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 성과 지표 및 레벨 진행률 */}
      <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} sx={{ mb: 3, px: { xs: 1, sm: 2, md: 3 } }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom>
                성과 지표
              </Typography>
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                      {contractorStats.completionRate.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      작업 완료율
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={contractorStats.completionRate}
                      sx={{ mt: 1, height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                      <Rating value={contractorStats.averageRating} readOnly precision={0.1} />
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        {contractorStats.averageRating.toFixed(1)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      평균 평점 ({contractorStats.totalReviews}개 리뷰)
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-2px)',
                transition: 'all 0.2s ease'
              }
            }}
            onClick={() => navigate('/contractor/level-progress')}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  레벨 진행률
                </Typography>
                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation(); // 이벤트 버블링 방지
                    navigate('/contractor/level-progress');
                  }}
                  endIcon={<ArrowForward />}
                >
                  상세보기
                </Button>
              </Box>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <CircularProgress
                    variant="determinate"
                    value={levelProgress.progress}
                    size={80}
                    thickness={8}
                    sx={{ color: 'primary.main' }}
                  />
                  <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)'
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Lv.{levelProgress.currentLevel}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  다음 레벨까지 {levelProgress.progress.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Lv.{levelProgress.nextLevel}까지 남음
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>


    </Box>
  );
};

export default Dashboard;
