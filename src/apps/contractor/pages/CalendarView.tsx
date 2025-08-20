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
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CalendarMonth,
  Work,
  Schedule,
  CheckCircle,
  Warning,
  Error,
  Sync,
  Google,
  Link,
  LinkOff,
  Add,
  Edit,
  Delete
} from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { JobService } from '../../../shared/services/jobService';
import { GoogleCalendarService } from '../../../shared/services/googleCalendarService';
import { ConstructionJob } from '../../../types';
import { GoogleCalendarEvent } from '../../../config/google';

const CalendarView: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<ConstructionJob[]>([]);
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 구글 캘린더 연동 상태
  const [isConnected, setIsConnected] = useState(false);
  const [connectionLoading, setConnectionLoading] = useState(true);
  
  // 다이얼로그 상태
  const [jobDetailDialog, setJobDetailDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ConstructionJob | null>(null);
  const [syncDialog, setSyncDialog] = useState(false);

  // 데이터 로드
  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError('');
      
      // 시공 작업 조회
      const allJobs = await JobService.getAllJobs();
      const myJobs = allJobs.filter(job => 
        job.contractorId === user.id && 
        ['assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress', 'completed'].includes(job.status)
      );
      setJobs(myJobs);
      
      // 구글 캘린더 연동 상태 확인
      await checkGoogleConnection();
      
      // 구글 캘린더 이벤트 조회 (연동된 경우)
      if (isConnected) {
        await loadGoogleEvents();
      }
      
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 구글 캘린더 연동 상태 확인
  const checkGoogleConnection = async () => {
    if (!user?.id) return;
    
    try {
      setConnectionLoading(true);
      const connection = await GoogleCalendarService.getConnection(user.id);
      setIsConnected(connection?.isConnected || false);
    } catch (error) {
      console.error('연동 상태 확인 실패:', error);
      setIsConnected(false);
    } finally {
      setConnectionLoading(false);
    }
  };

  // 구글 캘린더 이벤트 조회
  const loadGoogleEvents = async () => {
    if (!user?.id) return;
    
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const events = await GoogleCalendarService.getEvents(
        user.id,
        startOfMonth.toISOString(),
        endOfMonth.toISOString()
      );
      
      setGoogleEvents(events);
    } catch (error) {
      console.error('구글 캘린더 이벤트 조회 실패:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // 구글 캘린더 연동 시작
  const handleConnectGoogle = () => {
    try {
      GoogleCalendarService.initiateConnection();
    } catch (error) {
      console.error('구글 캘린더 연동 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '구글 캘린더 연동에 실패했습니다.';
      setError(errorMessage);
      
      // 환경 변수 설정이 안 되어 있는 경우 가이드 페이지로 이동
      if (errorMessage.includes('REACT_APP_GOOGLE_CLIENT_ID가 설정되지 않았습니다')) {
        setTimeout(() => {
          window.open('/google-calendar-setup', '_blank');
        }, 2000);
      }
    }
  };

  // 구글 캘린더 연동 해제
  const handleDisconnectGoogle = async () => {
    if (!user?.id) return;
    
    try {
      await GoogleCalendarService.disconnect(user.id);
      setIsConnected(false);
      setGoogleEvents([]);
      setSuccess('구글 캘린더 연동이 해제되었습니다.');
    } catch (error) {
      console.error('연동 해제 실패:', error);
      setError('연동 해제에 실패했습니다.');
    }
  };

  // 시공 작업을 구글 캘린더에 동기화
  const handleSyncToGoogle = async () => {
    if (!user?.id) return;
    
    try {
      setSyncing(true);
      setError('');
      
      // 기존 이벤트 삭제 (선택사항)
      // for (const event of googleEvents) {
      //   await GoogleCalendarService.deleteEvent(user.id, event.id);
      // }
      
      // 새로운 이벤트 생성
      for (const job of jobs) {
        if (job.scheduledDate) {
          const event = GoogleCalendarService.convertJobToCalendarEvent(job, 'contractor');
          await GoogleCalendarService.createEvent(user.id, event);
        }
      }
      
      // 이벤트 목록 새로고침
      await loadGoogleEvents();
      
      setSuccess('구글 캘린더에 성공적으로 동기화되었습니다.');
      setSyncDialog(false);
    } catch (error) {
      console.error('동기화 실패:', error);
      setError('구글 캘린더 동기화에 실패했습니다.');
    } finally {
      setSyncing(false);
    }
  };

  // 작업 수락
  const handleAcceptJob = async (jobId: string) => {
    try {
      await JobService.updateJobStatus(jobId, 'assigned', user?.id);
      setSuccess('작업을 수락했습니다.');
      await loadData();
    } catch (error) {
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
      case 'pending': return 'default';
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
          <CalendarMonth />
          캘린더 뷰
        </Typography>
        
        <Box display="flex" gap={2}>
          {/* 구글 캘린더 연동 버튼 */}
          {!connectionLoading && (
            isConnected ? (
              <Button
                variant="outlined"
                startIcon={<LinkOff />}
                onClick={handleDisconnectGoogle}
                color="error"
              >
                구글 연동 해제
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<Google />}
                onClick={handleConnectGoogle}
                color="primary"
              >
                구글 캘린더 연동
              </Button>
            )
          )}
          
          {/* 동기화 버튼 */}
          {isConnected && (
            <Button
              variant="contained"
              startIcon={<Sync />}
              onClick={() => setSyncDialog(true)}
              disabled={syncing}
            >
              {syncing ? '동기화 중...' : '구글 캘린더 동기화'}
            </Button>
          )}
        </Box>
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
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Work />
                내 시공 작업 ({jobs.length}건)
              </Typography>
              
              {jobs.length === 0 ? (
                <Typography color="textSecondary" textAlign="center" py={4}>
                  배정된 시공 작업이 없습니다.
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

        {/* 구글 캘린더 이벤트 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Google />
                구글 캘린더 이벤트 ({googleEvents.length}건)
              </Typography>
              
              {!isConnected ? (
                <Box textAlign="center" py={4}>
                  <Typography color="textSecondary" gutterBottom>
                    구글 캘린더와 연동하여 이벤트를 확인하세요.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Google />}
                    onClick={handleConnectGoogle}
                  >
                    구글 캘린더 연동
                  </Button>
                </Box>
              ) : googleEvents.length === 0 ? (
                <Typography color="textSecondary" textAlign="center" py={4}>
                  구글 캘린더에 이벤트가 없습니다.
                </Typography>
              ) : (
                <List>
                  {googleEvents.map((event, index) => (
                    <React.Fragment key={event.id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1">
                              {event.summary}
                            </Typography>
                          }
                          secondary={
                            <React.Fragment>
                              {event.description && (
                                <Typography variant="body2" color="textSecondary" component="div">
                                  {event.description}
                                </Typography>
                              )}
                              {event.location && (
                                <Typography variant="body2" color="textSecondary" component="div">
                                  위치: {event.location}
                                </Typography>
                              )}
                              <Typography variant="body2" color="textSecondary" component="div">
                                {new Date(event.start.dateTime).toLocaleString('ko-KR')}
                              </Typography>
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                      {index < googleEvents.length - 1 && <Divider />}
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

      {/* 구글 캘린더 동기화 다이얼로그 */}
      <Dialog 
        open={syncDialog} 
        onClose={() => setSyncDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          구글 캘린더 동기화
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            현재 시공 작업을 구글 캘린더에 동기화하시겠습니까?
          </Typography>
          <Typography variant="body2" color="textSecondary">
            • 예정일이 있는 작업만 동기화됩니다.<br/>
            • 기존 이벤트는 유지됩니다.<br/>
            • 동기화 후 구글 캘린더에서 확인할 수 있습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSyncDialog(false)}>
            취소
          </Button>
          <Button
            onClick={handleSyncToGoogle}
            variant="contained"
            disabled={syncing}
            startIcon={syncing ? <CircularProgress size={16} /> : <Sync />}
          >
            {syncing ? '동기화 중...' : '동기화'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CalendarView;
