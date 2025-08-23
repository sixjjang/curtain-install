import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Grid,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  AccountBalance, 
  Payment, 
  AccountBalanceWallet, 
  History,
  CheckCircle,
  Warning,
  Schedule
} from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { PointService } from '../../../shared/services/pointService';
import { JobService } from '../../../shared/services/jobService';
import { SystemSettingsService } from '../../../shared/services/systemSettingsService';
import { PointBalance, PointTransaction } from '../../../types';

const PointManagement: React.FC = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<PointBalance | null>(null);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 인출 다이얼로그 상태
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankInfo, setBankInfo] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: ''
  });
  
  // 기간별 필터링 상태
  const [selectedPeriod, setSelectedPeriod] = useState<'1month' | '3months' | '6months' | '1year' | 'all'>('all');
  
  // 완료된 작업 포인트 수령 상태
  const [claimingPoints, setClaimingPoints] = useState(false);
  const [completedJobs, setCompletedJobs] = useState<any[]>([]);
  
  // 시스템 설정 상태
  const [systemSettings, setSystemSettings] = useState<{
    escrowAutoReleaseHours: number;
  } | null>(null);

  // 데이터 로드
  const loadData = async (period: '1month' | '3months' | '6months' | '1year' | 'all' = selectedPeriod) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError('');
      
      // 포인트 잔액 상세 조회 (총충전, 총인출 포함)
      const balanceDetails = await PointService.getPointBalanceDetails(user.id, 'contractor');
      setBalance(balanceDetails);
      
      // 거래 내역 조회 (기간별 필터링 적용)
      const transactionData = await PointService.getTransactionHistory(user.id, 'contractor', period);
      setTransactions(transactionData);
      
      // 완료된 작업 조회
      const jobs = await JobService.getJobsByContractor(user.id);
      const completedJobsData = jobs.filter(job => job.status === 'completed');
      setCompletedJobs(completedJobsData);
      
      // 시스템 설정 조회
      const settings = await SystemSettingsService.getSystemSettings();
      setSystemSettings({
        escrowAutoReleaseHours: settings.escrowAutoReleaseHours
      });
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 기간 변경 핸들러
  const handlePeriodChange = async (newPeriod: '1month' | '3months' | '6months' | '1year' | 'all') => {
    setSelectedPeriod(newPeriod);
    await loadData(newPeriod);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // 완료된 작업 포인트 수령 처리
  const handleClaimCompletedJobPoints = async () => {
    if (!user) return;
    
    try {
      setClaimingPoints(true);
      setError('');
      
      let totalClaimed = 0;
      
      for (const job of completedJobs) {
        try {
          // 각 완료된 작업에 대해 포인트 지급 시도
          await PointService.releaseEscrowToContractor(job.id, user.id);
          totalClaimed += job.finalAmount || 0;
        } catch (jobError) {
          console.warn(`작업 ${job.id} 포인트 지급 실패:`, jobError);
          // 개별 작업 실패는 계속 진행
        }
      }
      
      if (totalClaimed > 0) {
        setSuccess(`${totalClaimed.toLocaleString()}P가 성공적으로 지급되었습니다.`);
        // 데이터 새로고침
        await loadData();
      } else {
        setError('지급할 포인트가 없습니다.');
      }
    } catch (error) {
      console.error('포인트 수령 실패:', error);
      setError('포인트 수령 중 오류가 발생했습니다.');
    } finally {
      setClaimingPoints(false);
    }
  };

  // 인출 처리
  const handleWithdraw = async () => {
    if (!user || !withdrawAmount || parseInt(withdrawAmount) <= 0) {
      setError('올바른 금액을 입력해주세요.');
      return;
    }

    const amount = parseInt(withdrawAmount);
    
    if (amount > (balance?.balance || 0)) {
      setError('잔액이 부족합니다.');
      return;
    }

    // 은행 정보 검증
    if (!bankInfo.bankName || !bankInfo.accountNumber || !bankInfo.accountHolder) {
      setError('은행 정보를 모두 입력해주세요.');
      return;
    }
    
    try {
      setWithdrawing(true);
      setError('');
      
      // 포인트 인출 요청 (은행 정보 포함)
      await PointService.requestWithdrawal(user.id, 'contractor', amount, bankInfo);
      
      setSuccess(`${amount.toLocaleString()}포인트 인출 요청이 완료되었습니다.`);
      setWithdrawDialogOpen(false);
      setWithdrawAmount('');
      setBankInfo({ bankName: '', accountNumber: '', accountHolder: '' });
      
      // 데이터 새로고침
      await loadData();
    } catch (error) {
      console.error('포인트 인출 실패:', error);
      setError('포인트 인출에 실패했습니다.');
    } finally {
      setWithdrawing(false);
    }
  };

  // 거래 상태 텍스트
  const getStatusText = (status: string, type?: string) => {
    // 시공완료보수(payment, release) 타입의 경우 '입금'으로 표시
    if ((type === 'payment' || type === 'release') && status === 'completed') {
      return '입금';
    }
    
    // 포인트 인출(withdraw) 타입의 경우 상태별로 표시
    if (type === 'withdraw') {
      if (status === 'pending') {
        return '인출중';
      } else if (status === 'completed') {
        return '인출완료';
      }
    }
    
    switch (status) {
      case 'pending': return '처리중';
      case 'completed': return '완료';
      case 'failed': return '실패';
      case 'cancelled': return '취소';
      default: return '알 수 없음';
    }
  };

  // 거래 상태 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  // 거래 타입 텍스트
  const getTypeText = (type: string, compensationType?: string, deductionType?: string) => {
    switch (type) {
      case 'charge': return '충전';
      case 'payment': return '지급';
      case 'withdraw': return '인출';
      case 'refund': return '환불';
      case 'escrow': return '사용';
      case 'release': return '지급';
      case 'deduction': 
        switch (deductionType) {
          case 'job_cancellation_fee': return '취소 수수료';
          case 'fee': return '수수료';
          case 'penalty': return '벌금';
          case 'other': return '기타 차감';
          default: return '차감';
        }
      case 'compensation': 
        switch (compensationType) {
          case 'product_not_ready': return '제품 미준비 보상';
          case 'customer_absent': return '소비자 부재 보상';
          case 'schedule_change': return '일정 변경 보상';
          default: return '보상';
        }
      default: return '알 수 없음';
    }
  };

  // 48시간 대기 중인 지급 확인
  const getPendingPayments = () => {
    return transactions.filter(t => 
      t.type === 'payment' && 
      t.status === 'pending' && 
      t.relatedJobId
    );
  };

  const pendingPayments = getPendingPayments();

  // 에스크로 자동 지급 시간에 따른 안내 문구 생성
  const getEscrowReleaseText = () => {
    if (!systemSettings) {
      return '시공 완료 후 포인트가 지급됩니다';
    }
    
    const hours = systemSettings.escrowAutoReleaseHours;
    
    if (hours === 0) {
      return '시공 완료 시 즉시 포인트가 지급됩니다';
    } else if (hours === 24) {
      return '시공 완료 후 24시간 후에 포인트가 자동 지급됩니다';
    } else if (hours === 48) {
      return '시공 완료 후 48시간 후에 포인트가 자동 지급됩니다';
    } else if (hours === 72) {
      return '시공 완료 후 72시간 후에 포인트가 자동 지급됩니다';
    } else {
      return `시공 완료 후 ${hours}시간 후에 포인트가 자동 지급됩니다`;
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
      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={3}>
        <Button 
          variant="contained" 
          startIcon={<AccountBalanceWallet />}
          onClick={() => setWithdrawDialogOpen(true)}
          disabled={(balance?.balance || 0) <= 0}
        >
          포인트 인출
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

      <Grid container spacing={3}>
        {/* 포인트 잔액 카드 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <AccountBalance color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">포인트 잔액</Typography>
              </Box>
              
              <Typography variant="h4" color="primary" fontWeight="bold" mb={1}>
                {balance?.balance.toLocaleString() || 0} P
              </Typography>
              
              <Typography variant="body2" color="textSecondary" mb={2}>
                ≈ {(balance?.balance || 0).toLocaleString()}원
              </Typography>
              
              <Box display="flex" gap={1} flexWrap="wrap">
                <Chip 
                  label={`총 수령: ${(balance?.totalCharged || 0).toLocaleString()}P`} 
                  color="success" 
                  size="small" 
                />
                <Chip 
                  label={`총 인출: ${(balance?.totalWithdrawn || 0).toLocaleString()}P`} 
                  color="secondary" 
                  size="small" 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 포인트 수령 안내 */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                포인트 수령 안내
              </Typography>
              
                             <Box component="ul" sx={{ pl: 2 }}>
                 <Typography component="li" variant="body2" mb={1}>
                   1포인트 = 1원으로 환산됩니다
                 </Typography>
                 <Typography component="li" variant="body2" mb={1}>
                   {getEscrowReleaseText()}
                 </Typography>
                 <Typography component="li" variant="body2" mb={1}>
                   포인트는 현금으로 인출할 수 있습니다
                 </Typography>
                 <Typography component="li" variant="body2" mb={2}>
                   인출 요청 후 1-2일 내에 계좌로 입금됩니다
                 </Typography>
               </Box>
              
              {/* 완료된 작업 포인트 수령 버튼 */}
              {completedJobs.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleClaimCompletedJobPoints}
                    disabled={claimingPoints}
                    startIcon={claimingPoints ? <CircularProgress size={20} /> : <CheckCircle />}
                    fullWidth
                  >
                    {claimingPoints ? '포인트 수령 중...' : `완료된 작업 포인트 수령 (${completedJobs.length}건)`}
                  </Button>
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                    완료된 작업이 있지만 포인트가 지급되지 않은 경우 위 버튼을 클릭하세요.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 대기 중인 지급 */}
        {pendingPayments.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Schedule color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h6">대기 중인 지급</Typography>
                </Box>
                
                <List>
                  {pendingPayments.map((payment, index) => (
                    <React.Fragment key={payment.id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="subtitle1">
                                {payment.description}
                              </Typography>
                              <Chip 
                                label="48시간 대기" 
                                color="warning" 
                                size="small" 
                                icon={<Schedule />}
                              />
                            </Box>
                          }
                          secondary={
                            <Typography variant="body2" color="textSecondary" component="div">
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="body2" color="textSecondary">
                                  {payment.createdAt.toLocaleString()}
                                </Typography>
                                <Typography 
                                  variant="h6" 
                                  color="success.main"
                                  fontWeight="bold"
                                >
                                  +{payment.amount.toLocaleString()}P
                                </Typography>
                              </Box>
                            </Typography>
                          }
                        />
                      </ListItem>
                      {index < pendingPayments.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* 거래 내역 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                  <Typography variant="h6">
                    거래 내역
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    총 {transactions.length}건
                  </Typography>
                </Box>
                
                {/* 기간별 필터링 */}
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>기간 선택</InputLabel>
                  <Select
                    value={selectedPeriod}
                    onChange={(e) => handlePeriodChange(e.target.value as '1month' | '3months' | '6months' | '1year' | 'all')}
                    label="기간 선택"
                  >
                    <MenuItem value="all">전체</MenuItem>
                    <MenuItem value="1month">1개월</MenuItem>
                    <MenuItem value="3months">3개월</MenuItem>
                    <MenuItem value="6months">6개월</MenuItem>
                    <MenuItem value="1year">1년</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              {transactions.length === 0 ? (
                <Typography color="textSecondary" textAlign="center" py={4}>
                  {selectedPeriod === 'all' ? '거래 내역이 없습니다.' : '선택한 기간에 거래 내역이 없습니다.'}
                </Typography>
              ) : (
                <List>
                  {transactions.map((transaction, index) => (
                    <React.Fragment key={transaction.id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Box>
                                <Typography variant="subtitle1">
                                  {transaction.description}
                                </Typography>
                                {transaction.jobId && (
                                  <Typography variant="caption" color="textSecondary">
                                    작업 ID: {transaction.jobId}
                                  </Typography>
                                )}
                              </Box>
                                                             <Box display="flex" gap={1} alignItems="center">
                                 {/* 포인트 인출의 경우 타입 칩을 표시하지 않음 */}
                                 {transaction.type !== 'withdraw' && (
                                   <Chip 
                                     label={getTypeText(transaction.type, transaction.compensationType, transaction.deductionType)} 
                                     color={transaction.type === 'compensation' ? 'success' : transaction.type === 'deduction' ? 'error' : 'primary'} 
                                     size="small" 
                                     variant="outlined"
                                   />
                                 )}
                                 <Chip 
                                   label={getStatusText(transaction.status, transaction.type)} 
                                   color={getStatusColor(transaction.status)} 
                                   size="small" 
                                 />
                               </Box>
                            </Box>
                          }
                          secondary={
                            <Typography variant="body2" color="textSecondary" component="div">
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="body2" color="textSecondary">
                                  {transaction.createdAt.toLocaleString()}
                                </Typography>
                                <Typography 
                                  variant="h6" 
                                  color={transaction.amount > 0 ? 'success.main' : 'error.main'}
                                  fontWeight="bold"
                                >
                                  {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()}P
                                </Typography>
                              </Box>
                            </Typography>
                          }
                        />
                      </ListItem>
                      {index < transactions.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 포인트 인출 다이얼로그 */}
              <Dialog open={withdrawDialogOpen} onClose={() => setWithdrawDialogOpen(false)} maxWidth="sm" fullWidth disableEnforceFocus disableAutoFocus>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <AccountBalanceWallet color="primary" />
            포인트 인출
          </Box>
        </DialogTitle>
        <DialogContent sx={{
          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : 'background.default'
        }}>
          <Typography variant="body2" color="textSecondary" mb={3}>
            인출할 포인트 금액과 은행 정보를 입력해주세요.
          </Typography>
          
          <TextField
            fullWidth
            label="인출 금액 (포인트)"
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="인출할 포인트를 입력하세요"
            InputProps={{
              endAdornment: <Typography variant="caption">P</Typography>
            }}
            sx={{ mb: 3 }}
          />
          
          {withdrawAmount && (
            <Box mt={2} p={2} bgcolor="primary.light" borderRadius={1} sx={{ mb: 3 }}>
              <Typography variant="body2" color="white">
                인출 예정: {parseInt(withdrawAmount) || 0}포인트 ({(parseInt(withdrawAmount) || 0).toLocaleString()}원)
              </Typography>
            </Box>
          )}

          <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
            은행 정보
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="은행명"
                value={bankInfo.bankName}
                onChange={(e) => setBankInfo(prev => ({ ...prev, bankName: e.target.value }))}
                placeholder="예: 신한은행, 국민은행"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="계좌번호"
                value={bankInfo.accountNumber}
                onChange={(e) => setBankInfo(prev => ({ ...prev, accountNumber: e.target.value }))}
                placeholder="계좌번호를 입력하세요"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="예금주명"
                value={bankInfo.accountHolder}
                onChange={(e) => setBankInfo(prev => ({ ...prev, accountHolder: e.target.value }))}
                placeholder="예금주명을 입력하세요"
                required
              />
            </Grid>
          </Grid>
          
          <Alert severity="info" sx={{ mt: 3 }}>
            인출 요청 후 1-2일 내에 등록된 계좌로 입금됩니다.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWithdrawDialogOpen(false)}>
            취소
          </Button>
          <Button
            onClick={handleWithdraw}
            variant="contained"
            disabled={
              withdrawing || 
              !withdrawAmount || 
              parseInt(withdrawAmount) <= 0 || 
              parseInt(withdrawAmount) > (balance?.balance || 0) ||
              !bankInfo.bankName ||
              !bankInfo.accountNumber ||
              !bankInfo.accountHolder
            }
            startIcon={withdrawing ? <CircularProgress size={16} /> : <CheckCircle />}
          >
            {withdrawing ? '인출 중...' : '인출하기'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PointManagement;
