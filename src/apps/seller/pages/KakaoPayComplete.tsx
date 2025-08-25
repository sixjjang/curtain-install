import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Paper,
  Container
} from '@mui/material';
import { CheckCircle, Error } from '@mui/icons-material';
import { PaymentService } from '../../../shared/services/paymentService';

const KakaoPayComplete: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    const pgToken = searchParams.get('pg_token');
    const orderIdParam = searchParams.get('partner_order_id');
    const amountParam = searchParams.get('total_amount');

    if (!pgToken || !orderIdParam) {
      setError('결제 정보가 올바르지 않습니다.');
      setProcessing(false);
      return;
    }

    setOrderId(orderIdParam);
    if (amountParam) {
      setAmount(parseInt(amountParam));
    }

    // 카카오페이 결제 승인 처리
    const processPayment = async () => {
      try {
        const result = await PaymentService.confirmKakaoPay(pgToken, orderIdParam);
        
        if (result.success) {
          setSuccess(true);
          // 3초 후 포인트 관리 페이지로 이동
          setTimeout(() => {
            navigate('/seller/points', { 
              state: { 
                success: true, 
                message: `${amount.toLocaleString()}포인트가 성공적으로 충전되었습니다.` 
              } 
            });
          }, 3000);
        } else {
          setError(result.error || '결제 승인에 실패했습니다.');
        }
      } catch (error) {
        console.error('카카오페이 결제 처리 실패:', error);
        setError('결제 처리 중 오류가 발생했습니다.');
      } finally {
        setProcessing(false);
      }
    };

    processPayment();
  }, [searchParams, navigate, amount]);

  const handleGoToPoints = () => {
    navigate('/seller/points');
  };

  const handleGoToDashboard = () => {
    navigate('/seller/dashboard');
  };

  if (processing) {
    return (
      <Container maxWidth="sm">
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="60vh"
          gap={3}
        >
          <CircularProgress size={60} />
          <Typography variant="h6" color="textSecondary">
            결제를 처리하고 있습니다...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="60vh"
        gap={3}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
          {success ? (
            <>
              <CheckCircle color="success" sx={{ fontSize: 80, mb: 2 }} />
              <Typography variant="h4" color="success.main" gutterBottom>
                결제 완료!
              </Typography>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                주문번호: {orderId}
              </Typography>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                충전 금액: {amount.toLocaleString()}원
              </Typography>
              <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                포인트가 성공적으로 충전되었습니다.
              </Typography>
              <Box display="flex" gap={2} justifyContent="center">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleGoToPoints}
                >
                  포인트 관리
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleGoToDashboard}
                >
                  대시보드
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Error color="error" sx={{ fontSize: 80, mb: 2 }} />
              <Typography variant="h4" color="error.main" gutterBottom>
                결제 실패
              </Typography>
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
              <Box display="flex" gap={2} justifyContent="center">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleGoToPoints}
                >
                  포인트 관리
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleGoToDashboard}
                >
                  대시보드
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default KakaoPayComplete;
