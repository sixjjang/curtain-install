import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import { CheckCircle, Error } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { GoogleCalendarService } from '../services/googleCalendarService';

const GoogleCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          setError('구글 캘린더 연동에 실패했습니다.');
          setLoading(false);
          return;
        }

        if (!code) {
          setError('인증 코드를 받지 못했습니다.');
          setLoading(false);
          return;
        }

        if (!user?.id) {
          setError('로그인이 필요합니다.');
          setLoading(false);
          return;
        }

        // 인증 코드로 액세스 토큰 교환
        const tokens = await GoogleCalendarService.exchangeCodeForTokens(code);
        
        // 연동 정보 저장
        await GoogleCalendarService.saveConnection(
          user.id,
          user.role as 'contractor' | 'seller',
          tokens.access_token,
          tokens.refresh_token,
          tokens.expires_in
        );

        setSuccess(true);
        setLoading(false);

        // 3초 후 이전 페이지로 이동
        setTimeout(() => {
          navigate(-1);
        }, 3000);

      } catch (error) {
        console.error('구글 캘린더 연동 실패:', error);
        setError('구글 캘린더 연동에 실패했습니다.');
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, user, navigate]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Card sx={{ maxWidth: 400, textAlign: 'center' }}>
          <CardContent>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              구글 캘린더 연동 중...
            </Typography>
            <Typography variant="body2" color="textSecondary">
              잠시만 기다려주세요.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Card sx={{ maxWidth: 400, textAlign: 'center' }}>
          <CardContent>
            <Error sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom color="error">
              연동 실패
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              {error}
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate(-1)}
              sx={{ mt: 2 }}
            >
              돌아가기
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (success) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Card sx={{ maxWidth: 400, textAlign: 'center' }}>
          <CardContent>
            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom color="success.main">
              연동 완료!
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              구글 캘린더와 성공적으로 연동되었습니다.
            </Typography>
            <Typography variant="body2" color="textSecondary">
              3초 후 이전 페이지로 이동합니다...
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return null;
};

export default GoogleCallback;
