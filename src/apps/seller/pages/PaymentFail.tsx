import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert
} from '@mui/material';
import { Error, Warning } from '@mui/icons-material';

const PaymentFail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // URL 파라미터에서 오류 정보 확인
    const code = searchParams.get('code');
    const message = searchParams.get('message');
    const orderId = searchParams.get('orderId');

    if (code && message) {
      setErrorMessage(`${message} (오류 코드: ${code})`);
    } else if (message) {
      setErrorMessage(message);
    } else {
      setErrorMessage('결제 처리 중 오류가 발생했습니다.');
    }
  }, [searchParams]);

  const handleRetry = () => {
    navigate('/seller/points');
  };

  const handleGoToDashboard = () => {
    navigate('/seller');
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
      <Card sx={{ maxWidth: 500, width: '100%', mx: 2 }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Error color="error" sx={{ fontSize: 80, mb: 2 }} />
          <Typography variant="h4" gutterBottom color="error.main">
            결제 실패
          </Typography>
          <Typography variant="body1" color="textSecondary" mb={3}>
            결제 처리 중 문제가 발생했습니다.
          </Typography>
          
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body2">
              {errorMessage}
            </Typography>
          </Alert>

          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>확인사항:</strong><br />
              • 결제 수단이 올바른지 확인해주세요<br />
              • 잔액이 충분한지 확인해주세요<br />
              • 네트워크 연결을 확인해주세요
            </Typography>
          </Alert>

          <Box display="flex" gap={2} justifyContent="center">
            <Button
              variant="contained"
              onClick={handleRetry}
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
        </CardContent>
      </Card>
    </Box>
  );
};

export default PaymentFail;
