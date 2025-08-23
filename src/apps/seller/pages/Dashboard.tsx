import React, { useState, useEffect } from 'react';
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
  ListItemText,
  ListItemAvatar,
  Divider,
  IconButton,
  LinearProgress,
  Alert,
  Paper,
  Stack,
  Badge,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Work,
  TrendingUp,
  Star,
  Add,
  Chat,
  Notifications,
  Schedule,
  CheckCircle,
  Pending,
  MonetizationOn,
  People,
  Assignment,
  NotificationsActive,
  Speed,
  CalendarToday,
  LocationOn,
  ArrowForward,
  Visibility
} from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { JobService } from '../../../shared/services/jobService';
import { NotificationService } from '../../../shared/services/notificationService';
import { PointService } from '../../../shared/services/pointService';
import { ConstructionJob } from '../../../types';
import { useNavigate } from 'react-router-dom';
import CreateJobDialog from '../components/CreateJobDialog';
import AdvertisementBanner from '../../../shared/components/AdvertisementBanner';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<ConstructionJob[]>([]);
  const [chatNotifications, setChatNotifications] = useState<{[jobId: string]: number}>({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalJobs: 0,
    pendingJobs: 0,
    inProgressJobs: 0,
    completedJobs: 0,
    totalRevenue: 0,
    pointBalance: 0,
    unreadNotifications: 0
  });
  const [createJobDialogOpen, setCreateJobDialogOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id]);

  // 실시간 알림 구독
  useEffect(() => {
    if (user?.id) {
      const unsubscribe = NotificationService.subscribeToNotifications(user.id, (notifications) => {
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
        setStats(prev => ({ ...prev, unreadNotifications: notifications.filter(n => !n.isRead).length }));
      });
      
      return unsubscribe;
    }
  }, [user?.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // 병렬로 데이터 로딩
      const [allJobs, notifications, pointBalance] = await Promise.allSettled([
        JobService.getAllJobs(),
        NotificationService.getNotifications(user!.id),
        PointService.getPointBalance(user!.id, 'seller')
      ]);

      // 작업 데이터 처리
      if (allJobs.status === 'fulfilled') {
        const sellerJobs = allJobs.value.filter(job => job.sellerId === user?.id);
        setJobs(sellerJobs);
        
        // 통계 계산
        const totalJobs = sellerJobs.length;
        const pendingJobs = sellerJobs.filter(job => job.status === 'pending').length;
        const inProgressJobs = sellerJobs.filter(job => 
          job.status === 'assigned' || job.status === 'in_progress' || 
          job.status === 'product_preparing' || job.status === 'product_ready'
        ).length;
        const completedJobs = sellerJobs.filter(job => job.status === 'completed').length;
        
        // 총 수익 계산
        const totalRevenue = sellerJobs.reduce((sum, job) => {
          if (job.items && job.items.length > 0) {
            return sum + job.items.reduce((itemSum, item) => itemSum + item.totalPrice, 0);
          }
          return sum;
        }, 0);

        setStats(prev => ({
          ...prev,
          totalJobs,
          pendingJobs,
          inProgressJobs,
          completedJobs,
          totalRevenue
        }));
      }

      // 포인트 잔액 처리
      if (pointBalance.status === 'fulfilled') {
        setStats(prev => ({ ...prev, pointBalance: pointBalance.value }));
      }

      // 채팅 알림 처리
      if (notifications.status === 'fulfilled') {
        const notifs = notifications.value;
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
        setStats(prev => ({ ...prev, unreadNotifications: notifs.filter(n => !n.isRead).length }));
      }
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const getRecentJobs = () => {
    return jobs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  };

  const getJobsWithChatNotifications = () => {
    return jobs.filter(job => chatNotifications[job.id] > 0);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* 환영 메시지 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          안녕하세요, {user?.name || '판매자'}님! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          오늘도 좋은 하루 되세요. 현재 {stats.totalJobs}개의 작업이 등록되어 있습니다.
        </Typography>
      </Box>

      {/* 대시보드 광고 */}
      <Box sx={{ mb: 3 }}>
        <AdvertisementBanner 
          position="dashboard" 
          maxCount={1} 
          height={200}
          showTitle={true}
        />
      </Box>

      {/* 빠른 액션 버튼 */}
      <Paper sx={{ p: 2, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
          빠른 액션
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateJobDialogOpen(true)}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            >
              새 작업 등록
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Chat />}
              onClick={() => navigate('/seller/contractor-chat')}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            >
              채팅 확인
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Notifications />}
              onClick={() => navigate('/seller/notifications')}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            >
              알림 확인
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Work />}
              onClick={() => navigate('/seller/jobs')}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            >
              작업 관리
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* 통계 카드 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.totalJobs}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    총 작업 수
                  </Typography>
                </Box>
                <Work sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.inProgressJobs}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    진행중
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
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(stats.totalRevenue)}
                  </Typography>
                                     <Typography variant="body2" sx={{ opacity: 0.8 }}>
                     총 사용액
                   </Typography>
                </Box>
                <MonetizationOn sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(stats.pointBalance)}
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

      {/* 작업 진행률 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                작업 진행률
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">완료율</Typography>
                  <Typography variant="body2">
                    {stats.totalJobs > 0 ? Math.round((stats.completedJobs / stats.totalJobs) * 100) : 0}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.totalJobs > 0 ? (stats.completedJobs / stats.totalJobs) * 100 : 0}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="warning.main">
                      {stats.pendingJobs}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      대기중
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="success.main">
                      {stats.completedJobs}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      완료
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                알림 현황
              </Typography>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Badge badgeContent={stats.unreadNotifications} color="error">
                  <NotificationsActive sx={{ fontSize: 60, color: 'primary.main' }} />
                </Badge>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {stats.unreadNotifications}개
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  읽지 않은 알림
                </Typography>
              </Box>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/seller/notifications')}
                endIcon={<ArrowForward />}
              >
                알림 확인하기
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 최근 작업 및 채팅 알림 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  최근 작업
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/seller/jobs')}
                  endIcon={<ArrowForward />}
                >
                  전체보기
                </Button>
              </Box>
              <List>
                {getRecentJobs().map((job, index) => (
                  <React.Fragment key={job.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: `${getStatusColor(job.status)}.main` }}>
                          {getStatusIcon(job.status)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2" noWrap>
                              {job.title || '제목 없음'}
                            </Typography>
                            <Chip
                              label={getStatusText(job.status)}
                              color={getStatusColor(job.status) as any}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {job.address}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(job.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/seller/jobs`)}
                      >
                        <Visibility />
                      </IconButton>
                    </ListItem>
                    {index < getRecentJobs().length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  채팅 알림
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/seller/contractor-chat')}
                  endIcon={<ArrowForward />}
                >
                  전체보기
                </Button>
              </Box>
              {getJobsWithChatNotifications().length > 0 ? (
                <List>
                  {getJobsWithChatNotifications().map((job, index) => (
                    <React.Fragment key={job.id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Badge badgeContent={chatNotifications[job.id]} color="error">
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              <Chat />
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="subtitle2" noWrap>
                                {job.title || '제목 없음'}
                              </Typography>
                              <Chip
                                label={`${chatNotifications[job.id]}개`}
                                color="error"
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {job.address}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {new Date(job.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          }
                        />
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/seller/contractor-chat`)}
                        >
                          <ArrowForward />
                        </IconButton>
                      </ListItem>
                      {index < getJobsWithChatNotifications().length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Chat sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    새로운 채팅 알림이 없습니다
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 새 작업 등록 다이얼로그 */}
      <CreateJobDialog
        open={createJobDialogOpen}
        onClose={() => setCreateJobDialogOpen(false)}
        onJobCreated={() => {
          setCreateJobDialogOpen(false);
          // 새 작업이 생성되면 대시보드 데이터를 다시 로드
          loadDashboardData();
        }}
      />
    </Box>
  );
};

export default Dashboard;
