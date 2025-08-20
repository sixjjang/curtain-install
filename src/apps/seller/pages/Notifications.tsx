import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Divider,
  IconButton,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Notifications,
  Work,
  TrendingUp,
  Info,
  Chat,
  ArrowBack,
  CheckCircle
} from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { NotificationService } from '../../../shared/services/notificationService';
import { Notification } from '../../../types';

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }
  }, [user?.id]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const notificationsData = await NotificationService.getNotifications(user!.id);
      setNotifications(notificationsData);
    } catch (error) {
      console.error('알림 로드 실패:', error);
      setError('알림을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // 알림 읽음 처리
      await NotificationService.markAsRead(notification.id);
      
      // 알림 목록 새로고침
      await loadNotifications();
      
      // 액션 URL로 이동
      if (notification.actionUrl) {
        navigate(notification.actionUrl);
      }
    } catch (error) {
      console.error('알림 처리 실패:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead(user!.id);
      await loadNotifications();
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'work': return <Work />;
      case 'level': return <TrendingUp />;
      case 'info': return <Info />;
      case 'chat': return <Chat />;
      default: return <Notifications />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'work': return 'primary';
      case 'level': return 'success';
      case 'info': return 'info';
      case 'chat': return 'secondary';
      default: return 'default';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* 헤더 */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton onClick={() => navigate('/seller')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4">
          알림
        </Typography>
        {notifications.some(n => !n.isRead) && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<CheckCircle />}
            onClick={handleMarkAllAsRead}
          >
            모두 읽음 처리
          </Button>
        )}
      </Box>

      <Card>
        <CardContent>
          {notifications.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Notifications sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                알림이 없습니다
              </Typography>
              <Typography variant="body2" color="textSecondary">
                새로운 알림이 오면 여기에 표시됩니다.
              </Typography>
            </Box>
          ) : (
            <List>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem 
                    sx={{ 
                      bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                      borderRadius: 1,
                      mb: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: notification.isRead ? 'action.hover' : 'action.selected'
                      }
                    }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: `${getColor(notification.type)}.main` }}>
                        {getIcon(notification.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1">
                            {notification.title}
                          </Typography>
                          {!notification.isRead && (
                            <Chip label="새" color="error" size="small" />
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="textSecondary" display="block">
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" display="block">
                            {formatTime(notification.createdAt)}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default NotificationsPage;
