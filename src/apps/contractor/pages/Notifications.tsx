import React from 'react';
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
  Divider
} from '@mui/material';
import {
  Notifications,
  Work,
  TrendingUp,
  Info
} from '@mui/icons-material';

const NotificationsPage: React.FC = () => {
  const notifications = [
    {
      id: 1,
      title: '새로운 시공 작업',
      message: '거실 커튼 시공 작업이 등록되었습니다.',
      type: 'work',
      time: '2시간 전',
      isRead: false
    },
    {
      id: 2,
      title: '레벨업 축하!',
      message: 'Lv.3 주니어 시공자로 승급되었습니다!',
      type: 'level',
      time: '1일 전',
      isRead: false
    },
    {
      id: 3,
      title: '작업 완료',
      message: '침실 블라인드 설치 작업이 완료되었습니다.',
      type: 'work',
      time: '2일 전',
      isRead: true
    },
    {
      id: 4,
      title: '시스템 공지',
      message: '새로운 기능이 추가되었습니다.',
      type: 'info',
      time: '3일 전',
      isRead: true
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'work': return <Work />;
      case 'level': return <TrendingUp />;
      case 'info': return <Info />;
      default: return <Notifications />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'work': return 'primary';
      case 'level': return 'success';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        알림
      </Typography>

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
                          {notification.time}
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
    </Box>
  );
};

export default NotificationsPage;
