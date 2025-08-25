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
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton
} from '@mui/material';
import {
  Notifications,
  Work,
  TrendingUp,
  Info,
  Chat,
  Close
} from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { NotificationService } from '../../../shared/services/notificationService';
import { Notification } from '../../../types';

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);

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

  // 알림 클릭 핸들러
  const handleNotificationClick = async (notification: Notification) => {
    setSelectedNotification(notification);
    setDetailDialogOpen(true);
    
    // 읽지 않은 알림인 경우 읽음 처리
    if (!notification.isRead) {
      try {
        await NotificationService.markAsRead(notification.id);
        // 로컬 상태 업데이트
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
      } catch (error) {
        console.error('알림 읽음 처리 실패:', error);
      }
    }
  };

  // 상세보기 다이얼로그 닫기
  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedNotification(null);
    setNavigating(false);
  };

  // 관련 페이지로 이동
  const handleNavigateToRelatedPage = () => {
    if (selectedNotification?.actionUrl) {
      console.log('🔍 알림 관련 페이지 이동:', selectedNotification.actionUrl);
      setNavigating(true);
      handleCloseDetailDialog();
      navigate(selectedNotification.actionUrl);
    }
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
                    mb: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover'
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
                        <Typography variant="body2" color="textSecondary" component="span" display="block" sx={{ mb: 0.5 }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" component="span" display="block">
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

      {/* 알림 상세보기 다이얼로그 */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetailDialog}
        maxWidth="sm"
        fullWidth
        aria-labelledby="notification-detail-dialog-title"
        aria-describedby="notification-detail-dialog-description"
      >
        <DialogTitle 
          id="notification-detail-dialog-title"
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            bgcolor: selectedNotification ? `${getColor(selectedNotification.type)}.light` : 'background.paper'
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            {selectedNotification && getIcon(selectedNotification.type)}
            <Typography variant="h6">
              {selectedNotification?.title || '알림 상세'}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseDetailDialog}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent 
          id="notification-detail-dialog-description"
          sx={{ pt: 3 }}
        >
          {selectedNotification && (
            <Box>
              <Typography variant="body1" paragraph>
                {selectedNotification.message}
              </Typography>
                             <Box sx={{ mt: 2, p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                 <Typography variant="body2" color="textSecondary">
                   <strong>알림 유형:</strong> {selectedNotification.type}
                 </Typography>
                 <Typography variant="body2" color="textSecondary">
                   <strong>수신 시간:</strong> {formatTime(selectedNotification.createdAt)}
                 </Typography>
                 {selectedNotification.actionUrl && (
                   <Typography variant="body2" color="textSecondary">
                     <strong>관련 링크:</strong> {selectedNotification.actionUrl}
                   </Typography>
                 )}
                 <Typography variant="body2" color="textSecondary" sx={{ mt: 1, fontSize: '0.75rem', fontStyle: 'italic' }}>
                   * 관련 페이지로 이동 버튼을 클릭하면 해당 페이지로 이동합니다.
                 </Typography>
               </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDetailDialog} variant="outlined">
            닫기
          </Button>
                     {selectedNotification?.actionUrl && (
             <Button 
               variant="contained" 
               color="primary"
               onClick={handleNavigateToRelatedPage}
               disabled={navigating}
               startIcon={navigating ? <CircularProgress size={16} /> : undefined}
             >
               {navigating ? '이동 중...' : '관련 페이지로 이동'}
             </Button>
           )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationsPage;
