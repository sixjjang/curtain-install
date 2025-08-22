import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  CalendarMonth,
  Work,
  Schedule
} from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { JobService } from '../../../shared/services/jobService';
import { ConstructionJob } from '../../../types';

const CalendarView: React.FC = () => {
  const { user } = useAuth();

  // 총 예산 계산 함수
  const calculateTotalBudget = (job: ConstructionJob): number => {
    if (job.items && job.items.length > 0) {
      return job.items.reduce((sum, item) => sum + item.totalPrice, 0);
    }
    return 0;
  };

  const [allJobs, setAllJobs] = useState<ConstructionJob[]>([]);
  const [pendingJobs, setPendingJobs] = useState<ConstructionJob[]>([]);
  const [myJobs, setMyJobs] = useState<ConstructionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 다이얼로그 상태
  const [jobDetailDialog, setJobDetailDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ConstructionJob | null>(null);

  // 데이터 로드
  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError('');
      
      // 모든 작업 조회
      const allJobsData = await JobService.getAllJobs();
      setAllJobs(allJobsData);
      
      // 대기중인 작업 필터링
      const pendingJobsData = allJobsData.filter(job => job.status === 'pending');
      setPendingJobs(pendingJobsData);
      
      // 내 작업 필터링 (배정된 작업들)
      const myJobsData = allJobsData.filter(job => 
        job.contractorId === user.id && 
        ['assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress', 'completed'].includes(job.status)
      );
      setMyJobs(myJobsData);
      
    } catch (error: unknown) {
      console.error('데이터 로드 실패:', error);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // 작업 수락
  const handleAcceptJob = async (jobId: string) => {
    try {
      await JobService.updateJobStatus(jobId, 'assigned', user?.id);
      setSuccess('작업을 수락했습니다.');
      await loadData();
    } catch (error: unknown) {
      console.error('작업 수락 실패:', error);
      setError('작업 수락에 실패했습니다.');
    }
  };

  // 작업 상태 텍스트
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'assigned': return '배정됨';
      case 'product_preparing': return '자재준비';
      case 'product_ready': return '자재완료';
      case 'pickup_completed': return '픽업완료';
      case 'in_progress': return '시공중';
      case 'completed': return '완료';
      default: return '알 수 없음';
    }
  };

  // 작업 상태 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'assigned': return 'primary';
      case 'product_preparing': return 'warning';
      case 'product_ready': return 'info';
      case 'pickup_completed': return 'secondary';
      case 'in_progress': return 'success';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  // 날짜 포맷
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  // 시간 포맷
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Schedule />
          스케줄 보기
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* 대기중인 작업 목록 */}
        <Grid item xs={12}>
          <Card sx={{ border: '2px solid #ff9800', backgroundColor: '#fff8e1' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#e65100' }}>
                <Work />
                수락 가능한 작업 ({pendingJobs.length}건)
              </Typography>
              
              {pendingJobs.length === 0 ? (
                <Typography color="textSecondary" textAlign="center" py={4}>
                  현재 수락 가능한 작업이 없습니다.
                </Typography>
              ) : (
                <List>
                  {pendingJobs.map((job, index) => (
                    <React.Fragment key={job.id}>
                      <ListItem 
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { bgcolor: '#ffe0b2' },
                          border: '1px solid #ffcc80',
                          borderRadius: 1,
                          mb: 1
                        }}
                        onClick={() => {
                          setSelectedJob(job);
                          setJobDetailDialog(true);
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="subtitle1" sx={{ color: '#e65100', fontWeight: 'bold' }}>
                                {job.title}
                              </Typography>
                              <Chip 
                                label="수락 가능" 
                                color="warning" 
                                size="small"
                                sx={{ fontWeight: 'bold' }}
                              />
                            </Box>
                          }
                          secondary={
                            <React.Fragment>
                              <Typography variant="body2" color="textSecondary" component="div">
                                {job.address}
                              </Typography>
                              {job.scheduledDate && (
                                <Typography variant="body2" color="textSecondary" component="div">
                                  {formatDate(job.scheduledDate)} {formatTime(job.scheduledDate)}
                                </Typography>
                              )}
                              <Typography variant="body2" color="textSecondary" component="div">
                                예산: {job.finalAmount 
                                  ? `${job.finalAmount.toLocaleString()}원` 
                                  : calculateTotalBudget(job) > 0 
                                    ? `${calculateTotalBudget(job).toLocaleString()}원`
                                    : '예산 미정'
                                }
                              </Typography>
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                      {index < pendingJobs.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 내 작업 목록 */}
        <Grid item xs={12}>
          <Card sx={{ border: '2px solid #1976d2', backgroundColor: '#e3f2fd' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#0d47a1' }}>
                <CalendarMonth />
                내 시공 작업 ({myJobs.length}건)
              </Typography>
              
              {myJobs.length === 0 ? (
                <Typography color="textSecondary" textAlign="center" py={4}>
                  배정된 시공 작업이 없습니다.
                </Typography>
              ) : (
                <List>
                  {myJobs.map((job, index) => (
                    <React.Fragment key={job.id}>
                      <ListItem 
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { bgcolor: '#bbdefb' },
                          border: '1px solid #90caf9',
                          borderRadius: 1,
                          mb: 1
                        }}
                        onClick={() => {
                          setSelectedJob(job);
                          setJobDetailDialog(true);
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="subtitle1" sx={{ color: '#0d47a1', fontWeight: 'bold' }}>
                                {job.title}
                              </Typography>
                              <Chip 
                                label={getStatusText(job.status)} 
                                color={getStatusColor(job.status)} 
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <React.Fragment>
                              <Typography variant="body2" color="textSecondary" component="div">
                                {job.address}
                              </Typography>
                              {job.scheduledDate && (
                                <Typography variant="body2" color="textSecondary" component="div">
                                  {formatDate(job.scheduledDate)} {formatTime(job.scheduledDate)}
                                </Typography>
                              )}
                              <Typography variant="body2" color="textSecondary" component="div">
                                예산: {job.finalAmount 
                                  ? `${job.finalAmount.toLocaleString()}원` 
                                  : calculateTotalBudget(job) > 0 
                                    ? `${calculateTotalBudget(job).toLocaleString()}원`
                                    : '예산 미정'
                                }
                              </Typography>
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                      {index < myJobs.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 작업 상세 다이얼로그 */}
      <Dialog 
        open={jobDetailDialog} 
        onClose={() => setJobDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedJob?.status === 'pending' ? '수락 가능한 작업 상세 정보' : '내 작업 상세 정보'}
        </DialogTitle>
        <DialogContent>
          {selectedJob && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedJob.title}
              </Typography>
              <Typography variant="body1" paragraph>
                {selectedJob.description}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                주소: {selectedJob.address}
              </Typography>
              {selectedJob.scheduledDate && (
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  예정일: {formatDate(selectedJob.scheduledDate)} {formatTime(selectedJob.scheduledDate)}
                </Typography>
              )}
              <Typography variant="body2" color="textSecondary" gutterBottom>
                예산: {selectedJob.finalAmount 
                  ? `${selectedJob.finalAmount.toLocaleString()}원` 
                  : calculateTotalBudget(selectedJob) > 0 
                    ? `${calculateTotalBudget(selectedJob).toLocaleString()}원`
                    : '예산 미정'
                }
              </Typography>
              <Chip 
                label={selectedJob.status === 'pending' ? '수락 가능' : getStatusText(selectedJob.status)} 
                color={selectedJob.status === 'pending' ? 'warning' : getStatusColor(selectedJob.status)} 
                sx={{ mt: 1 }}
              />
              
              {/* 수락 가능한 작업인 경우 수락 버튼 표시 */}
              {selectedJob.status === 'pending' && (
                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    fullWidth
                    onClick={() => handleAcceptJob(selectedJob.id)}
                    sx={{ fontWeight: 'bold' }}
                  >
                    이 작업을 수락합니다
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJobDetailDialog(false)}>
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CalendarView;
