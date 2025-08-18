import React, { useState } from 'react';
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
  Divider
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { AuthService } from '../services/authService';
import { KakaoAuthService } from '../services/kakaoAuthService';
import { UserRole } from '../../types';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [creatingTestAccount, setCreatingTestAccount] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);
  
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const userData = await login(email, password);
      
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

  const handleKakaoLogin = () => {
    try {
      setError('');
      KakaoAuthService.initiateKakaoLogin();
    } catch (error) {
      console.error('카카오 로그인 시작 실패:', error);
      setError('카카오 로그인을 시작할 수 없습니다.');
    }
  };

  const createTestAccount = async (role: 'admin' | 'seller' | 'contractor') => {
    try {
      setCreatingTestAccount(true);
      setError('');
      
      const testAccounts = {
        admin: { email: 'admin@test.com', password: 'admin123', name: '관리자' },
        seller: { email: 'seller@test.com', password: 'seller123', name: '판매자' },
        contractor: { email: 'contractor@test.com', password: 'contractor123', name: '시공자' }
      };
      
      const account = testAccounts[role];
      
             try {
         // 먼저 로그인 시도 (계정이 이미 존재하는 경우)
         const userData = await login(account.email, account.password);
         
         // 로그인 성공 후 역할 설정
         await AuthService.setTestAccountRole(account.email, role);
         
         // 역할 설정 후 다시 로그인하여 업데이트된 사용자 정보 가져오기
         const updatedUserData = await login(account.email, account.password);
         console.log('역할 설정 후 다시 로그인:', updatedUserData);
         
         // 역할에 따라 리다이렉트
         const roleRoutes: { [key: string]: string } = {
           admin: '/admin',
           seller: '/seller',
           contractor: '/contractor',
           customer: '/login'
         };
         
         const targetRoute = roleRoutes[role] || '/login';
         console.log(`판매자 로그인 성공, ${targetRoute}로 이동합니다.`);
         navigate(targetRoute);
        
      } catch (loginError: any) {
        // 로그인 실패 시 회원가입 시도
        if (loginError.message.includes('사용자 계정이 없습니다') || 
            loginError.message.includes('잘못된 비밀번호')) {
          
          // 회원가입
          const userData = await AuthService.register(
            account.email,
            account.password,
            account.name,
            '010-1234-5678',
            role
          );
          
          // 자동 로그인
          await login(account.email, account.password);
          
          // 역할에 따라 리다이렉트
          const roleRoutes: { [key: string]: string } = {
            admin: '/admin',
            seller: '/seller',
            contractor: '/contractor',
            customer: '/login'
          };
          
          const targetRoute = roleRoutes[role] || '/login';
          console.log(`판매자 회원가입 후 로그인 성공, ${targetRoute}로 이동합니다.`);
          navigate(targetRoute);
        } else {
          throw loginError;
        }
      }
      
    } catch (error: any) {
      setError(`테스트 계정 생성 실패: ${error.message}`);
         } finally {
       setCreatingTestAccount(false);
     }
   };

   // 현재 사용자 역할 변경 (디버깅용)
   const updateCurrentUserRole = async (role: UserRole) => {
     try {
       setUpdatingRole(true);
       setError('');
       
       await AuthService.updateCurrentUserRole(role);
       
       // 역할 변경 후 다시 로그인하여 업데이트된 정보 가져오기
       if (user) {
         const updatedUserData = await login(user.email, 'seller123'); // 임시로 비밀번호 사용
         console.log('역할 변경 후 다시 로그인:', updatedUserData);
         
         // 역할에 따라 리다이렉트
         const roleRoutes: { [key: string]: string } = {
           admin: '/admin',
           seller: '/seller',
           contractor: '/contractor',
           customer: '/login'
         };
         
         const targetRoute = roleRoutes[role] || '/login';
         console.log(`역할 변경 완료, ${targetRoute}로 이동합니다.`);
         navigate(targetRoute);
       }
       
     } catch (error: any) {
       setError(`역할 변경 실패: ${error.message}`);
     } finally {
       setUpdatingRole(false);
     }
   };

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
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? '로그인 중...' : '로그인'}
              </Button>

              <Button
                fullWidth
                variant="outlined"
                sx={{ 
                  mt: 1, 
                  mb: 2,
                  backgroundColor: '#FEE500',
                  color: '#000000',
                  borderColor: '#FEE500',
                  '&:hover': {
                    backgroundColor: '#FDD835',
                    borderColor: '#FDD835'
                  }
                }}
                onClick={handleKakaoLogin}
                disabled={loading}
              >
                카카오톡으로 로그인
              </Button>
              
              <Box textAlign="center">
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <Typography variant="body2" color="primary">
                    계정이 없으신가요? 회원가입
                  </Typography>
                </Link>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" align="center" color="textSecondary" gutterBottom>
              테스트 계정
            </Typography>
            
            <Typography variant="body2" align="center" color="textSecondary" sx={{ mb: 2 }}>
              아래 버튼을 클릭하여 테스트 계정을 생성하고 자동 로그인할 수 있습니다.
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  onClick={() => createTestAccount('admin')}
                  disabled={creatingTestAccount}
                >
                  관리자
                </Button>
              </Grid>
              <Grid item xs={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  onClick={() => createTestAccount('seller')}
                  disabled={creatingTestAccount}
                >
                  판매자
                </Button>
              </Grid>
              <Grid item xs={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  onClick={() => createTestAccount('contractor')}
                  disabled={creatingTestAccount}
                >
                  시공자
                </Button>
              </Grid>
            </Grid>

                         {creatingTestAccount && (
               <Box textAlign="center" sx={{ mt: 2 }}>
                 <Typography variant="body2" color="textSecondary">
                   테스트 계정 생성 중...
                 </Typography>
               </Box>
             )}

             {/* 현재 사용자 역할 변경 (디버깅용) */}
             {user && (
               <>
                 <Divider sx={{ my: 3 }} />
                 
                 <Typography variant="h6" align="center" color="textSecondary" gutterBottom>
                   현재 사용자 역할 변경
                 </Typography>
                 
                 <Typography variant="body2" align="center" color="textSecondary" sx={{ mb: 2 }}>
                   현재 로그인된 사용자: {user.email} (역할: {user.role})
                 </Typography>

                 <Grid container spacing={2}>
                   <Grid item xs={4}>
                     <Button
                       fullWidth
                       variant="outlined"
                       size="small"
                       onClick={() => updateCurrentUserRole('admin')}
                       disabled={updatingRole}
                     >
                       관리자로 변경
                     </Button>
                   </Grid>
                   <Grid item xs={4}>
                     <Button
                       fullWidth
                       variant="outlined"
                       size="small"
                       onClick={() => updateCurrentUserRole('seller')}
                       disabled={updatingRole}
                     >
                       판매자로 변경
                     </Button>
                   </Grid>
                   <Grid item xs={4}>
                     <Button
                       fullWidth
                       variant="outlined"
                       size="small"
                       onClick={() => updateCurrentUserRole('contractor')}
                       disabled={updatingRole}
                     >
                       시공자로 변경
                     </Button>
                   </Grid>
                 </Grid>

                 {updatingRole && (
                   <Box textAlign="center" sx={{ mt: 2 }}>
                     <Typography variant="body2" color="textSecondary">
                       역할 변경 중...
                     </Typography>
                   </Box>
                 )}
               </>
             )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default LoginPage;
