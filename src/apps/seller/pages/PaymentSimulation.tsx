import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { 
  Payment, 
  CheckCircle, 
  Error, 
  AccountBalance,
  Schedule,
  Security
} from '@mui/icons-material';
import { PaymentService } from '../../../shared/services/paymentService';
import { useAuth } from '../../../shared/contexts/AuthContext';

const PaymentSimulation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    const orderIdParam = searchParams.get('orderId');
    const amountParam = searchParams.get('amount');

    if (orderIdParam && amountParam) {
      setOrderId(orderIdParam);
      setAmount(parseInt(amountParam));
    }
  }, [searchParams]);

  const handlePaymentSuccess = async () => {
    if (!orderId || !amount) return;

    try {
      setProcessing(true);
      
      // 결제 완료 처리
      const result = await PaymentService.completePayment(orderId, amount);
      
      if (result.success) {
        // 성공 시 포인트 관리 페이지로 이동
        navigate('/seller/points', { 
          state: { 
            success: true, 
            message: `${amount.toLocaleString()}포인트가 성공적으로 충전되었습니다.` 
          } 
        });
      } else {
        console.error('결제 처리 실패:', result.error);
        alert('결제 처리에 실패했습니다: ' + result.error);
      }
    } catch (error: unknown) {
      console.error('결제 처리 실패:', error);
      let errorMessage = '알 수 없는 오류';
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      alert('결제 처리에 실패했습니다: ' + errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentCancel = () => {
    navigate('/seller/points');
  };

  if (!orderId || !amount) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Alert severity="error">
          결제 정보를 찾을 수 없습니다.
        </Alert>
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
      <Card sx={{ maxWidth: 600, width: '100%', mx: 2 }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Payment color="primary" sx={{ fontSize: 80, mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            결제 시뮬레이션
          </Typography>
          <Typography variant="body1" color="textSecondary" mb={4}>
            실제 결제 시스템 연동 전 테스트용 페이지입니다.
          </Typography>

          {/* 결제 정보 */}
          <Card variant="outlined" sx={{ mb: 4, textAlign: 'left' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                결제 정보
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <AccountBalance />
                  </ListItemIcon>
                  <ListItemText 
                    primary="충전 금액" 
                    secondary={`${amount.toLocaleString()}원 (${amount.toLocaleString()}포인트)`} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Schedule />
                  </ListItemIcon>
                  <ListItemText 
                    primary="주문번호" 
                    secondary={orderId} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Security />
                  </ListItemIcon>
                  <ListItemText 
                    primary="결제 방식" 
                    secondary="시뮬레이션 (테스트)" 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* 결제 시뮬레이션 안내 */}
          <Alert severity="info" sx={{ mb: 4 }}>
            <Typography variant="body2">
              <strong>시뮬레이션 모드</strong><br />
              • 실제 결제가 발생하지 않습니다<br />
              • 포인트는 즉시 충전됩니다<br />
              • 테스트 목적으로만 사용하세요
            </Typography>
          </Alert>

          {/* 결제 버튼 */}
          <Box display="flex" gap={2} justifyContent="center">
            <Button
              variant="outlined"
              onClick={handlePaymentCancel}
              size="large"
              disabled={processing}
            >
              결제 취소
            </Button>
            <Button
              variant="contained"
              onClick={handlePaymentSuccess}
              size="large"
              disabled={processing}
              startIcon={processing ? <CircularProgress size={20} /> : <CheckCircle />}
            >
              {processing ? '처리 중...' : '결제 완료'}
            </Button>
          </Box>

          {/* 다음 단계 안내 */}
          <Divider sx={{ my: 4 }} />
          <Typography variant="body2" color="textSecondary">
            <strong>다음 단계:</strong> 카카오페이, 토스페이먼츠 등 실제 결제 시스템 연동
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PaymentSimulation;
