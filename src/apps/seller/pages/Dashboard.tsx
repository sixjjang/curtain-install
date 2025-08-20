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
  Divider
} from '@mui/material';
import {
  Work,
  TrendingUp,
  Star,
  Add,
  Chat,
  Notifications
} from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { JobService } from '../../../shared/services/jobService';
import { NotificationService } from '../../../shared/services/notificationService';
import { ConstructionJob } from '../../../types';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<ConstructionJob[]>([]);
  const [chatNotifications, setChatNotifications] = useState<{[jobId: string]: number}>({});
  const [loading, setLoading] = useState(true);

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
      });
      
      return unsubscribe;
    }
  }, [user?.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // 작업 목록 가져오기
      const allJobs = await JobService.getAllJobs();
      const sellerJobs = allJobs.filter(job => job.sellerId === user?.id);
      setJobs(sellerJobs);
      
      // 채팅 알림 가져오기
      const notifications = await NotificationService.getNotifications(user!.id);
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
      case 'in_progress': return '진행중';
      case 'completed': return '완료';
      default: return '알 수 없음';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'assigned': return 'info';
      case 'product_preparing': return 'warning';
      case 'product_ready': return 'success';
      case 'pickup_completed': return 'info';
      case 'in_progress': return 'primary';
      case 'completed': return 'default';
      default: return 'default';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 통계 계산
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter(job => job.status === 'completed').length;
  const inProgressJobs = jobs.filter(job => ['assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress'].includes(job.status)).length;
  const pendingJobs = jobs.filter(job => job.status === 'pending').length;
  const averageRating = jobs.reduce((sum, job) => sum + (job.customerSatisfaction || 0), 0) / completedJobs || 0;
  const totalChatNotifications = Object.values(chatNotifications).reduce((sum, count) => sum + count, 0);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        판매자 대시보드
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Work />
                </Avatar>
                <Box>
                  <Typography variant="h4">{totalJobs}</Typography>
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
                  <Typography variant="h4">{averageRating.toFixed(1)}</Typography>
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
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <Star />
                </Avatar>
                <Box>
                  <Typography variant="h4">{inProgressJobs}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    진행중 작업
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
                  <Add />
                </Avatar>
                <Box>
                  <Typography variant="h4">{pendingJobs}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    대기중 작업
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 채팅 알림 카드 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: totalChatNotifications > 0 ? 'error.main' : 'grey.500', mr: 2 }}>
                  <Chat />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: totalChatNotifications > 0 ? 'error.main' : 'inherit' }}>
                    {totalChatNotifications}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    채팅 알림
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 채팅 알림이 있는 작업 목록 */}
      {totalChatNotifications > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chat color="error" />
              채팅 알림이 있는 작업
            </Typography>
            <List>
              {jobs
                .filter(job => chatNotifications[job.id] > 0)
                .map((job, index) => (
                  <React.Fragment key={job.id}>
                    <ListItem 
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                      onClick={async () => {
                        // 해당 작업의 채팅 알림을 읽음 처리
                        if (chatNotifications[job.id] > 0) {
                          try {
                            const notifications = await NotificationService.getNotifications(user!.id);
                            const chatNotificationsForJob = notifications.filter(
                              notification => 
                                notification.type === 'info' && 
                                notification.actionUrl?.includes(`/chat/${job.id}`) &&
                                !notification.isRead
                            );
                            
                            await Promise.all(
                              chatNotificationsForJob.map(notification => 
                                NotificationService.markAsRead(notification.id)
                              )
                            );
                          } catch (error) {
                            console.error('채팅 알림 읽음 처리 실패:', error);
                          }
                        }
                        navigate(`/seller/chat/${job.id}`);
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'error.main' }}>
                          <Chat />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1">
                              {job.title}
                            </Typography>
                            <Chip 
                              label={`💬 ${chatNotifications[job.id]}`}
                              color="error"
                              size="small"
                            />
                            <Chip 
                              label={getStatusText(job.status)} 
                              color={getStatusColor(job.status)} 
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" color="textSecondary">
                              {job.address}
                            </Typography>
                            {job.scheduledDate && (
                              <Typography variant="body2" color="textSecondary">
                                {formatDate(job.scheduledDate)} {formatTime(job.scheduledDate)}
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                    {index < jobs.filter(job => chatNotifications[job.id] > 0).length - 1 && <Divider />}
                  </React.Fragment>
                ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Dashboard;
