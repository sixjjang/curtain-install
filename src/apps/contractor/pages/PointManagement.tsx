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
  Divider
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

  // 데이터 로드
  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError('');
      
      // 포인트 잔액 조회
      const balanceData = await PointService.getPointBalance(user.id, 'contractor');
      setBalance({ balance: balanceData });
      
      // 거래 내역 조회
      const transactionData = await PointService.getTransactionHistory(user.id, 'contractor');
      setTransactions(transactionData);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

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
    
    try {
      setWithdrawing(true);
      setError('');
      
      // 인출 요청 기능은 향후 구현 예정
      console.log('인출 요청:', amount);
      throw new Error('인출 기능은 아직 구현되지 않았습니다.');
      
      setSuccess(`${amount.toLocaleString()}포인트 인출 요청이 완료되었습니다.`);
      setWithdrawDialogOpen(false);
      setWithdrawAmount('');
      
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
  const getStatusText = (status: string) => {
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
  const getTypeText = (type: string) => {
    switch (type) {
      case 'charge': return '충전';
      case 'payment': return '지급';
      case 'withdrawal': return '인출';
      case 'refund': return '환불';
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
                ≈ {((balance?.balance || 0) / 1000).toLocaleString()}원
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
                  시공 완료 후 48시간 뒤에 포인트가 지급됩니다
                </Typography>
                <Typography component="li" variant="body2" mb={1}>
                  포인트는 현금으로 인출할 수 있습니다
                </Typography>
                <Typography component="li" variant="body2">
                  인출 요청 후 1-2일 내에 계좌로 입금됩니다
                </Typography>
              </Box>
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
              <Typography variant="h6" gutterBottom>
                거래 내역
              </Typography>
              
              {transactions.length === 0 ? (
                <Typography color="textSecondary" textAlign="center" py={4}>
                  포인트 잔액이 없습니다.
                </Typography>
              ) : (
                <List>
                  {transactions.map((transaction, index) => (
                    <React.Fragment key={transaction.id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="subtitle1">
                                {transaction.description}
                              </Typography>
                              <Box display="flex" gap={1} alignItems="center">
                                <Chip 
                                  label={getTypeText(transaction.type)} 
                                  color="primary" 
                                  size="small" 
                                  variant="outlined"
                                />
                                <Chip 
                                  label={getStatusText(transaction.status)} 
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
      <Dialog open={withdrawDialogOpen} onClose={() => setWithdrawDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <AccountBalanceWallet color="primary" />
            포인트 인출
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" mb={3}>
            인출할 포인트 금액을 입력해주세요.
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
          />
          
          {withdrawAmount && (
            <Box mt={2} p={2} bgcolor="primary.light" borderRadius={1}>
              <Typography variant="body2" color="white">
                인출 예정: {parseInt(withdrawAmount) || 0}포인트 ({(parseInt(withdrawAmount) || 0).toLocaleString()}원)
              </Typography>
            </Box>
          )}
          
          <Alert severity="info" sx={{ mt: 2 }}>
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
            disabled={withdrawing || !withdrawAmount || parseInt(withdrawAmount) <= 0 || parseInt(withdrawAmount) > (balance?.balance || 0)}
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
