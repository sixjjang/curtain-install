import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import { KakaoAuthService } from '../services/kakaoAuthService';
import { useAuth } from '../contexts/AuthContext';

const KakaoCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    const handleKakaoCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          setError('카카오 로그인이 취소되었습니다.');
          setLoading(false);
          return;
        }

        if (!code) {
          setError('인증 코드를 받을 수 없습니다.');
          setLoading(false);
          return;
        }

        // 카카오 로그인 처리
        const userData = await KakaoAuthService.handleKakaoLogin(code);
        
        // 로그인 성공 - 사용자 역할에 따라 리다이렉트
        const roleRoutes: { [key: string]: string } = {
          admin: '/admin',
          seller: '/seller',
          contractor: '/contractor',
          customer: '/login'
        };
        
        const targetRoute = roleRoutes[userData.role] || '/login';
        navigate(targetRoute);

      } catch (error: any) {
        console.error('카카오 로그인 처리 실패:', error);
        
        if (error.message === 'KAKAO_NEW_USER') {
          // 새 사용자 - 회원가입 페이지로 이동
          setIsNewUser(true);
          setError('추가 정보 입력이 필요합니다. 회원가입 페이지로 이동합니다.');
          setTimeout(() => {
            navigate('/register?from=kakao');
          }, 2000);
        } else {
          setError('카카오 로그인에 실패했습니다. 다시 시도해주세요.');
        }
        setLoading(false);
      }
    };

    handleKakaoCallback();
  }, [searchParams, navigate, login]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Card sx={{ maxWidth: 400, width: '100%' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              카카오 로그인 처리 중...
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Card sx={{ maxWidth: 400, width: '100%' }}>
          <CardContent>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Button
              variant="contained"
              onClick={() => navigate('/login')}
              fullWidth
            >
              로그인 페이지로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return null;
};

export default KakaoCallback;
