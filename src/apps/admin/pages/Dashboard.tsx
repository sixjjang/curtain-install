import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip
} from '@mui/material';
import {
  People,
  Work,
  TrendingUp,
  Star,
  AccessTime
} from '@mui/icons-material';
import { SystemSettingsService } from '../../../shared/services/systemSettingsService';

const Dashboard: React.FC = () => {
  const [escrowHours, setEscrowHours] = useState(48);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const hours = await SystemSettingsService.getEscrowAutoReleaseHours();
        setEscrowHours(hours);
      } catch (error) {
        console.error('시스템 설정 로드 실패:', error);
      }
    };

    loadSettings();
  }, []);

  const formatTimeDisplay = (hours: number) => {
    if (hours < 24) {
      return `${hours}시간`;
    } else if (hours < 168) {
      return `${(hours / 24).toFixed(1)}일`;
    } else {
      return `${(hours / 168).toFixed(1)}주`;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        관리자 대시보드
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <People />
                </Avatar>
                <Box>
                  <Typography variant="h4">156</Typography>
                  <Typography variant="body2" color="textSecondary">
                    총 사용자
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
                  <Work />
                </Avatar>
                <Box>
                  <Typography variant="h4">89</Typography>
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
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="h4">4.7</Typography>
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
                  <Star />
                </Avatar>
                <Box>
                  <Typography variant="h4">23</Typography>
                  <Typography variant="body2" color="textSecondary">
                    활성 시공자
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 시스템 설정 정보 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTime />
                현재 시스템 설정
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <Chip 
                  label={`에스크로 자동 지급: ${formatTimeDisplay(escrowHours)}`}
                  color="primary"
                  variant="outlined"
                  size="medium"
                />
                <Typography variant="body2" color="textSecondary">
                  시공 완료 후 {formatTimeDisplay(escrowHours)} 후 자동으로 시공자에게 포인트가 지급됩니다.
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
