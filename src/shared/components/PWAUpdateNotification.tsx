import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { Update, Refresh, Close } from '@mui/icons-material';
import { usePWAUpdate } from '../hooks/usePWAUpdate';

const PWAUpdateNotification: React.FC = () => {
  const { hasUpdate, isUpdating, updateApp, skipUpdate } = usePWAUpdate();

  if (!hasUpdate) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        width: '90%',
        maxWidth: 400
      }}
    >
      <Card sx={{ boxShadow: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <Update sx={{ mr: 1 }} />
              앱 업데이트
            </Typography>
            <Button
              size="small"
              onClick={skipUpdate}
              sx={{ minWidth: 'auto', p: 0.5 }}
            >
              <Close />
            </Button>
          </Box>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              새로운 버전의 앱이 준비되었습니다. 업데이트하면 최신 기능을 사용할 수 있습니다.
            </Typography>
          </Alert>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={isUpdating ? <CircularProgress size={16} /> : <Refresh />}
              onClick={updateApp}
              disabled={isUpdating}
              fullWidth
            >
              {isUpdating ? '업데이트 중...' : '지금 업데이트'}
            </Button>
          </Box>
          
          <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1, textAlign: 'center' }}>
            업데이트 시 자동으로 새로고침됩니다
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PWAUpdateNotification;
