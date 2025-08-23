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
  Work
} from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { JobService } from '../../../shared/services/jobService';
import { ConstructionJob } from '../../../types';

const CalendarView: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<ConstructionJob[]>([]);
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
      
      // 판매자의 시공 작업 조회
      const allJobs = await JobService.getAllJobs();
      const myJobs = allJobs.filter(job => job.sellerId === user.id);
      setJobs(myJobs);
      
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

  // 작업 상태 텍스트
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'assigned': return '배정됨';
      case 'product_preparing': return '자재준비';
              case 'product_ready': return '제품준비완료';
      case 'pickup_completed': return '픽업완료';
      case 'in_progress': return '시공중';
      case 'completed': return '완료';
      case 'cancelled': return '취소됨';
      case 'product_not_ready': return '제품 미준비';
      case 'customer_absent': return '고객 부재';
      case 'schedule_changed': return '일정 변경';
      default: return '알 수 없음';
    }
  };

  // 작업 상태 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'assigned': return 'primary';
      case 'product_preparing': return 'warning';
      case 'product_ready': return 'info';
      case 'pickup_completed': return 'secondary';
      case 'in_progress': return 'success';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'product_not_ready': return 'warning';
      case 'customer_absent': return 'error';
      case 'schedule_changed': return 'info';
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
          <CalendarMonth />
          캘린더 뷰
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
        {/* 시공 작업 목록 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Work />
                내 시공 작업 ({jobs.length}건)
              </Typography>
              
              {jobs.length === 0 ? (
                <Typography color="textSecondary" textAlign="center" py={4}>
                  등록된 시공 작업이 없습니다.
                </Typography>
              ) : (
                <List>
                  {jobs.map((job, index) => (
                    <React.Fragment key={job.id}>
                      <ListItem 
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                        onClick={() => {
                          setSelectedJob(job);
                          setJobDetailDialog(true);
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="subtitle1">
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
                                예산: {job.budget?.min?.toLocaleString()}~{job.budget?.max?.toLocaleString()}원
                              </Typography>
                              {job.contractorName && (
                                <Typography variant="body2" color="textSecondary" component="div">
                                  시공자: {job.contractorName}
                                </Typography>
                              )}
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                      {index < jobs.length - 1 && <Divider />}
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
          작업 상세 정보
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
                예산: {selectedJob.budget?.min?.toLocaleString()}~{selectedJob.budget?.max?.toLocaleString()}원
              </Typography>
              {selectedJob.contractorName && (
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  시공자: {selectedJob.contractorName}
                </Typography>
              )}
              <Chip 
                label={getStatusText(selectedJob.status)} 
                color={getStatusColor(selectedJob.status)} 
                sx={{ mt: 1 }}
              />
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
