import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { CheckCircle, Error } from '@mui/icons-material';
import { PaymentService } from '../../../shared/services/paymentService';
import { useAuth } from '../../../shared/contexts/AuthContext';

const PaymentComplete: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    const handlePaymentComplete = async () => {
      try {
        // URL 파라미터에서 결제 정보 확인
        const orderIdParam = searchParams.get('orderId');
        const paymentKey = searchParams.get('paymentKey'); // 토스페이먼츠
        const successParam = searchParams.get('success');
        const amountParam = searchParams.get('amount');

        if (!orderIdParam) {
          setError('주문 정보를 찾을 수 없습니다.');
          setLoading(false);
          return;
        }

        setOrderId(orderIdParam);

        // 토스페이먼츠 결제 완료 처리
        if (paymentKey && amountParam) {
          const result = await PaymentService.confirmTossPayments(
            paymentKey, 
            orderIdParam, 
            parseInt(amountParam)
          );
          
          if (result.success) {
            setSuccess(true);
          } else {
            setError(result.error || '토스페이먼츠 결제 확인에 실패했습니다.');
          }
        }
        // 시뮬레이션 결제 완료 처리
        else if (successParam === 'true') {
          const result = await PaymentService.completePayment(orderIdParam, parseInt(amountParam || '0'));
          
          if (result.success) {
            setSuccess(true);
          } else {
            setError(result.error || '결제 확인에 실패했습니다.');
          }
        }
        else {
          setError('결제가 취소되었거나 실패했습니다.');
        }
      } catch (error) {
        console.error('결제 완료 처리 실패:', error);
        setError('결제 완료 처리에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    handlePaymentComplete();
  }, [searchParams]);

  const handleGoToPoints = () => {
    navigate('/seller/points');
  };

  const handleGoToDashboard = () => {
    navigate('/seller');
  };

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
        <CircularProgress size={60} />
        <Typography variant="h6" mt={3}>
          결제를 확인하고 있습니다...
        </Typography>
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
      <Card sx={{ maxWidth: 500, width: '100%', mx: 2 }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          {success ? (
            <>
              <CheckCircle color="success" sx={{ fontSize: 80, mb: 2 }} />
              <Typography variant="h4" gutterBottom color="success.main">
                결제 완료!
              </Typography>
              <Typography variant="body1" color="textSecondary" mb={3}>
                포인트가 성공적으로 충전되었습니다.
              </Typography>
              <Alert severity="success" sx={{ mb: 3 }}>
                주문번호: {orderId}
              </Alert>
              <Box display="flex" gap={2} justifyContent="center">
                <Button
                  variant="contained"
                  onClick={handleGoToPoints}
                  size="large"
                >
                  포인트 관리로 이동
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleGoToDashboard}
                  size="large"
                >
                  대시보드로 이동
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Error color="error" sx={{ fontSize: 80, mb: 2 }} />
              <Typography variant="h4" gutterBottom color="error.main">
                결제 실패
              </Typography>
              <Typography variant="body1" color="textSecondary" mb={3}>
                {error}
              </Typography>
              <Alert severity="error" sx={{ mb: 3 }}>
                주문번호: {orderId}
              </Alert>
              <Box display="flex" gap={2} justifyContent="center">
                <Button
                  variant="contained"
                  onClick={handleGoToPoints}
                  size="large"
                >
                  다시 시도
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleGoToDashboard}
                  size="large"
                >
                  대시보드로 이동
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default PaymentComplete;
