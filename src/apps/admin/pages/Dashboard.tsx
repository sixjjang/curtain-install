import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  People,
  Work,
  TrendingUp,
  Star,
  AccessTime,
  AttachMoney,
  Schedule,
  CheckCircle,
  Warning
} from '@mui/icons-material';
import { SystemSettingsService } from '../../../shared/services/systemSettingsService';
import { AnalyticsService } from '../../../shared/services/analyticsService';
import { AuthService } from '../../../shared/services/authService';
import { JobService } from '../../../shared/services/jobService';

interface DashboardStats {
  totalUsers: number;
  totalJobs: number;
  averageRating: number;
  activeContractors: number;
  totalRevenue: number;
  pendingApprovals: number;
  completedJobs: number;
  inProgressJobs: number;
}

const Dashboard: React.FC = () => {
  const [escrowHours, setEscrowHours] = useState(48);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalJobs: 0,
    averageRating: 0,
    activeContractors: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
    completedJobs: 0,
    inProgressJobs: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 시스템 설정 로드
        const hours = await SystemSettingsService.getEscrowAutoReleaseHours();
        setEscrowHours(hours);

        // 분석 데이터 로드
        const analyticsData = await AnalyticsService.getAnalyticsData('all');
        console.log('📊 AnalyticsData:', analyticsData);
        
        // 안전한 데이터 접근
        const userStats = analyticsData?.userStats || {};
        const jobStats = analyticsData?.jobStats || {};
        const revenueAnalysis = analyticsData?.revenueAnalysis || {};
        const ratingAnalysis = analyticsData?.ratingAnalysis || {};
        
        console.log('👥 UserStats:', userStats);
        console.log('📋 JobStats:', jobStats);
        console.log('💰 RevenueAnalysis:', revenueAnalysis);
        console.log('⭐ RatingAnalysis:', ratingAnalysis);
        
        // 사용자 통계 계산
        const totalUsers = userStats.totalUsers || 0;
        const pendingApprovals = userStats.pendingApprovals || 0;
        const activeContractors = userStats.activeContractors || 0;

        // 작업 통계 계산
        const totalJobs = jobStats.totalJobs || 0;
        const completedJobs = jobStats.completedJobs || 0;
        const inProgressJobs = jobStats.inProgressJobs || 0;

        // 수익 통계
        const totalRevenue = revenueAnalysis.totalRevenue || 0;

        // 평균 평점 계산
        const averageRating = ratingAnalysis.averageRating || 0;

        setStats({
          totalUsers,
          totalJobs,
          averageRating,
          activeContractors,
          totalRevenue,
          pendingApprovals,
          completedJobs,
          inProgressJobs
        });

      } catch (error) {
        console.error('대시보드 데이터 로드 실패:', error);
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        관리자 대시보드
      </Typography>

      <Grid container spacing={3}>
        {/* 사용자 통계 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <People />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.totalUsers}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    총 사용자
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 작업 통계 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <Work />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.totalJobs}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    총 시공 건수
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 평균 평점 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <Star />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.averageRating.toFixed(1)}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    평균 평점
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 활성 시공자 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.activeContractors}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    활성 시공자
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 수익 통계 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <AttachMoney />
                </Avatar>
                <Box>
                  <Typography variant="h4">{formatCurrency(stats.totalRevenue)}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    총 수익
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 승인 대기 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <Schedule />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.pendingApprovals}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    승인 대기
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 완료된 작업 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.completedJobs}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    완료된 작업
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 진행 중인 작업 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.inProgressJobs}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    진행 중인 작업
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

        {/* 빠른 액션 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                빠른 액션
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {stats.pendingApprovals > 0 && (
                  <Chip 
                    icon={<Warning />}
                    label={`승인 대기 ${stats.pendingApprovals}건`}
                    color="warning"
                    variant="outlined"
                    clickable
                    onClick={() => window.location.href = '/admin/users'}
                  />
                )}
                <Chip 
                  icon={<People />}
                  label="사용자 관리"
                  color="primary"
                  variant="outlined"
                  clickable
                  onClick={() => window.location.href = '/admin/users'}
                />
                <Chip 
                  icon={<Work />}
                  label="작업 관리"
                  color="success"
                  variant="outlined"
                  clickable
                  onClick={() => window.location.href = '/admin/jobs'}
                />
                <Chip 
                  icon={<TrendingUp />}
                  label="분석 보기"
                  color="info"
                  variant="outlined"
                  clickable
                  onClick={() => window.location.href = '/admin/analytics'}
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
