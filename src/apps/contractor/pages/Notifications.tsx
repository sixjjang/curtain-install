import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Notifications,
  Work,
  TrendingUp,
  Info,
  Chat
} from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { NotificationService } from '../../../shared/services/notificationService';
import { Notification } from '../../../types';

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 알림 데이터 로딩
  useEffect(() => {
    const loadNotifications = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const userNotifications = await NotificationService.getNotifications(user.id);
        setNotifications(userNotifications);
      } catch (error) {
        console.error('알림 로딩 실패:', error);
        setError('알림을 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [user?.id]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info />;
      case 'success': return <TrendingUp />;
      case 'warning': return <Work />;
      case 'error': return <Notifications />;
      default: return <Notifications />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'info': return 'info';
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  // 시간 포맷팅
  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;
    
    return time.toLocaleDateString('ko-KR');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box py={4}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        알림
      </Typography>
      
      {notifications.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <Notifications sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                알림이 없습니다
              </Typography>
              <Typography variant="body2" color="textSecondary">
                새로운 알림이 오면 여기에 표시됩니다.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <List>
              {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem 
                  sx={{ 
                    bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                    borderRadius: 1,
                    mb: 1
                  }}
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
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default NotificationsPage;
