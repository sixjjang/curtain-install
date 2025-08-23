import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Send as SendIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { AdminSatisfactionService, SatisfactionNotification } from '../../../shared/services/adminSatisfactionService';
import { JobService } from '../../../shared/services/jobService';
import { ConstructionJob } from '../../../types';

const SatisfactionSurveyManagement: React.FC = () => {
  const [notifications, setNotifications] = useState<SatisfactionNotification[]>([]);
  const [jobs, setJobs] = useState<{ [key: string]: ConstructionJob }>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<SatisfactionNotification | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // 만족도 조사 알림 목록 로드
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const notificationsData = await AdminSatisfactionService.getSatisfactionNotifications();
      setNotifications(notificationsData);

      // 관련 작업 정보 로드
      const jobIds = Array.from(new Set(notificationsData.map(n => n.jobId)));
      const jobsData: { [key: string]: ConstructionJob } = {};
      
      for (const jobId of jobIds) {
        try {
          const job = await JobService.getJob(jobId);
          if (job) {
            jobsData[jobId] = job;
          }
        } catch (error) {
          console.warn(`작업 ${jobId} 정보 로드 실패:`, error);
        }
      }
      
      setJobs(jobsData);
    } catch (error) {
      console.error('만족도 조사 알림 로드 실패:', error);
      setSnackbar({
        open: true,
        message: '만족도 조사 알림을 불러올 수 없습니다.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // 판매자에게 만족도 조사 링크 전송
  const handleSendToSeller = async (notificationId: string) => {
    try {
      setSending(notificationId);
      await AdminSatisfactionService.sendSatisfactionMessageToSeller(notificationId);
      
      setSnackbar({
        open: true,
        message: '판매자에게 만족도 조사 링크를 전송했습니다.',
        severity: 'success'
      });
      
      // 목록 새로고침
      await loadNotifications();
    } catch (error) {
      console.error('만족도 조사 링크 전송 실패:', error);
      setSnackbar({
        open: true,
        message: '만족도 조사 링크 전송에 실패했습니다.',
        severity: 'error'
      });
    } finally {
      setSending(null);
    }
  };

  // 상세 정보 보기
  const handleViewDetail = (notification: SatisfactionNotification) => {
    setSelectedNotification(notification);
    setDetailDialogOpen(true);
  };

  // 상태별 칩 색상
  const getStatusChip = (isSent: boolean) => {
    if (isSent) {
      return <Chip label="전송됨" color="success" size="small" icon={<CheckCircleIcon />} />;
    } else {
      return <Chip label="대기중" color="warning" size="small" icon={<ScheduleIcon />} />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        시공 완료 후 판매자에게 전송되는 만족도 조사 알림을 관리합니다.
      </Typography>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>작업 ID</TableCell>
                  <TableCell>작업 제목</TableCell>
                  <TableCell>판매자</TableCell>
                  <TableCell>시공자</TableCell>
                  <TableCell>생성일</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell>전송일</TableCell>
                  <TableCell>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notifications.map((notification) => {
                  const job = jobs[notification.jobId];
                  return (
                    <TableRow key={notification.id}>
                      <TableCell>{notification.jobId}</TableCell>
                      <TableCell>
                        {job?.title || '작업 정보 없음'}
                      </TableCell>
                      <TableCell>
                        {job?.sellerName || '판매자 정보 없음'}
                      </TableCell>
                      <TableCell>
                        {job?.contractorName || '시공자 정보 없음'}
                      </TableCell>
                      <TableCell>
                        {notification.createdAt.toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {getStatusChip(notification.isSent)}
                      </TableCell>
                      <TableCell>
                        {notification.sentAt 
                          ? notification.sentAt.toLocaleDateString()
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="상세 정보 보기">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetail(notification)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          
                          {!notification.isSent && (
                            <Tooltip title="판매자에게 전송">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleSendToSeller(notification.id)}
                                disabled={sending === notification.id}
                              >
                                {sending === notification.id ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <SendIcon />
                                )}
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          
          {notifications.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography color="textSecondary">
                아직 만족도 조사 알림이 없습니다.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 상세 정보 다이얼로그 */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          만족도 조사 상세 정보
        </DialogTitle>
        <DialogContent>
          {selectedNotification && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    작업 ID
                  </Typography>
                  <Typography variant="body1">
                    {selectedNotification.jobId}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    만족도 조사 ID
                  </Typography>
                  <Typography variant="body1">
                    {selectedNotification.surveyId}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    만족도 조사 링크
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      wordBreak: 'break-all',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem'
                    }}
                  >
                    {selectedNotification.surveyLink}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    전송 메시지
                  </Typography>
                  <Box 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'grey.50', 
                      borderRadius: 1,
                      whiteSpace: 'pre-line'
                    }}
                  >
                    {selectedNotification.message}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>
            닫기
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SatisfactionSurveyManagement;
