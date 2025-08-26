import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Card,
  CardContent,
  CircularProgress,
  Paper
} from '@mui/material';
import { 
  Email, 
  ArrowBack,
  CheckCircle,
  Error
} from '@mui/icons-material';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase/config';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('이메일 주소를 입력해주세요.');
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('올바른 이메일 주소를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Firebase Auth 비밀번호 재설정 이메일 전송
      const actionCodeSettings = {
        url: process.env.NODE_ENV === 'development' 
          ? 'http://localhost:3000/login'
          : 'https://curtain-install.firebaseapp.com/login',
        handleCodeInApp: false,
        iOS: {
          bundleId: 'com.curtaininstall.app'
        },
        android: {
          packageName: 'com.curtaininstall.app',
          installApp: true,
          minimumVersion: '12'
        },
        dynamicLinkDomain: 'curtain-install.page.link'
      };
      
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      
      setSuccess(true);
      console.log('비밀번호 재설정 이메일 전송 성공');
      
    } catch (error: any) {
      console.error('비밀번호 재설정 이메일 전송 실패:', error);
      
      // Firebase 오류 메시지 한글화
      let errorMessage = '비밀번호 재설정 이메일 전송에 실패했습니다.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = '해당 이메일로 등록된 계정을 찾을 수 없습니다.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '올바른 이메일 주소를 입력해주세요.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = '네트워크 연결을 확인해주세요.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = '비밀번호 재설정 기능이 비활성화되어 있습니다. 관리자에게 문의해주세요.';
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = '일일 이메일 전송 한도를 초과했습니다. 내일 다시 시도해주세요.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (success) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Card sx={{ width: '100%', maxWidth: 400 }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              
              <Typography component="h1" variant="h5" gutterBottom>
                이메일 전송 완료
              </Typography>
              
              <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                <strong>{email}</strong>로 비밀번호 재설정 링크를 전송했습니다.
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
                <Typography variant="body2">
                  <strong>다음 단계:</strong><br />
                  1. 이메일을 확인해주세요<br />
                  2. "비밀번호 재설정" 버튼을 클릭하세요<br />
                  3. 새로운 비밀번호를 입력하세요<br />
                  4. "비밀번호 변경" 버튼을 클릭하세요<br />
                  5. 새 비밀번호로 로그인하세요
                </Typography>
              </Alert>
              
              <Alert severity="warning" sx={{ mb: 3, textAlign: 'left' }}>
                <Typography variant="body2">
                  <strong>주의사항:</strong><br />
                  • 비밀번호 재설정 링크는 1시간 후 만료됩니다<br />
                  • 링크는 한 번만 사용할 수 있습니다<br />
                  • 보안을 위해 비밀번호 변경 후 이전 세션은 자동으로 종료됩니다
                </Typography>
              </Alert>
              
              <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 3 }}>
                이메일이 보이지 않는다면 스팸함을 확인해주세요.
              </Typography>
              
              <Button
                fullWidth
                variant="contained"
                onClick={handleBackToLogin}
                sx={{ mb: 2 }}
              >
                로그인 페이지로 돌아가기
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                }}
              >
                다른 이메일로 다시 시도
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 400 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Button
                startIcon={<ArrowBack />}
                onClick={handleBackToLogin}
                sx={{ mr: 2 }}
              >
                돌아가기
              </Button>
              <Typography component="h1" variant="h5" align="center" sx={{ flex: 1 }}>
                비밀번호 찾기
              </Typography>
            </Box>
            
            <Typography variant="body1" color="textSecondary" align="center" sx={{ mb: 3 }}>
              가입한 이메일 주소를 입력하시면<br />
              <strong>비밀번호 재설정 링크</strong>를 보내드립니다.
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                이메일로 전송되는 링크를 통해 안전하게 비밀번호를 재설정할 수 있습니다.
              </Typography>
            </Alert>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="이메일 주소"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <Email />}
                disabled={loading || !email}
                sx={{ mb: 2 }}
              >
                {loading ? '이메일 전송 중...' : '비밀번호 재설정 이메일 보내기'}
              </Button>
              
              <Box textAlign="center">
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <Typography variant="body2" color="primary">
                    로그인 페이지로 돌아가기
                  </Typography>
                </Link>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default ForgotPasswordPage;
