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
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  InputLabel,
  Paper
} from '@mui/material';
import { 
  AccountBalance, 
  Payment, 
  History, 
  Add,
  CheckCircle,
  Warning,
  CreditCard,
  AccountBalanceWallet,
  Info
} from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { PointService } from '../../../shared/services/pointService';
import { PaymentService } from '../../../shared/services/paymentService';
import { SystemSettingsService } from '../../../shared/services/systemSettingsService';
import { PointBalance, PointTransaction } from '../../../types';
import { useLocation } from 'react-router-dom';

const PointCharge: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [balance, setBalance] = useState<PointBalance | null>(null);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [charging, setCharging] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 충전 다이얼로그 상태
  const [chargeDialogOpen, setChargeDialogOpen] = useState(false);
  const [chargeAmount, setChargeAmount] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'simulation' | 'toss_payments' | 'kakao_pay'>('simulation');
  const [tossPaymentMethod, setTossPaymentMethod] = useState('card');
  
  // 토스페이먼츠 계좌 정보 상태
  const [tossAccountInfo, setTossAccountInfo] = useState<{
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    isActive: boolean;
  } | null>(null);
  
  // 기간별 필터링 상태
  const [selectedPeriod, setSelectedPeriod] = useState<'1month' | '3months' | '6months' | '1year' | 'all'>('all');

  // 충전 금액 옵션
  const chargeOptions = [
    { amount: 10000, label: '10,000원 (10,000포인트)' },
    { amount: 30000, label: '30,000원 (30,000포인트)' },
    { amount: 50000, label: '50,000원 (50,000포인트)' },
    { amount: 100000, label: '100,000원 (100,000포인트)' },
    { amount: 200000, label: '200,000원 (200,000포인트)' },
    { amount: 500000, label: '500,000원 (500,000포인트)' }
  ];

  // 데이터 로드
  const loadData = async (period: '1month' | '3months' | '6months' | '1year' | 'all' = selectedPeriod) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError('');
      
      // 포인트 잔액 상세 조회 (총충전, 총인출 포함)
      const balanceDetails = await PointService.getPointBalanceDetails(user.id, 'seller');
      setBalance(balanceDetails);
      
      // 거래 내역 조회 (기간별 필터링 적용)
      const transactionData = await PointService.getTransactionHistory(user.id, 'seller', period);
      setTransactions(transactionData);
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

  // 토스페이먼츠 계좌 정보 로드
  const loadTossAccountInfo = async () => {
    try {
      const accountInfo = await SystemSettingsService.getTossAccount();
      setTossAccountInfo(accountInfo);
    } catch (error) {
      console.error('토스페이먼츠 계좌 정보 로드 실패:', error);
    }
  };

  // 결제 수단 변경 시 계좌 정보 로드
  const handlePaymentMethodChange = async (method: 'simulation' | 'toss_payments' | 'kakao_pay') => {
    setPaymentMethod(method);
    if (method === 'toss_payments') {
      await loadTossAccountInfo();
    }
  };

  // 토스페이먼츠 결제 수단 변경 시 계좌 정보 로드
  const handleTossPaymentMethodChange = async (method: string) => {
    setTossPaymentMethod(method);
    if (method === 'transfer') {
      await loadTossAccountInfo();
    }
  };

  useEffect(() => {
    loadData();
    
    // 결제 완료 후 성공 메시지 표시
    if (location.state?.success && location.state?.message) {
      setSuccess(location.state.message);
      // state 초기화
      window.history.replaceState({}, document.title);
    }
  }, [user, location.state]);

  // 충전 처리
  const handleCharge = async () => {
    if (!user || !chargeAmount || parseInt(chargeAmount) <= 0) {
      setError('올바른 금액을 입력해주세요.');
      return;
    }

    const amount = parseInt(chargeAmount);
    
    try {
      setCharging(true);
      setError('');
      
             // 주문 ID 생성
      const orderId = `ORDER_${Date.now()}_${user.id}`;
      
      let paymentResult;
      
      // 결제 수단에 따른 처리
      switch (paymentMethod) {
        case 'kakao_pay':
          paymentResult = await PaymentService.requestKakaoPay({
            amount,
            orderId,
            itemName: `${amount.toLocaleString()}포인트 충전`,
            userId: user.id,
            userRole: 'seller'
          });
          break;
          
        case 'toss_payments':
          paymentResult = await PaymentService.requestTossPayments({
            amount,
            orderId,
            itemName: `${amount.toLocaleString()}포인트 충전`,
            userId: user.id,
            userRole: 'seller'
          }, tossPaymentMethod);
          break;
          
        default: // simulation
          paymentResult = await PaymentService.requestPayment({
            amount,
            orderId,
            itemName: `${amount.toLocaleString()}포인트 충전`,
            userId: user.id,
            userRole: 'seller'
          });
          break;
      }
      
      if (paymentResult.success && paymentResult.redirectUrl) {
        // 결제 페이지로 리다이렉트
        window.location.href = paymentResult.redirectUrl;
      } else {
        throw new Error(paymentResult.error || '결제 요청에 실패했습니다.');
      }
    } catch (error) {
      console.error('포인트 충전 실패:', error);
      setError('포인트 충전에 실패했습니다.');
    } finally {
      setCharging(false);
    }
  };

  // 충전 금액 선택
  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setChargeAmount(amount.toString());
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
      case 'escrow': return '사용';
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
      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={3}>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={() => setChargeDialogOpen(true)}
        >
          포인트 충전
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
                  label={`총 충전: ${(balance?.totalCharged || 0).toLocaleString()}P`} 
                  color="info" 
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

        {/* 포인트 사용 안내 */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                포인트 사용 안내
              </Typography>
              
              <Box component="ul" sx={{ pl: 2 }}>
                <Typography component="li" variant="body2" mb={1}>
                  1포인트 = 1원으로 사용됩니다
                </Typography>
                <Typography component="li" variant="body2" mb={1}>
                  시공 완료 후 48시간 뒤에 시공자에게 포인트가 지급됩니다
                </Typography>
                <Typography component="li" variant="body2" mb={1}>
                  시공상 문제 발생 시 48시간 내에 환불 요청이 가능합니다
                </Typography>
                <Typography component="li" variant="body2">
                  포인트는 현금으로 인출할 수 있습니다
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

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
                              <Box display="flex" flexDirection="column" gap={0.5}>
                                <Typography variant="subtitle1" component="span">
                                  {transaction.description}
                                </Typography>
                                {transaction.jobId && (
                                  <Typography variant="caption" color="textSecondary">
                                    작업 ID: {transaction.jobId}
                                  </Typography>
                                )}
                                <Typography 
                                  variant="h6" 
                                  color={transaction.amount > 0 ? 'success.main' : 'error.main'}
                                  fontWeight="bold"
                                  component="span"
                                >
                                  {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()}P
                                </Typography>
                              </Box>
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
                            <Typography variant="body2" color="textSecondary" component="span">
                              {transaction.createdAt.toLocaleString()}
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

      {/* 포인트 충전 다이얼로그 */}
              <Dialog open={chargeDialogOpen} onClose={() => setChargeDialogOpen(false)} maxWidth="sm" fullWidth disableEnforceFocus disableAutoFocus>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1} component="div">
            <Payment color="primary" />
            <Typography component="span">포인트 충전</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" mb={3}>
            충전할 포인트 금액을 선택하거나 직접 입력해주세요.
          </Typography>
          
          {/* 충전 금액 옵션 */}
          <Grid container spacing={2} mb={3}>
            {chargeOptions.map((option) => (
              <Grid item xs={12} sm={6} key={option.amount}>
                <Button
                  variant={selectedAmount === option.amount ? "contained" : "outlined"}
                  fullWidth
                  onClick={() => handleAmountSelect(option.amount)}
                  sx={{ py: 2 }}
                >
                  {option.label}
                </Button>
              </Grid>
            ))}
          </Grid>
          
          {/* 직접 입력 */}
          <TextField
            fullWidth
            label="직접 입력 (원)"
            type="number"
            value={chargeAmount}
            onChange={(e) => {
              setChargeAmount(e.target.value);
              setSelectedAmount(null);
            }}
            placeholder="충전할 금액을 입력하세요"
            InputProps={{
              endAdornment: <Typography variant="caption">원</Typography>
            }}
          />
          
          {chargeAmount && (
            <Box mt={2} p={2} bgcolor="primary.light" borderRadius={1}>
              <Typography variant="body2" color="white">
                충전 예정: {parseInt(chargeAmount) || 0}포인트 ({(parseInt(chargeAmount) || 0).toLocaleString()}원)
              </Typography>
            </Box>
          )}

          {/* 결제 수단 선택 */}
          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              결제 수단 선택
            </Typography>
            
            <FormControl component="fieldset" fullWidth>
              <RadioGroup
                value={paymentMethod}
                onChange={(e) => handlePaymentMethodChange(e.target.value as 'simulation' | 'toss_payments' | 'kakao_pay')}
              >
                <FormControlLabel
                  value="simulation"
                  control={<Radio />}
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <AccountBalanceWallet color="primary" />
                      <Typography component="span">시뮬레이션 (테스트)</Typography>
                    </Box>
                  }
                />

                <FormControlLabel
                  value="kakao_pay"
                  control={<Radio />}
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box 
                        component="img" 
                        src="https://developers.kakao.com/assets/img/about/logos/kakaopay/kakaopay_btn_small.png" 
                        alt="카카오페이"
                        sx={{ width: 20, height: 20 }}
                      />
                      <Typography component="span">카카오페이</Typography>
                    </Box>
                  }
                />

                <FormControlLabel
                  value="toss_payments"
                  control={<Radio />}
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <CreditCard color="primary" />
                      <Typography component="span">토스페이먼츠</Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>

            {/* 토스페이먼츠 결제 수단 선택 */}
            {paymentMethod === 'toss_payments' && (
              <Box mt={2}>
                <FormControl fullWidth>
                  <InputLabel>결제 방법</InputLabel>
                  <Select
                    value={tossPaymentMethod}
                    onChange={(e) => handleTossPaymentMethodChange(e.target.value)}
                    label="결제 방법"
                  >
                    <MenuItem value="card">신용카드</MenuItem>
                    <MenuItem value="transfer">계좌이체</MenuItem>
                    <MenuItem value="virtual_account">가상계좌</MenuItem>
                    <MenuItem value="phone">휴대폰 결제</MenuItem>
                    <MenuItem value="gift_certificate">상품권</MenuItem>
                    <MenuItem value="culture_gift_certificate">문화상품권</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}

            {/* 토스페이먼츠 계좌 정보 표시 */}
            {paymentMethod === 'toss_payments' && tossPaymentMethod === 'transfer' && (
              <Box mt={2}>
                {tossAccountInfo ? (
                  <Paper sx={{ p: 2, bgcolor: tossAccountInfo.isActive ? 'info.light' : 'warning.light', border: '1px solid', borderColor: tossAccountInfo.isActive ? 'info.main' : 'warning.main' }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Info color={tossAccountInfo.isActive ? 'info' : 'warning'} />
                      <Typography variant="subtitle2" fontWeight="bold">
                        토스페이먼츠 계좌 정보
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      은행: {tossAccountInfo.bankName}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      계좌번호: {tossAccountInfo.accountNumber}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      예금주: {tossAccountInfo.accountHolder}
                    </Typography>
                    <Chip 
                      label={tossAccountInfo.isActive ? '활성화' : '비활성화'}
                      color={tossAccountInfo.isActive ? 'success' : 'default'}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                    {!tossAccountInfo.isActive && (
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          현재 계좌가 비활성화되어 있습니다. 계좌이체 결제를 사용할 수 없습니다.
                        </Typography>
                      </Alert>
                    )}
                  </Paper>
                ) : (
                  <Alert severity="warning">
                    <Typography variant="body2">
                      토스페이먼츠 계좌 정보를 불러올 수 없습니다. 관리자에게 문의해주세요.
                    </Typography>
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChargeDialogOpen(false)}>
            취소
          </Button>
          <Button
            onClick={handleCharge}
            variant="contained"
            disabled={
              charging || 
              !chargeAmount || 
              parseInt(chargeAmount) <= 0 ||
              (paymentMethod === 'toss_payments' && 
               tossPaymentMethod === 'transfer' && 
               (!tossAccountInfo || !tossAccountInfo.isActive))
            }
            startIcon={charging ? <CircularProgress size={16} /> : <CheckCircle />}
          >
            {charging ? '충전 중...' : '충전하기'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PointCharge;
