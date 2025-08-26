import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Card,
  CardContent,
  Grid,
  Divider,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Fingerprint, 
  Visibility, 
  VisibilityOff,
  AutoAwesome
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { BiometricService } from '../services/biometricService';
import InstallPWA from './InstallPWA';
import AdvertisementBanner from './AdvertisementBanner';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 자동 로그인 및 생체인증 관련 상태
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  
  const { 
    login, 
    loginWithBiometric,
    user, 
    autoLoginLoading,
    enableBiometric,
    isBiometricEnabled,
    isBiometricAvailable,
    getAutoLoginInfo
  } = useAuth();
  const navigate = useNavigate();

  // 생체인증 상태 확인
  useEffect(() => {
    const checkBiometricStatus = async () => {
      const available = await isBiometricAvailable();
      const enabled = isBiometricEnabled();
      setBiometricAvailable(available);
      setBiometricEnabled(enabled);
    };

    checkBiometricStatus();
  }, [isBiometricAvailable, isBiometricEnabled]);

  // 저장된 로그인 정보 불러오기
  useEffect(() => {
    const savedInfo = getAutoLoginInfo();
    if (savedInfo) {
      setEmail(savedInfo.email);
      setPassword(savedInfo.password);
      setRememberMe(savedInfo.rememberMe);
    }
  }, [getAutoLoginInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const userData = await login(email, password, rememberMe);
      
      console.log('로그인 성공:', userData);
      
      // 로그인 성공 후 사용자 역할에 따라 리다이렉트
      const roleRoutes: { [key: string]: string } = {
        admin: '/admin',
        seller: '/seller',
        contractor: '/contractor',
        customer: '/login'
      };
      
      const targetRoute = roleRoutes[userData.role] || '/login';
      console.log(`사용자 역할: ${userData.role}, 이동할 경로: ${targetRoute}`);
      navigate(targetRoute);
      
    } catch (error) {
      console.error('로그인 실패:', error);
      setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 생체인증 로그인 처리
  const handleBiometricLogin = async () => {
    try {
      setError('');
      setBiometricLoading(true);
      const userData = await loginWithBiometric();
      
      console.log('생체인증 로그인 성공:', userData);
      
      // 로그인 성공 후 사용자 역할에 따라 리다이렉트
      const roleRoutes: { [key: string]: string } = {
        admin: '/admin',
        seller: '/seller',
        contractor: '/contractor',
        customer: '/login'
      };
      
      const targetRoute = roleRoutes[userData.role] || '/login';
      console.log(`사용자 역할: ${userData.role}, 이동할 경로: ${targetRoute}`);
      navigate(targetRoute);
      
    } catch (error) {
      console.error('생체인증 로그인 실패:', error);
      setError('모바일 생체인증 로그인에 실패했습니다. 지문이나 얼굴인식을 다시 시도해주세요.');
    } finally {
      setBiometricLoading(false);
    }
  };

  // 생체인증 활성화
  const handleEnableBiometric = async () => {
    if (!email || !password) {
      setError('이메일과 비밀번호를 먼저 입력해주세요.');
      return;
    }

    try {
      setError('');
      const success = await enableBiometric(email, password);
      if (success) {
        setBiometricEnabled(true);
        setError(''); // 성공 메시지 대신 에러 메시지 초기화
      } else {
        setError('모바일 생체인증 활성화에 실패했습니다. 지문이나 얼굴인식이 설정되어 있는지 확인해주세요.');
      }
    } catch (error) {
      console.error('생체인증 활성화 실패:', error);
      setError('모바일 생체인증 활성화에 실패했습니다. 지문이나 얼굴인식이 설정되어 있는지 확인해주세요.');
    }
  };



     

  return (
    <>
      <InstallPWA />
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
              <Typography component="h1" variant="h4" align="center" gutterBottom>
                전문가의 손길
              </Typography>
            
            <Typography variant="h6" align="center" color="textSecondary" gutterBottom>
              로그인
            </Typography>

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
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="비밀번호"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  )
                }}
              />
              
              {/* 자동 로그인 및 생체인증 옵션 */}
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="로그인 정보 저장"
                />
                
                {biometricAvailable && (
                  <Tooltip title={
                    biometricEnabled 
                      ? "모바일 생체인증 활성화됨 (지문/얼굴인식)" 
                      : "모바일 생체인증 활성화 (지문/얼굴인식)"
                  }>
                    <span>
                      <IconButton
                        onClick={handleEnableBiometric}
                        color={biometricEnabled ? "primary" : "default"}
                        disabled={!email || !password}
                      >
                        <Fingerprint />
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
              </Box>

              {/* 생체인증 로그인 버튼 */}
              {biometricAvailable && biometricEnabled && (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Fingerprint />}
                  onClick={handleBiometricLogin}
                  disabled={biometricLoading}
                  sx={{ mt: 2, mb: 2 }}
                >
                  {biometricLoading ? (
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                  ) : null}
                  모바일 생체인증으로 로그인
                </Button>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 2, mb: 2 }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    로그인 중...
                  </>
                ) : (
                  '로그인'
                )}
              </Button>

              {/* 자동 로그인 상태 표시 */}
              {autoLoginLoading && (
                <Box textAlign="center" sx={{ mt: 2 }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  <Typography variant="body2" color="textSecondary">
                    자동 로그인 중...
                  </Typography>
                </Box>
              )}
              
                             <Box textAlign="center" sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                 <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
                   <Typography variant="body2" color="primary">
                     비밀번호를 잊으셨나요?
                   </Typography>
                 </Link>
                 <Link to="/register" style={{ textDecoration: 'none' }}>
                   <Typography variant="body2" color="primary">
                     계정이 없으신가요? 회원가입
                   </Typography>
                 </Link>
               </Box>
            </Box>

            {/* 생체인증 상태 정보 */}
            {biometricAvailable && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="body2" color="info.contrastText" align="center">
                  <AutoAwesome sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                  모바일 생체인증 (지문/얼굴인식) 사용 가능
                  {biometricEnabled && ' (활성화됨)'}
                </Typography>
                <Typography variant="caption" color="info.contrastText" align="center" display="block" sx={{ mt: 0.5 }}>
                  터치 ID, Face ID, 지문 인식 등을 사용하여 빠르게 로그인할 수 있습니다
                </Typography>
              </Box>
            )}

                         <Divider sx={{ my: 3 }} />
             
             {/* 광고 섹션 */}
             <Box sx={{ 
               p: 2, 
               bgcolor: 'grey.50', 
               borderRadius: 2, 
               border: '1px solid grey.300',
               textAlign: 'center'
             }}>
               <Typography variant="h6" color="textSecondary" gutterBottom>
                 추천 서비스
               </Typography>
               <AdvertisementBanner 
                 position="login" 
                 maxCount={1} 
                 height={150}
                 showTitle={true}
               />
             </Box>
                         <Divider sx={{ my: 3 }} />
             
             <Typography variant="h6" align="center" color="textSecondary" gutterBottom>
               자동 업데이트 안내
             </Typography>
             
             <Alert severity="info" sx={{ mb: 2 }}>
               <Typography variant="body2">
                 <strong>자동 업데이트 기능이 활성화되었습니다!</strong><br />
                 • 앱이 업데이트되면 자동으로 새로고침됩니다<br />
                 • 수동으로 캐시를 클리어할 필요가 없습니다<br />
                 • 업데이트 알림이 화면 상단에 표시됩니다
               </Typography>
             </Alert>

            
          </CardContent>
        </Card>
      </Box>
    </Container>
    </>
  );
};

export default LoginPage;
