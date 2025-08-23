import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Grid,
  Divider
} from '@mui/material';
import {
  AccountBalanceWallet,
  CheckCircle,
  Cancel,
  Visibility,
  Refresh,
  FilterList,
  Payment
} from '@mui/icons-material';
import { PointService } from '../../../shared/services/pointService';
import { AuthService } from '../../../shared/services/authService';
import { PointTransaction } from '../../../types';

interface WithdrawalRequest extends PointTransaction {
  userName?: string;
  userPhone?: string;
}

const PointWithdrawalManagement: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 필터링 상태
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'seller' | 'contractor'>('all');
  
  // 상세 보기 다이얼로그
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  
  // 처리 다이얼로그
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [processAction, setProcessAction] = useState<'approve' | 'reject'>('approve');
  const [processNote, setProcessNote] = useState('');
  const [manualBankInfo, setManualBankInfo] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: ''
  });

  // 데이터 로드
  const loadWithdrawals = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 모든 인출 요청 조회
      const allWithdrawals = await PointService.getAllWithdrawalRequests();
      
      // 사용자 정보 추가
      const withdrawalsWithUserInfo = await Promise.all(
        allWithdrawals.map(async (withdrawal) => {
          try {
            const user = await AuthService.getUserById(withdrawal.userId);
            return {
              ...withdrawal,
              userName: user?.name || '알 수 없음',
              userPhone: user?.phone || '연락처 없음'
            };
          } catch (error) {
            console.warn(`사용자 정보 조회 실패 (${withdrawal.userId}):`, error);
            return {
              ...withdrawal,
              userName: '알 수 없음',
              userPhone: '연락처 없음'
            };
          }
        })
      );
      
      setWithdrawals(withdrawalsWithUserInfo);
    } catch (error) {
      console.error('인출 요청 조회 실패:', error);
      setError('인출 요청을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWithdrawals();
  }, []);

  // 필터링된 데이터
  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const statusMatch = statusFilter === 'all' || withdrawal.status === statusFilter;
    const roleMatch = userRoleFilter === 'all' || withdrawal.userRole === userRoleFilter;
    return statusMatch && roleMatch;
  });

  // 상세 보기
  const handleViewDetail = (withdrawal: WithdrawalRequest) => {
    setSelectedWithdrawal(withdrawal);
    setDetailDialogOpen(true);
  };

  // 처리 시작
  const handleProcessStart = (withdrawal: WithdrawalRequest, action: 'approve' | 'reject') => {
    setSelectedWithdrawal(withdrawal);
    setProcessAction(action);
    setProcessNote('');
    
    // 승인이고 은행 정보가 없는 경우, 수동 입력을 위해 초기화
    if (action === 'approve' && !withdrawal.bankInfo) {
      setManualBankInfo({
        bankName: '',
        accountNumber: '',
        accountHolder: ''
      });
    }
    
    setProcessDialogOpen(true);
  };

  // 처리 실행
  const handleProcess = async () => {
    if (!selectedWithdrawal) return;
    
    try {
      setProcessing(true);
      setError('');
      
      if (processAction === 'approve') {
        // 은행 정보가 없고 수동 입력도 없는 경우
        if (!selectedWithdrawal.bankInfo && (!manualBankInfo.bankName || !manualBankInfo.accountNumber || !manualBankInfo.accountHolder)) {
          setError('은행 정보를 입력해주세요.');
          return;
        }
        
        // 수동 입력된 은행 정보가 있는 경우 해당 정보로 승인
        if (!selectedWithdrawal.bankInfo && manualBankInfo.bankName && manualBankInfo.accountNumber && manualBankInfo.accountHolder) {
          await PointService.approveWithdrawalWithBankInfo(selectedWithdrawal.id, manualBankInfo, processNote);
        } else {
          await PointService.approveWithdrawal(selectedWithdrawal.id, processNote);
        }
        setSuccess('인출 요청이 승인되었습니다.');
      } else {
        await PointService.rejectWithdrawal(selectedWithdrawal.id, processNote);
        setSuccess('인출 요청이 거절되었습니다.');
      }
      
      setProcessDialogOpen(false);
      await loadWithdrawals(); // 데이터 새로고침
    } catch (error) {
      console.error('인출 처리 실패:', error);
      setError('인출 처리에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  // 상태 텍스트
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'completed': return '완료';
      case 'failed': return '실패';
      case 'cancelled': return '취소';
      default: return '알 수 없음';
    }
  };

  // 상태 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  // 사용자 역할 텍스트
  const getUserRoleText = (role: string) => {
    switch (role) {
      case 'seller': return '판매자';
      case 'contractor': return '시공자';
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
        <Typography variant="h4" fontWeight="bold">
          포인트 인출 관리
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadWithdrawals}
        >
          새로고침
        </Button>
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

      {/* 통계 카드 */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                총 인출 요청
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {withdrawals.length}건
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main" gutterBottom>
                대기중
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {withdrawals.filter(w => w.status === 'pending').length}건
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main" gutterBottom>
                완료
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {withdrawals.filter(w => w.status === 'completed').length}건
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error.main" gutterBottom>
                실패/취소
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="error.main">
                {withdrawals.filter(w => w.status === 'failed' || w.status === 'cancelled').length}건
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 필터 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} alignItems="center">
            <FilterList color="action" />
            <Typography variant="h6">필터</Typography>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>상태</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                label="상태"
              >
                <MenuItem value="all">전체</MenuItem>
                <MenuItem value="pending">대기중</MenuItem>
                <MenuItem value="completed">완료</MenuItem>
                <MenuItem value="failed">실패</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>사용자 유형</InputLabel>
              <Select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value as any)}
                label="사용자 유형"
              >
                <MenuItem value="all">전체</MenuItem>
                <MenuItem value="seller">판매자</MenuItem>
                <MenuItem value="contractor">시공자</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* 인출 요청 목록 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            인출 요청 목록 ({filteredWithdrawals.length}건)
          </Typography>
          
          {filteredWithdrawals.length === 0 ? (
            <Typography color="textSecondary" textAlign="center" py={4}>
              인출 요청이 없습니다.
            </Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>요청일시</TableCell>
                    <TableCell>사용자</TableCell>
                    <TableCell>유형</TableCell>
                    <TableCell>인출 금액</TableCell>
                    <TableCell>상태</TableCell>
                    <TableCell>작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredWithdrawals.map((withdrawal) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell>
                        {withdrawal.createdAt.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {withdrawal.userName || '알 수 없음'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {withdrawal.userPhone || '연락처 없음'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getUserRoleText(withdrawal.userRole)} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold" color="error.main">
                          {Math.abs(withdrawal.amount).toLocaleString()}P
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          ≈ {Math.abs(withdrawal.amount).toLocaleString()}원
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getStatusText(withdrawal.status)} 
                          color={getStatusColor(withdrawal.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="상세 보기">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetail(withdrawal)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          
                          {withdrawal.status === 'pending' && (
                            <>
                              <Tooltip title="승인">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleProcessStart(withdrawal, 'approve')}
                                >
                                  <CheckCircle />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="거절">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleProcessStart(withdrawal, 'reject')}
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
          )}
        </CardContent>
      </Card>

                        {/* 상세 보기 다이얼로그 */}
                  <Dialog 
                    open={detailDialogOpen} 
                    onClose={() => setDetailDialogOpen(false)} 
                    maxWidth="md" 
                    fullWidth
                    disableEnforceFocus
                    disableAutoFocus
                  >
                    <DialogTitle>
                      <Box display="flex" alignItems="center" gap={1}>
                        <AccountBalanceWallet color="primary" />
                        인출 요청 상세 정보
                      </Box>
                    </DialogTitle>
                    <DialogContent>
                      {selectedWithdrawal && (
                        <Box>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <Typography variant="subtitle2" color="textSecondary">요청 ID</Typography>
                              <Typography variant="body1" mb={2}>{selectedWithdrawal.id}</Typography>
                              
                              <Typography variant="subtitle2" color="textSecondary">사용자</Typography>
                              <Typography variant="body1" mb={2}>
                                {selectedWithdrawal.userName || '알 수 없음'} ({getUserRoleText(selectedWithdrawal.userRole)})
                              </Typography>
                              
                              <Typography variant="subtitle2" color="textSecondary">연락처</Typography>
                              <Typography variant="body1" mb={2}>
                                {selectedWithdrawal.userPhone || '연락처 없음'}
                              </Typography>
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                              <Typography variant="subtitle2" color="textSecondary">인출 금액</Typography>
                              <Typography variant="h5" color="error.main" fontWeight="bold" mb={2}>
                                {Math.abs(selectedWithdrawal.amount).toLocaleString()}P
                              </Typography>
                              
                              <Typography variant="subtitle2" color="textSecondary">상태</Typography>
                              <Chip 
                                label={getStatusText(selectedWithdrawal.status)} 
                                color={getStatusColor(selectedWithdrawal.status) as any}
                                sx={{ mb: 2 }}
                              />
                              
                              <Typography variant="subtitle2" color="textSecondary">요청일시</Typography>
                              <Typography variant="body1" mb={2}>
                                {selectedWithdrawal.createdAt.toLocaleString()}
                              </Typography>
                            </Grid>
                            
                                                         {selectedWithdrawal.bankInfo && (
                               <Grid item xs={12}>
                                 <Divider sx={{ my: 2 }} />
                                 <Typography variant="h6" gutterBottom>은행 정보</Typography>
                                 <Grid container spacing={2}>
                                   <Grid item xs={12} md={4}>
                                     <Typography variant="subtitle2" color="textSecondary">은행명</Typography>
                                     <Typography variant="body1">{selectedWithdrawal.bankInfo.bankName}</Typography>
                                   </Grid>
                                   <Grid item xs={12} md={4}>
                                     <Typography variant="subtitle2" color="textSecondary">계좌번호</Typography>
                                     <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                                       {selectedWithdrawal.bankInfo.accountNumber}
                                     </Typography>
                                   </Grid>
                                   <Grid item xs={12} md={4}>
                                     <Typography variant="subtitle2" color="textSecondary">예금주</Typography>
                                     <Typography variant="body1">{selectedWithdrawal.bankInfo.accountHolder}</Typography>
                                   </Grid>
                                 </Grid>
                                 
                                 {/* 이체 상태 정보 */}
                                 {selectedWithdrawal.transferId && (
                                   <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                                     <Typography variant="subtitle2" color="success.dark" gutterBottom>
                                       ✅ 자동 입금 완료
                                     </Typography>
                                     <Typography variant="body2" color="success.dark">
                                       이체 ID: {selectedWithdrawal.transferId}
                                     </Typography>
                                     {selectedWithdrawal.transferCompletedAt && (
                                       <Typography variant="body2" color="success.dark">
                                         입금 완료: {selectedWithdrawal.transferCompletedAt.toLocaleString()}
                                       </Typography>
                                     )}
                                   </Box>
                                 )}
                               </Grid>
                             )}
                            
                            {selectedWithdrawal.notes && (
                              <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle2" color="textSecondary">메모</Typography>
                                <Typography variant="body1">{selectedWithdrawal.notes}</Typography>
                              </Grid>
                            )}
                          </Grid>
                        </Box>
                      )}
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={() => setDetailDialogOpen(false)}>닫기</Button>
                    </DialogActions>
                  </Dialog>

                        {/* 처리 다이얼로그 */}
                  <Dialog 
                    open={processDialogOpen} 
                    onClose={() => setProcessDialogOpen(false)} 
                    maxWidth="sm" 
                    fullWidth
                    disableEnforceFocus
                    disableAutoFocus
                  >
                    <DialogTitle>
                      <Box display="flex" alignItems="center" gap={1}>
                        {processAction === 'approve' ? (
                          <CheckCircle color="success" />
                        ) : (
                          <Cancel color="error" />
                        )}
                        {processAction === 'approve' ? '인출 승인' : '인출 거절'}
                      </Box>
                    </DialogTitle>
                                         <DialogContent>
                       <Typography variant="body2" color="textSecondary" mb={3}>
                         {processAction === 'approve' 
                           ? '이 인출 요청을 승인하시겠습니까? 승인 시 해당 금액이 사용자 계좌로 자동 입금됩니다.'
                           : '이 인출 요청을 거절하시겠습니까? 거절 시 포인트가 사용자 계정으로 환불됩니다.'
                         }
                       </Typography>
                       
                       {processAction === 'approve' && selectedWithdrawal?.bankInfo && (
                         <Alert severity="info" sx={{ mb: 3 }}>
                           <Typography variant="body2">
                             <strong>자동 입금 정보:</strong><br />
                             은행: {selectedWithdrawal.bankInfo.bankName}<br />
                             계좌: {selectedWithdrawal.bankInfo.accountNumber}<br />
                             예금주: {selectedWithdrawal.bankInfo.accountHolder}
                           </Typography>
                         </Alert>
                       )}

                       {processAction === 'approve' && !selectedWithdrawal?.bankInfo && (
                         <>
                           <Alert severity="warning" sx={{ mb: 3 }}>
                             <Typography variant="body2">
                               <strong>⚠️ 은행 정보가 없습니다.</strong><br />
                               아래에 은행 정보를 입력해주세요.
                             </Typography>
                           </Alert>
                           
                           <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
                             은행 정보 입력
                           </Typography>
                           
                           <Grid container spacing={2} sx={{ mb: 3 }}>
                             <Grid item xs={12}>
                               <TextField
                                 fullWidth
                                 label="은행명"
                                 value={manualBankInfo.bankName}
                                 onChange={(e) => setManualBankInfo(prev => ({ ...prev, bankName: e.target.value }))}
                                 placeholder="예: 신한은행, 국민은행"
                                 required
                               />
                             </Grid>
                             <Grid item xs={12}>
                               <TextField
                                 fullWidth
                                 label="계좌번호"
                                 value={manualBankInfo.accountNumber}
                                 onChange={(e) => setManualBankInfo(prev => ({ ...prev, accountNumber: e.target.value }))}
                                 placeholder="계좌번호를 입력하세요"
                                 required
                               />
                             </Grid>
                             <Grid item xs={12}>
                               <TextField
                                 fullWidth
                                 label="예금주명"
                                 value={manualBankInfo.accountHolder}
                                 onChange={(e) => setManualBankInfo(prev => ({ ...prev, accountHolder: e.target.value }))}
                                 placeholder="예금주명을 입력하세요"
                                 required
                               />
                             </Grid>
                           </Grid>
                         </>
                       )}
                      
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="처리 메모"
                        value={processNote}
                        onChange={(e) => setProcessNote(e.target.value)}
                        placeholder="처리 사유를 입력하세요"
                      />
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={() => setProcessDialogOpen(false)}>취소</Button>
                      <Button
                        onClick={handleProcess}
                        variant="contained"
                        color={processAction === 'approve' ? 'success' : 'error'}
                        disabled={
                          processing || 
                          (processAction === 'approve' && 
                           !selectedWithdrawal?.bankInfo && 
                           (!manualBankInfo.bankName || !manualBankInfo.accountNumber || !manualBankInfo.accountHolder))
                        }
                        startIcon={processing ? <CircularProgress size={16} /> : undefined}
                      >
                        {processing ? '처리 중...' : (processAction === 'approve' ? '승인' : '거절')}
                      </Button>
                    </DialogActions>
                  </Dialog>
    </Box>
  );
};

export default PointWithdrawalManagement;
