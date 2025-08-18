import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ListItemAvatar,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Work,
  TrendingUp,
  Star,
  Notifications,
  LocationOn,
  Schedule,
  CheckCircle,
  Pending
} from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { ContractorInfo } from '../../../types';

// 임시 데이터 (실제로는 API에서 가져올 데이터)
const mockJobs = [
  {
    id: '1',
    title: '거실 커튼 시공',
    address: '서울시 강남구 역삼동',
    budget: { min: 50000, max: 80000 },
    status: 'assigned',
    priority: 'high',
    scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2일 후
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: '2',
    title: '침실 블라인드 설치',
    address: '서울시 서초구 서초동',
    budget: { min: 30000, max: 50000 },
    status: 'assigned',
    priority: 'medium',
    scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3일 후
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
  },
  {
    id: '3',
    title: '주방 롤스크린 설치',
    address: '서울시 마포구 합정동',
    budget: { min: 40000, max: 60000 },
    status: 'assigned',
    priority: 'low',
    scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5일 후
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
  }
];

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const contractor = user?.contractor;
  const navigate = useNavigate();
  const [scheduledJobs, setScheduledJobs] = useState(mockJobs);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'assigned': return 'info';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'assigned': return '배정됨';
      case 'in_progress': return '진행중';
      case 'completed': return '완료';
      default: return '알 수 없음';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '긴급';
      case 'medium': return '보통';
      case 'low': return '여유';
      default: return '알 수 없음';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        안녕하세요, {contractor?.name || '시공자'}님! 👋
      </Typography>

      {/* 알림 */}
      <Alert severity="info" sx={{ mb: 3 }}>
        새로운 시공 작업이 2건 등록되었습니다. 확인해보세요!
      </Alert>

      <Grid container spacing={3}>
        {/* 통계 카드들 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Work />
                </Avatar>
                <Box>
                  <Typography variant="h4">{contractor?.totalJobs || 0}</Typography>
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
                  <Typography variant="h4">{contractor?.level || 1}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    현재 레벨
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
                  <Typography variant="h4">{Number(contractor?.rating || 0).toFixed(1)}</Typography>
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
                  <Notifications />
                </Avatar>
                <Box>
                  <Typography variant="h4">3</Typography>
                  <Typography variant="body2" color="textSecondary">
                    새로운 알림
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 최근 작업 목록 */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">시공예정작업</Typography>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => navigate('/contractor/my-jobs')}
                >
                  전체 보기
                </Button>
              </Box>
              
              <List>
                {scheduledJobs.map((job, index) => (
                  <ListItem 
                    key={job.id}
                    button
                    onClick={() => navigate(`/contractor/jobs/${job.id}`)}
                    sx={{ 
                      border: 1, 
                      borderColor: 'divider', 
                      borderRadius: 1, 
                      mb: 1,
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <Work />
                      </Avatar>
                    </ListItemAvatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography variant="subtitle1">{job.title}</Typography>
                        <Chip 
                          label={getStatusText(job.status)} 
                          color={getStatusColor(job.status)}
                          size="small"
                        />
                        <Chip 
                          label={getPriorityText(job.priority)} 
                          color={getPriorityColor(job.priority)}
                          size="small"
                        />
                      </Box>
                      <Box>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <LocationOn fontSize="small" color="action" />
                          <Typography variant="body2">{job.address}</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <Schedule fontSize="small" color="action" />
                          <Typography variant="body2">
                            시공예정: {job.scheduledDate?.toLocaleDateString('ko-KR', { 
                              month: 'short', 
                              day: 'numeric',
                              weekday: 'short'
                            })}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" color="textSecondary">
                            {job.budget.min.toLocaleString()}원 ~ {job.budget.max.toLocaleString()}원
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* 빠른 액션 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                빠른 액션
              </Typography>
              
              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Work />}
                  onClick={() => navigate('/contractor/jobs')}
                >
                  시공 작업 보기
                </Button>
                
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<TrendingUp />}
                  onClick={() => navigate('/contractor/level')}
                >
                  레벨 현황 확인
                </Button>
                
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Notifications />}
                  onClick={() => navigate('/contractor/notifications')}
                >
                  알림 확인
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* 오늘의 목표 */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                오늘의 목표
              </Typography>
              
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">시공 완료</Typography>
                  <Typography variant="body2">2/3건</Typography>
                </Box>
                <LinearProgress variant="determinate" value={67} />
              </Box>
              
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">평점 달성</Typography>
                  <Typography variant="body2">4.5/5.0점</Typography>
                </Box>
                <LinearProgress variant="determinate" value={90} color="success" />
              </Box>
              
              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">경험치 획득</Typography>
                  <Typography variant="body2">150/200점</Typography>
                </Box>
                <LinearProgress variant="determinate" value={75} color="warning" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
