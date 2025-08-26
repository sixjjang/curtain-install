import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Visibility,
  AccountBalance,
  Notifications
} from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { ManualChargeService } from '../../../shared/services/manualChargeService';
import { ManualChargeRequest, AdminNotification } from '../../../types';

const ManualChargeManagement: React.FC = () => {
  const { user } = useAuth();
  const [chargeRequests, setChargeRequests] = useState<ManualChargeRequest[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ManualChargeRequest | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 완료 처리 폼 상태
  const [depositName, setDepositName] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDate, setDepositDate] = useState('');
  const [adminNote, setAdminNote] = useState('');

  // 데이터 로드
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [requests, notifs] = await Promise.all([
        ManualChargeService.getAllChargeRequests(),
        ManualChargeService.getAdminNotifications()
      ]);

      setChargeRequests(requests);
      setNotifications(notifs.filter(n => n.type === 'manual_charge_request' && !n.isRead));
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 상세 정보 보기
  const handleViewDetail = (request: ManualChargeRequest) => {
    setSelectedRequest(request);
    setDetailDialogOpen(true);
  };

  // 완료 처리 시작
  const handleCompleteRequest = (request: ManualChargeRequest) => {
    setSelectedRequest(request);
    setDepositAmount(request.amount.toString());
    setDepositDate(new Date().toISOString().split('T')[0]);
    setCompleteDialogOpen(true);
  };

  // 완료 처리 실행
  const handleComplete = async () => {
    if (!selectedRequest || !user) return;

    try {
      setProcessing(true);
      setError('');

      await ManualChargeService.completeChargeRequest(
        selectedRequest.id,
        user.id,
        depositName,
        parseInt(depositAmount),
        new Date(depositDate),
        adminNote
      );

      setSuccess('충전 요청이 완료 처리되었습니다.');
      setCompleteDialogOpen(false);
      setSelectedRequest(null);
      setDepositName('');
      setDepositAmount('');
      setDepositDate('');
      setAdminNote('');
      
      // 데이터 새로고침
      await loadData();
    } catch (error) {
      console.error('완료 처리 실패:', error);
      setError('완료 처리에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  // 요청 취소
  const handleCancelRequest = async (requestId: string) => {
    if (!user) return;

    try {
      setProcessing(true);
      setError('');

      await ManualChargeService.cancelChargeRequest(requestId, user.id, '관리자에 의해 취소됨');

      setSuccess('충전 요청이 취소되었습니다.');
      await loadData();
    } catch (error) {
      console.error('취소 처리 실패:', error);
      setError('취소 처리에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  // 알림 읽음 처리
  const handleMarkNotificationAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      await ManualChargeService.markNotificationAsRead(notificationId, user.id);
      await loadData();
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    }
  };

  // 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  // 상태별 텍스트
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'completed': return '완료';
      case 'cancelled': return '취소';
      default: return '알 수 없음';
    }
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
        <Typography variant="h5" fontWeight="bold">
          수동 계좌이체 충전 관리
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          {notifications.length > 0 && (
            <Chip
              icon={<Notifications />}
              label={`새 요청 ${notifications.length}건`}
              color="warning"
              variant="outlined"
            />
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

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>요청일시</TableCell>
                  <TableCell>사용자</TableCell>
                  <TableCell>연락처</TableCell>
                  <TableCell>충전 금액</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell>입금 정보</TableCell>
                  <TableCell>관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {chargeRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      {request.createdAt.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {request.userName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {request.userPhone}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        {request.amount.toLocaleString()}원
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(request.status)}
                        color={getStatusColor(request.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {request.status === 'completed' ? (
                        <Box>
                          <Typography variant="caption" display="block">
                            입금자: {request.depositName}
                          </Typography>
                          <Typography variant="caption" display="block">
                            금액: {request.depositAmount?.toLocaleString()}원
                          </Typography>
                          <Typography variant="caption" display="block">
                            날짜: {request.depositDate?.toLocaleDateString()}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="textSecondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="상세보기">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetail(request)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        
                        {request.status === 'pending' && (
                          <>
                            <Tooltip title="완료 처리">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleCompleteRequest(request)}
                              >
                                <CheckCircle />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="취소">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleCancelRequest(request.id)}
                              >
                                <Cancel />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {chargeRequests.length === 0 && (
            <Box textAlign="center" py={4}>
              <AccountBalance sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary">
                수동 계좌이체 충전 요청이 없습니다.
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
          충전 요청 상세 정보
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box>
              <Typography variant="h6" gutterBottom>
                기본 정보
              </Typography>
              <Box mb={2}>
                <Typography variant="body2">
                  <strong>요청자:</strong> {selectedRequest.userName}
                </Typography>
                <Typography variant="body2">
                  <strong>연락처:</strong> {selectedRequest.userPhone}
                </Typography>
                <Typography variant="body2">
                  <strong>충전 금액:</strong> {selectedRequest.amount.toLocaleString()}원
                </Typography>
                <Typography variant="body2">
                  <strong>요청일시:</strong> {selectedRequest.createdAt.toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  <strong>상태:</strong> {getStatusText(selectedRequest.status)}
                </Typography>
              </Box>

              {selectedRequest.status === 'completed' && (
                <>
                  <Typography variant="h6" gutterBottom>
                    입금 정보
                  </Typography>
                  <Box mb={2}>
                    <Typography variant="body2">
                      <strong>입금자명:</strong> {selectedRequest.depositName}
                    </Typography>
                    <Typography variant="body2">
                      <strong>입금 금액:</strong> {selectedRequest.depositAmount?.toLocaleString()}원
                    </Typography>
                    <Typography variant="body2">
                      <strong>입금 날짜:</strong> {selectedRequest.depositDate?.toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2">
                      <strong>처리자:</strong> {selectedRequest.completedBy}
                    </Typography>
                    <Typography variant="body2">
                      <strong>처리일시:</strong> {selectedRequest.completedAt?.toLocaleString()}
                    </Typography>
                  </Box>
                </>
              )}

              {selectedRequest.adminNote && (
                <>
                  <Typography variant="h6" gutterBottom>
                    관리자 메모
                  </Typography>
                  <Typography variant="body2" sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                    {selectedRequest.adminNote}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>
            닫기
          </Button>
        </DialogActions>
      </Dialog>

      {/* 완료 처리 다이얼로그 */}
      <Dialog
        open={completeDialogOpen}
        onClose={() => setCompleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          충전 요청 완료 처리
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="입금자명"
              value={depositName}
              onChange={(e) => setDepositName(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="입금 금액"
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="입금 날짜"
              type="date"
              value={depositDate}
              onChange={(e) => setDepositDate(e.target.value)}
              margin="normal"
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="관리자 메모"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              margin="normal"
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setCompleteDialogOpen(false)}
            disabled={processing}
          >
            취소
          </Button>
          <Button
            onClick={handleComplete}
            variant="contained"
            color="success"
            disabled={processing || !depositName || !depositAmount || !depositDate}
            startIcon={processing ? <CircularProgress size={16} /> : <CheckCircle />}
          >
            {processing ? '처리 중...' : '완료 처리'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManualChargeManagement;
