import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Notifications,
  AccountBalance,
  Payment,
  ArrowForward,
  Close
} from '@mui/icons-material';
import { AdminNotificationData } from '../../../shared/services/adminNotificationService';

interface AdminNotificationPopupProps {
  open: boolean;
  onClose: () => void;
  notifications: AdminNotificationData;
  onNavigateToManualCharges: () => void;
  onNavigateToWithdrawals: () => void;
}

const AdminNotificationPopup: React.FC<AdminNotificationPopupProps> = ({
  open,
  onClose,
  notifications,
  onNavigateToManualCharges,
  onNavigateToWithdrawals
}) => {
  const hasNotifications = notifications.totalNewRequests > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        pb: 1
      }}>
        <Box sx={{
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '50%',
          p: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Notifications sx={{ color: 'white', fontSize: 24 }} />
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
            새로운 요청 알림
          </Typography>
        </Box>
        <Chip 
          label={notifications.totalNewRequests} 
          color="error" 
          size="small"
          sx={{ 
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            fontWeight: 'bold'
          }}
        />
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {hasNotifications ? (
          <Box>
            <Typography variant="body1" sx={{ mb: 2, opacity: 0.9 }}>
              새로운 요청건이 있습니다. 확인 후 처리해주세요.
            </Typography>
            
            <List sx={{ p: 0 }}>
              {notifications.manualChargeRequests > 0 && (
                <ListItem 
                  button 
                  onClick={onNavigateToManualCharges}
                  sx={{ 
                    borderRadius: 1, 
                    mb: 1,
                    background: 'rgba(255,255,255,0.1)',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.2)'
                    }
                  }}
                >
                  <ListItemIcon>
                    <AccountBalance sx={{ color: 'white' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="수동 계좌이체 요청"
                    secondary={`${notifications.manualChargeRequests}건의 새로운 충전 요청`}
                    primaryTypographyProps={{ fontWeight: 'bold' }}
                    secondaryTypographyProps={{ color: 'rgba(255,255,255,0.8)' }}
                  />
                  <Chip 
                    label={notifications.manualChargeRequests} 
                    color="error" 
                    size="small"
                    sx={{ 
                      background: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                  <ArrowForward sx={{ ml: 1, color: 'white' }} />
                </ListItem>
              )}

              {notifications.pointWithdrawals > 0 && (
                <ListItem 
                  button 
                  onClick={onNavigateToWithdrawals}
                  sx={{ 
                    borderRadius: 1,
                    background: 'rgba(255,255,255,0.1)',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.2)'
                    }
                  }}
                >
                  <ListItemIcon>
                    <Payment sx={{ color: 'white' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="포인트 인출 요청"
                    secondary={`${notifications.pointWithdrawals}건의 새로운 인출 요청`}
                    primaryTypographyProps={{ fontWeight: 'bold' }}
                    secondaryTypographyProps={{ color: 'rgba(255,255,255,0.8)' }}
                  />
                  <Chip 
                    label={notifications.pointWithdrawals} 
                    color="error" 
                    size="small"
                    sx={{ 
                      background: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                  <ArrowForward sx={{ ml: 1, color: 'white' }} />
                </ListItem>
              )}
            </List>
          </Box>
        ) : (
          <Box textAlign="center" py={3}>
            <Notifications sx={{ fontSize: 48, opacity: 0.5, mb: 2 }} />
            <Typography variant="h6" sx={{ opacity: 0.8 }}>
              새로운 요청이 없습니다
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.6, mt: 1 }}>
              모든 요청이 처리되었습니다.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          startIcon={<Close />}
          sx={{ 
            color: 'white', 
            borderColor: 'rgba(255,255,255,0.3)',
            '&:hover': {
              borderColor: 'white',
              background: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminNotificationPopup;
