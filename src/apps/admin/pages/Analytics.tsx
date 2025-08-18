import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  TrendingUp,
  People,
  LocationOn,
  Store,
  Schedule,
  AttachMoney,
  Star
} from '@mui/icons-material';
import { AnalyticsService, AnalyticsData } from '../../../shared/services/analyticsService';

const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('all');

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AnalyticsService.getAnalyticsData(selectedPeriod);
      setAnalyticsData(data);
    } catch (error) {
      setError('분석 데이터를 불러올 수 없습니다.');
      console.error('분석 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  const formatTime = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}분`;
    }
    return `${hours.toFixed(1)}시간`;
  };

  const getStatusLabel = (status: string) => {
    const statusLabels: { [key: string]: string } = {
      pending: '대기중',
      assigned: '배정됨',
      product_preparing: '제품준비중',
      product_ready: '제품준비완료',
      pickup_completed: '픽업완료',
      in_progress: '진행중',
      completed: '완료',
      cancelled: '취소'
    };
    return statusLabels[status] || status;
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
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!analyticsData) {
    return (
      <Box>
        <Typography variant="h6" color="textSecondary">
          분석 데이터가 없습니다.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          플랫폼 분석
        </Typography>
        
        {/* 기간 필터링 */}
        <ToggleButtonGroup
          value={selectedPeriod}
          exclusive
          onChange={(_, newPeriod) => {
            if (newPeriod !== null) {
              setSelectedPeriod(newPeriod);
            }
          }}
          size="small"
        >
          <ToggleButton value="daily">일간</ToggleButton>
          <ToggleButton value="weekly">주간</ToggleButton>
          <ToggleButton value="monthly">월간</ToggleButton>
          <ToggleButton value="all">전체</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* 시공금액 분석 */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center' }}>
        <AttachMoney sx={{ mr: 1 }} />
        시공금액 분석
      </Typography>
      
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                총 수익
              </Typography>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {formatCurrency(analyticsData.revenueAnalysis.totalRevenue)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                평균 수익: {formatCurrency(analyticsData.revenueAnalysis.averageRevenue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                상태별 수익
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>상태</TableCell>
                      <TableCell align="right">수익</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analyticsData.revenueAnalysis.revenueByStatus.map((item) => (
                      <TableRow key={item.status}>
                        <TableCell>
                          <Chip 
                            label={getStatusLabel(item.status)} 
                            size="small" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(item.revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 시공자별 분석 */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center' }}>
        <People sx={{ mr: 1 }} />
        시공자별 분석
      </Typography>
      
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                상위 시공자 (수익 기준)
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>시공자</TableCell>
                      <TableCell align="right">작업 수</TableCell>
                      <TableCell align="right">수익</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analyticsData.contractorAnalysis.topContractors.map((contractor) => (
                      <TableRow key={contractor.contractorId}>
                        <TableCell>{contractor.name}</TableCell>
                        <TableCell align="right">{contractor.jobs}건</TableCell>
                        <TableCell align="right">{formatCurrency(contractor.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                시공자 성과 (평점 기준)
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>시공자</TableCell>
                      <TableCell align="right">평균 시간</TableCell>
                      <TableCell align="right">평점</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analyticsData.contractorAnalysis.contractorPerformance.map((contractor) => (
                      <TableRow key={contractor.contractorId}>
                        <TableCell>{contractor.name}</TableCell>
                        <TableCell align="right">{formatTime(contractor.avgTime)}</TableCell>
                        <TableCell align="right">
                          <Box display="flex" alignItems="center" justifyContent="flex-end">
                            <Star sx={{ fontSize: 16, color: 'gold', mr: 0.5 }} />
                            {contractor.rating.toFixed(1)}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 지역별 분석 */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center' }}>
        <LocationOn sx={{ mr: 1 }} />
        지역별 분석
      </Typography>
      
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                상위 지역 (수익 기준)
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>지역</TableCell>
                      <TableCell align="right">작업 수</TableCell>
                      <TableCell align="right">수익</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analyticsData.locationAnalysis.topLocations.map((location) => (
                      <TableRow key={location.location}>
                        <TableCell>{location.location}</TableCell>
                        <TableCell align="right">{location.jobs}건</TableCell>
                        <TableCell align="right">{formatCurrency(location.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 판매자별 분석 */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center' }}>
        <Store sx={{ mr: 1 }} />
        판매자별 분석
      </Typography>
      
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                상위 판매자 (수익 기준)
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>판매자</TableCell>
                      <TableCell align="right">작업 수</TableCell>
                      <TableCell align="right">수익</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analyticsData.sellerAnalysis.topSellers.map((seller) => (
                      <TableRow key={seller.sellerId}>
                        <TableCell>{seller.name}</TableCell>
                        <TableCell align="right">{seller.jobs}건</TableCell>
                        <TableCell align="right">{formatCurrency(seller.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                판매자 성과 (평점 기준)
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>판매자</TableCell>
                      <TableCell align="right">평점</TableCell>
                      <TableCell align="right">총 매출</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analyticsData.sellerAnalysis.sellerPerformance.map((seller) => (
                      <TableRow key={seller.sellerId}>
                        <TableCell>{seller.name}</TableCell>
                        <TableCell align="right">
                          <Box display="flex" alignItems="center" justifyContent="flex-end">
                            <Star sx={{ fontSize: 16, color: 'gold', mr: 0.5 }} />
                            {seller.avgRating.toFixed(1)}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{formatCurrency(seller.totalSales)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 시공시간별 분석 */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center' }}>
        <Schedule sx={{ mr: 1 }} />
        시공시간별 분석
      </Typography>
      
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                평균 완료 시간
              </Typography>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {formatTime(analyticsData.timeAnalysis.averageCompletionTime)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                완료된 작업 기준
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                시공 시간 분포
              </Typography>
              <List dense>
                {analyticsData.timeAnalysis.timeDistribution.map((item) => (
                  <ListItem key={item.range}>
                    <ListItemText 
                      primary={item.range}
                      secondary={`${item.count}건`}
                    />
                    <ListItemSecondaryAction>
                      <Typography variant="body2" color="textSecondary">
                        {((item.count / analyticsData.timeAnalysis.timeDistribution.reduce((sum, d) => sum + d.count, 0)) * 100).toFixed(1)}%
                      </Typography>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 시간대별 분석 */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center' }}>
        <Schedule sx={{ mr: 1 }} />
        시간대별 분석
      </Typography>
      
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                작업 시작 시간대별 분포
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>시간대</TableCell>
                      <TableCell align="right">작업 수</TableCell>
                      <TableCell align="right">비율</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analyticsData.timeAnalysis.timeOfDayDistribution.map((item) => (
                      <TableRow key={item.timeSlot}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box 
                              sx={{ 
                                width: 12, 
                                height: 12, 
                                borderRadius: '50%', 
                                mr: 2,
                                bgcolor: item.timeSlot.includes('새벽') ? '#1976d2' :
                                         item.timeSlot.includes('오전') ? '#2e7d32' :
                                         item.timeSlot.includes('오후') ? '#ed6c02' :
                                         '#d32f2f'
                              }} 
                            />
                            {item.timeSlot}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{item.count}건</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            {item.percentage}%
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                * 작업 시작 시간을 기준으로 분석
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 시공자 레벨 분포 */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        시공자 레벨 분포
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>레벨</TableCell>
                      <TableCell align="right">시공자 수</TableCell>
                      <TableCell align="right">비율</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analyticsData.contractorAnalysis.contractorDistribution.map((level) => (
                      <TableRow key={level.level}>
                        <TableCell>레벨 {level.level}</TableCell>
                        <TableCell align="right">{level.count}명</TableCell>
                        <TableCell align="right">
                          {((level.count / analyticsData.contractorAnalysis.contractorDistribution.reduce((sum, l) => sum + l.count, 0)) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;
