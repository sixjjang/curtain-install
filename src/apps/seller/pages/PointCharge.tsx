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
  History, 
  Add,
  CheckCircle,
  Warning,
  AccountBalanceWallet,
  Info
} from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { useTheme } from '../../../shared/contexts/ThemeContext';
import { PointService } from '../../../shared/services/pointService';

import { SystemSettingsService } from '../../../shared/services/systemSettingsService';
import { ManualChargeService } from '../../../shared/services/manualChargeService';
import { PointBalance, PointTransaction } from '../../../types';
import { useLocation } from 'react-router-dom';

const PointCharge: React.FC = () => {
  const { user } = useAuth();
  const { mode } = useTheme();
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
  const [paymentMethod] = useState<'manual_transfer'>('manual_transfer');
  
  // 수동 계좌이체 계좌 정보 상태
  const [manualAccountInfo, setManualAccountInfo] = useState<{
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    isActive: boolean;
  } | null>(null);
  
  // 기간별 필터링 상태
  const [selectedPeriod, setSelectedPeriod] = useState<'1month' | '3months' | '6months' | '1year' | 'all'>('all');

  // 충전 금액 옵션
  const chargeOptions = [
    { amount: 50000, label: '50,000원 (50,000포인트)' },
    { amount: 100000, label: '100,000원 (100,000포인트)' },
    { amount: 300000, label: '300,000원 (300,000포인트)' },
    { amount: 500000, label: '500,000원 (500,000포인트)' }
  ];

  // 테마별 색상 설정
  const themeColors = {
    primary: mode === 'dark' ? '#667eea' : '#1976d2',
    secondary: mode === 'dark' ? '#764ba2' : '#dc004e',
    background: mode === 'dark' ? '#1e1e1e' : '#ffffff',
    text: mode === 'dark' ? '#ffffff' : '#000000',
    textSecondary: mode === 'dark' ? '#b0b0b0' : '#666666',
    cardBackground: mode === 'dark' ? '#2d2d2d' : '#ffffff',
    border: mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    glassBackground: mode === 'dark' ? 'rgba(45,45,45,0.95)' : 'rgba(255,255,255,0.95)',
  };

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

  // 수동 계좌이체 계좌 정보 로드
  const loadManualAccountInfo = async () => {
    try {
      const accountInfo = await SystemSettingsService.getManualAccount();
      setManualAccountInfo(accountInfo);
    } catch (error) {
      console.error('수동 계좌이체 계좌 정보 로드 실패:', error);
    }
  };

  useEffect(() => {
    loadData();
    loadManualAccountInfo();
    
    // 결제 완료 후 성공 메시지 표시
    if (location.state?.success && location.state?.message) {
      setSuccess(location.state.message);
      // state 초기화
      window.history.replaceState({}, document.title);
    }
  }, [user, location.state]);

  // 충전 처리
  const handleCharge = async () => {
    if (!user || !chargeAmount || parseInt(chargeAmount.replace(/,/g, '')) <= 0) {
      setError('올바른 금액을 입력해주세요.');
      return;
    }

    const amount = parseInt(chargeAmount.replace(/,/g, ''));
    
    try {
      setCharging(true);
      setError('');
      
      // 주문 ID 생성
      const orderId = `ORDER_${Date.now()}_${user.id}`;
      
      let paymentResult;
      
             // 수동 계좌이체 충전 요청 생성
       await ManualChargeService.createChargeRequest(
         user.id,
         user.name,
         user.phone,
         amount
       );
       
       setSuccess(`${amount.toLocaleString()}원 충전 요청이 완료되었습니다. 관리자 확인 후 포인트가 지급됩니다.`);
       setChargeDialogOpen(false);
       setChargeAmount('');
       setSelectedAmount(null);
       return;
      
             // 수동 계좌이체는 리다이렉트가 필요 없음
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
    setChargeAmount(amount.toLocaleString());
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
      <Dialog 
        open={chargeDialogOpen} 
        onClose={() => setChargeDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth 
        disableEnforceFocus 
        disableAutoFocus
        PaperProps={{
          sx: {
            borderRadius: 2,
            background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`,
            boxShadow: mode === 'dark' ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.3)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: themeColors.glassBackground, 
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${themeColors.border}`,
          pb: 2
        }}>
          <Box display="flex" alignItems="center" gap={2} component="div">
            <Box sx={{
              background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`,
              borderRadius: '50%',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Payment sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography component="span" variant="h6" fontWeight="bold" sx={{ 
                background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                포인트 충전
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                안전하고 빠른 포인트 충전 서비스
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ 
          background: themeColors.glassBackground, 
          backdropFilter: 'blur(10px)',
          p: 3
        }}>
          <Typography variant="body1" color="textSecondary" mb={3} sx={{ 
            textAlign: 'center',
            fontSize: '1rem',
            fontWeight: 500
          }}>
            💎 충전할 포인트 금액을 선택하거나 직접 입력해주세요
          </Typography>
          
          {/* 충전 금액 옵션 */}
          <Box mb={3}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600, color: themeColors.text }}>
              💰 추천 충전 금액
            </Typography>
            <Grid container spacing={0.5}>
              {chargeOptions.map((option) => (
                <Grid item xs={6} key={option.amount}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      transform: selectedAmount === option.amount ? 'scale(1.02)' : 'scale(1)',
                      boxShadow: selectedAmount === option.amount 
                        ? `0 4px 15px ${themeColors.primary}40` 
                        : mode === 'dark' ? '0 2px 6px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.1)',
                      border: selectedAmount === option.amount 
                        ? `2px solid ${themeColors.primary}` 
                        : '2px solid transparent',
                      background: selectedAmount === option.amount 
                        ? `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)` 
                        : themeColors.cardBackground,
                      '&:hover': {
                        transform: 'scale(1.01)',
                        boxShadow: `0 4px 15px ${themeColors.primary}30`
                      }
                    }}
                    onClick={() => handleAmountSelect(option.amount)}
                  >
                    <CardContent sx={{ 
                      textAlign: 'center', 
                      py: 1,
                      px: 1.5,
                      color: selectedAmount === option.amount ? 'white' : themeColors.text
                    }}>
                      <Typography variant="body2" fontWeight="bold" mb={0.3}>
                        {option.amount.toLocaleString()}원
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.7rem' }}>
                        {option.amount.toLocaleString()}포인트
                      </Typography>
                      {selectedAmount === option.amount && (
                        <Box sx={{ mt: 0.3 }}>
                          <CheckCircle sx={{ fontSize: 14 }} />
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
          
          {/* 직접 입력 */}
          <Box mb={3}>
            <Typography variant="h6" gutterBottom sx={{ mb: 1.5, fontWeight: 600, color: themeColors.text }}>
              ✏️ 직접 입력
            </Typography>
                         <TextField
               fullWidth
               label="충전할 금액 (원)"
               type="text"
               value={chargeAmount}
               onChange={(e) => {
                 // 숫자와 쉼표만 허용
                 const value = e.target.value.replace(/[^\d,]/g, '');
                 setChargeAmount(value);
                 setSelectedAmount(null);
               }}
               placeholder="원하는 금액을 입력하세요"
               InputProps={{
                 endAdornment: <Typography variant="body1" sx={{ fontWeight: 600 }}>원</Typography>,
                 sx: { 
                   borderRadius: 1.5,
                   fontSize: '1rem'
                 }
               }}
               sx={{
                 '& .MuiOutlinedInput-root': {
                   '&:hover fieldset': {
                     borderColor: themeColors.primary,
                   },
                   '&.Mui-focused fieldset': {
                     borderColor: themeColors.primary,
                   },
                 },
               }}
             />
          </Box>
          
                                           {chargeAmount && (
              <Card sx={{ 
                mb: 3,
                background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`,
                color: 'white',
                borderRadius: 2
              }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h6" fontWeight="bold" mb={1}>
                    충전 예정 포인트
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" mb={1}>
                    {(parseInt(chargeAmount.replace(/,/g, '')) || 0).toLocaleString()} P
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    {(parseInt(chargeAmount.replace(/,/g, '')) || 0).toLocaleString()}원
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* 입금 계좌 정보 표시 */}
            {chargeAmount && (
              <Card sx={{ 
                mb: 3,
                background: manualAccountInfo?.isActive 
                  ? `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`
                  : 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                color: 'white',
                borderRadius: 2
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={1.5}>
                    <Box sx={{
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: '50%',
                      p: 0.8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Info sx={{ color: 'white', fontSize: 20 }} />
                    </Box>
                    <Typography variant="h6" fontWeight="bold">
                      입금 계좌 정보
                    </Typography>
                  </Box>
                  
                  {manualAccountInfo ? (
                    <>
                      <Box sx={{ 
                        background: 'rgba(255,255,255,0.1)', 
                        borderRadius: 1.5, 
                        p: 1.5, 
                        mb: 1.5 
                      }}>
                        <Typography variant="body2" sx={{ mb: 0.5, opacity: 0.9 }}>
                          <strong>은행:</strong> {manualAccountInfo.bankName}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 0.5, opacity: 0.9 }}>
                          <strong>계좌번호:</strong> {manualAccountInfo.accountNumber}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          <strong>예금주:</strong> {manualAccountInfo.accountHolder}
                        </Typography>
                      </Box>
                      
                      <Chip 
                        label={manualAccountInfo.isActive ? '활성화' : '비활성화'}
                        color={manualAccountInfo.isActive ? 'success' : 'default'}
                        size="small"
                        sx={{ 
                          fontWeight: 'bold',
                          background: manualAccountInfo.isActive ? 'rgba(76, 175, 80, 0.2)' : 'rgba(158, 158, 158, 0.2)',
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.3)'
                        }}
                      />
                      
                      {!manualAccountInfo.isActive && (
                        <Alert severity="warning" sx={{ mt: 1.5, background: 'rgba(255,255,255,0.1)' }}>
                          <Typography variant="body2" sx={{ color: 'white' }}>
                            현재 계좌가 비활성화되어 있습니다. 수동 계좌이체를 사용할 수 없습니다.
                          </Typography>
                        </Alert>
                      )}
                    </>
                  ) : (
                    <Alert severity="warning" sx={{ background: 'rgba(255,255,255,0.1)' }}>
                      <Typography variant="body2" sx={{ color: 'white' }}>
                        계좌 정보를 불러올 수 없습니다. 관리자에게 문의해주세요.
                      </Typography>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 수동 계좌이체 안내 */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600, color: themeColors.text }}>
                🏦 수동 계좌이체
              </Typography>
              
              <Card sx={{ 
                mb: 2,
                background: `linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)`,
                color: 'white',
                borderRadius: 2
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={1.5}>
                    <AccountBalance sx={{ color: 'white', fontSize: 24 }} />
                    <Typography variant="h6" fontWeight="bold">
                      수동 계좌이체
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    수수료 0% • 관리자 확인 후 지급
                  </Typography>
                </CardContent>
              </Card>

              {/* 수동 계좌이체 안내 메시지 */}
              <Card sx={{ 
                mb: 2, 
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                borderRadius: 2
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={1.5}>
                    <Info sx={{ fontSize: 24 }} />
                    <Typography variant="h6" fontWeight="bold">
                      수동 계좌이체 안내
                    </Typography>
                  </Box>
                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5, opacity: 0.9 }}>
                      수수료 없이 안전하게 충전 가능합니다
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5, opacity: 0.9 }}>
                      충전 요청 후 관리자에게 자동으로 알림이 발송됩니다
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5, opacity: 0.9 }}>
                      입금 확인 후 포인트가 지급됩니다 (보통 1-2시간 내)
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ opacity: 0.9 }}>
                      입금자명을 정확히 입력해주세요 (본인명과 동일하게)
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
        </DialogContent>
        
        <DialogActions sx={{ 
          background: themeColors.glassBackground, 
          backdropFilter: 'blur(10px)',
          borderTop: `1px solid ${themeColors.border}`,
          p: 2
        }}>
          <Button 
            onClick={() => setChargeDialogOpen(false)}
            variant="outlined"
            sx={{ 
              borderRadius: 1.5,
              px: 3,
              py: 1,
              fontWeight: 600
            }}
          >
            취소
          </Button>
          <Button
            onClick={handleCharge}
            variant="contained"
                         disabled={
               charging || 
               !chargeAmount || 
               parseInt(chargeAmount.replace(/,/g, '')) <= 0 ||
               !manualAccountInfo ||
               !manualAccountInfo.isActive
             }
            startIcon={charging ? <CircularProgress size={18} /> : <CheckCircle />}
            sx={{ 
              borderRadius: 1.5,
              px: 3,
              py: 1,
              fontWeight: 600,
              background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`,
              '&:hover': {
                background: `linear-gradient(135deg, ${themeColors.primary}dd 0%, ${themeColors.secondary}dd 100%)`
              },
              '&:disabled': {
                background: 'rgba(0,0,0,0.12)'
              }
            }}
          >
            {charging ? '충전 중...' : '충전하기'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PointCharge;
