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
  LinearProgress,
  Alert,
  CircularProgress,
  Skeleton
} from '@mui/material';
import {
  Work,
  TrendingUp,
  Star,
  Notifications,
  LocationOn,
  Schedule,
  CheckCircle,
  Pending
} from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { ContractorInfo, ConstructionJob, Notification } from '../../../types';
import { JobService } from '../../../shared/services/jobService';
import { NotificationService } from '../../../shared/services/notificationService';
import { ContractorService } from '../../../shared/services/contractorService';

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
  const [contractorStats, setContractorStats] = useState({
    totalJobs: 0,
    completedJobs: 0,
    totalEarnings: 0,
    rating: 0,
    level: 1,
    points: 0
  });
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
        const [jobsData, notificationsData, contractorStatsData] = await Promise.allSettled([
          JobService.getJobsByContractor(user.id),
          NotificationService.getNotifications(user.id),
          ContractorService.getContractorStats(user.id)
        ]);

        // 시공 작업 데이터 처리
        if (jobsData.status === 'fulfilled') {
          const jobs = jobsData.value;
          // 배정된 작업만 필터링 (최대 5개)
          const assignedJobs = jobs
            .filter(job => job.status === 'assigned' || job.status === 'in_progress')
            .slice(0, 5);
          setScheduledJobs(assignedJobs);
        }

        // 알림 데이터 처리
        if (notificationsData.status === 'fulfilled') {
          const notifs = notificationsData.value;
          // 읽지 않은 알림만 필터링 (최대 10개)
          const unreadNotifications = notifs
            .filter(notif => !notif.isRead)
            .slice(0, 10);
          setNotifications(unreadNotifications);
        }

        // 시공자 통계 데이터 처리
        if (contractorStatsData.status === 'fulfilled') {
          setContractorStats(contractorStatsData.value);
        }

      } catch (err) {
        console.error('대시보드 데이터 로딩 실패:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'assigned': return 'info';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'assigned': return '배정됨';
      case 'in_progress': return '진행중';
      case 'completed': return '완료';
      case 'cancelled': return '취소됨';
      default: return '알 수 없음';
    }
  };



  // 오늘의 목표 계산
  const calculateTodayGoals = () => {
    const today = new Date();
    const todayJobs = scheduledJobs.filter(job => {
      if (!job.scheduledDate) return false;
      const jobDate = new Date(job.scheduledDate);
      return jobDate.toDateString() === today.toDateString();
    });

    const completedToday = todayJobs.filter(job => job.status === 'completed').length;
    const totalToday = todayJobs.length;

    return {
      completed: completedToday,
      total: totalToday,
      progress: totalToday > 0 ? (completedToday / totalToday) * 100 : 0
    };
  };

  const todayGoals = calculateTodayGoals();

  // 동적 인사말 생성 함수
  const generateGreeting = () => {
    const now = new Date();
    const hour = now.getHours();
    const month = now.getMonth() + 1; // 0-11을 1-12로 변환
    const todayJobsCount = todayGoals.total;
    const completedJobsCount = todayGoals.completed;
    
    // 시간대별 기본 인사말
    let timeGreeting = '';
    if (hour >= 5 && hour < 12) {
      timeGreeting = '좋은 아침입니다';
    } else if (hour >= 12 && hour < 18) {
      timeGreeting = '안녕하세요';
    } else if (hour >= 18 && hour < 22) {
      timeGreeting = '좋은 저녁입니다';
    } else {
      timeGreeting = '수고하셨습니다';
    }

    // 계절별 인사말
    let seasonGreeting = '';
    if (month >= 3 && month <= 5) {
      seasonGreeting = '🌸 봄날의 시공, 기분 좋은 하루 되세요!';
    } else if (month >= 6 && month <= 8) {
      seasonGreeting = '☀️ 더운 여름, 시공하실 때 더욱 조심하세요!';
    } else if (month >= 9 && month <= 11) {
      seasonGreeting = '🍁 가을의 시공, 상쾌한 하루 되세요!';
    } else {
      seasonGreeting = '❄️ 추운 겨울, 시공하실 때 보온에 유의하세요!';
    }

    // 시공 일정에 따른 인사말
    let scheduleGreeting = '';
    if (todayJobsCount === 0) {
      scheduleGreeting = '오늘은 시공 일정이 없네요. 여유로운 하루 되세요! 😊';
    } else if (todayJobsCount === 1) {
      scheduleGreeting = '오늘 시공 1건이 있네요. 차근차근 진행하세요! 💪';
    } else if (todayJobsCount <= 3) {
      scheduleGreeting = `오늘 시공 ${todayJobsCount}건이 있네요. 힘내세요! 아자아자! 🔥`;
    } else if (todayJobsCount <= 5) {
      scheduleGreeting = `오늘 시공이 ${todayJobsCount}건이나 되네요! 정말 바쁘시겠어요. 화이팅! ⚡`;
    } else {
      scheduleGreeting = `오늘 시공이 ${todayJobsCount}건이나 되네요! 정말 대단하세요! 슈퍼맨! 🦸‍♂️`;
    }

    // 완료된 작업에 따른 격려
    let completionGreeting = '';
    if (completedJobsCount > 0) {
      if (completedJobsCount === todayJobsCount) {
        completionGreeting = '오늘 모든 시공을 완료하셨네요! 정말 수고하셨습니다! 🎉';
      } else if (completedJobsCount >= todayJobsCount * 0.7) {
        completionGreeting = `이미 ${completedJobsCount}건을 완료하셨네요! 거의 다 끝나가요! 🚀`;
      } else {
        completionGreeting = `이미 ${completedJobsCount}건을 완료하셨네요! 잘 하고 계세요! 👍`;
      }
    }

    // 운전 관련 인사말 (아침이나 오후에만)
    let drivingGreeting = '';
    if ((hour >= 6 && hour < 10) || (hour >= 14 && hour < 18)) {
      drivingGreeting = '🚗 이동하실 때 운전 조심하세요!';
    }

    // 최종 인사말 조합
    let finalGreeting = `${timeGreeting}, ${user?.name || '시공자'}님! 👋`;
    
    // 추가 메시지들
    const additionalMessages = [
      seasonGreeting,
      scheduleGreeting,
      completionGreeting,
      drivingGreeting
    ].filter(msg => msg !== '');

    return {
      main: finalGreeting,
      additional: additionalMessages
    };
  };

  const greeting = generateGreeting();

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          안녕하세요, {user?.name || '시공자'}님! 👋
        </Typography>
        
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Skeleton variant="text" width="60%" height={32} />
                      <Skeleton variant="text" width="80%" height={20} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
          
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
                {[1, 2, 3].map((item) => (
                  <Skeleton key={item} variant="rectangular" height={80} sx={{ mb: 1, borderRadius: 1 }} />
                ))}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
                {[1, 2, 3].map((item) => (
                  <Skeleton key={item} variant="rectangular" height={48} sx={{ mb: 1, borderRadius: 1 }} />
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {greeting.main}
      </Typography>
      
      {/* 동적 인사말 메시지들 */}
      {greeting.additional.length > 0 && (
        <Box mb={3}>
          {greeting.additional.map((message, index) => (
            <Typography 
              key={index} 
              variant="body1" 
              color="textSecondary" 
              sx={{ mb: 1 }}
            >
              {message}
            </Typography>
          ))}
        </Box>
      )}

      {/* 에러 알림 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 새로운 알림이 있을 때만 표시 */}
      {notifications.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          새로운 알림이 {notifications.length}건 있습니다. 확인해보세요!
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* 통계 카드들 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Work />
                </Avatar>
                <Box>
                  <Typography variant="h4">{contractorStats.totalJobs}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    총 시공 건수
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="h4">{contractorStats.level}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    현재 레벨
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <Star />
                </Avatar>
                <Box>
                  <Typography variant="h4">{Number(contractorStats.rating).toFixed(1)}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    평균 평점
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <Notifications />
                </Avatar>
                <Box>
                  <Typography variant="h4">{notifications.length}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    새로운 알림
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 최근 작업 목록 */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">시공예정작업</Typography>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => navigate('/contractor/my-jobs')}
                >
                  전체 보기
                </Button>
              </Box>
              
              {scheduledJobs.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Work sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="textSecondary">
                    현재 시공 예정인 작업이 없습니다.
                  </Typography>
                </Box>
              ) : (
                <List>
                  {scheduledJobs.map((job) => (
                    <ListItem 
                      key={job.id}
                      button
                      onClick={() => navigate(`/contractor/jobs/${job.id}`)}
                      sx={{ 
                        border: 1, 
                        borderColor: 'divider', 
                        borderRadius: 1, 
                        mb: 1,
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <Work />
                        </Avatar>
                      </ListItemAvatar>
                      <Box sx={{ flexGrow: 1 }}>
                                                 <Box display="flex" alignItems="center" gap={1} mb={1}>
                           <Typography variant="subtitle1">{job.title}</Typography>
                           <Chip 
                             label={getStatusText(job.status)} 
                             color={getStatusColor(job.status)}
                             size="small"
                           />
                         </Box>
                        <Box>
                          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                            <LocationOn fontSize="small" color="action" />
                            <Typography variant="body2">{job.address}</Typography>
                          </Box>
                          {job.scheduledDate && (
                            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                              <Schedule fontSize="small" color="action" />
                              <Typography variant="body2">
                                시공예정: {new Date(job.scheduledDate).toLocaleDateString('ko-KR', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  weekday: 'short'
                                })}
                              </Typography>
                            </Box>
                          )}
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" color="textSecondary">
                              {job.finalAmount 
                                ? `${job.finalAmount.toLocaleString()}원` 
                                : calculateTotalBudget(job) > 0 
                                  ? `${calculateTotalBudget(job).toLocaleString()}원`
                                  : '예산 미정'
                              }
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 빠른 액션 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                빠른 액션
              </Typography>
              
              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Work />}
                  onClick={() => navigate('/contractor/jobs')}
                >
                  시공건 찾기
                </Button>
                
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<TrendingUp />}
                  onClick={() => navigate('/contractor/level')}
                >
                  레벨 현황 확인
                </Button>
                
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Notifications />}
                  onClick={() => navigate('/contractor/notifications')}
                >
                  알림 확인
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* 오늘의 목표 */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                오늘의 목표
              </Typography>
              
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">시공 완료</Typography>
                  <Typography variant="body2">
                    {todayGoals.completed}/{todayGoals.total}건
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={todayGoals.progress} 
                />
              </Box>
              
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">평점 달성</Typography>
                  <Typography variant="body2">
                    {Number(contractorStats.rating).toFixed(1)}/5.0점
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(contractorStats.rating / 5) * 100} 
                  color="success" 
                />
              </Box>
              
              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">포인트</Typography>
                  <Typography variant="body2">
                    {contractorStats.points.toLocaleString()}점
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min((contractorStats.points / 1000) * 100, 100)} 
                  color="warning" 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
