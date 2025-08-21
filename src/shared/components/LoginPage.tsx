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



     // 디버깅용: 현재 Firebase Auth 상태 확인
   const checkAuthState = async () => {
     try {
       const { auth } = await import('../../firebase/config');
       const currentUser = auth.currentUser;
       console.log('🔍 현재 Firebase Auth 상태:', {
         isLoggedIn: !!currentUser,
         currentUser: currentUser ? {
           uid: currentUser.uid,
           email: currentUser.email,
           displayName: currentUser.displayName
         } : null
       });
     } catch (error) {
       console.error('Auth 상태 확인 실패:', error);
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
       console.log('🆕 테스트 계정 생성 시작:', { role, email: account.email });
       
       // 1단계: Firebase Auth로 직접 로그인 시도
       try {
         const { auth } = await import('../../firebase/config');
         const { signInWithEmailAndPassword } = await import('firebase/auth');
         
         console.log('🔍 Firebase Auth 로그인 시도...');
         const userCredential = await signInWithEmailAndPassword(auth, account.email, account.password);
         const firebaseUser = userCredential.user;
         console.log('✅ Firebase Auth 로그인 성공:', firebaseUser.uid);
         
         // 2단계: Firestore에서 사용자 데이터 확인
         const { doc, getDoc } = await import('firebase/firestore');
         const { db } = await import('../../firebase/config');
         
         console.log('📄 Firestore 사용자 데이터 확인...');
         const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
         
         if (userDoc.exists()) {
           console.log('✅ Firestore 데이터 존재, AuthContext 로그인 시도...');
           // Firestore 데이터가 있으면 AuthContext로 로그인
           const userData = await login(account.email, account.password);
           console.log('✅ AuthContext 로그인 성공:', userData);
           
           // 역할에 따라 리다이렉트
           const roleRoutes: { [key: string]: string } = {
             admin: '/admin',
             seller: '/seller',
             contractor: '/contractor',
             customer: '/login'
           };
           
           const targetRoute = roleRoutes[role] || '/login';
           console.log(`기존 테스트 계정 로그인 성공, ${targetRoute}로 이동합니다.`);
           navigate(targetRoute);
           
         } else {
           console.log('❌ Firestore 데이터 없음, 데이터 생성 시도...');
           // Firestore 데이터가 없으면 생성
           const userData = await AuthService.createUserDataFromAuth(firebaseUser, account.name, role);
           console.log('✅ Firestore 데이터 생성 완료:', userData);
           
           // AuthContext 업데이트
           const loginResult = await login(account.email, account.password);
           console.log('✅ 데이터 생성 후 로그인 성공:', loginResult);
           
           // 역할에 따라 리다이렉트
           const roleRoutes: { [key: string]: string } = {
             admin: '/admin',
             seller: '/seller',
             contractor: '/contractor',
             customer: '/login'
           };
           
           const targetRoute = roleRoutes[role] || '/login';
           console.log(`데이터 생성 완료, ${targetRoute}로 이동합니다.`);
           navigate(targetRoute);
         }
         
       } catch (authError: any) {
         console.log('❌ Firebase Auth 로그인 실패:', authError.message);
         
         // Firebase Auth 로그인 실패 시 새 계정 생성
         console.log('🆕 새 계정 생성 시도...');
         
         try {
           const userData = await AuthService.register(
             account.email,
             account.password,
             account.name,
             '010-1234-5678',
             role
           );
           
           console.log('✅ 회원가입 완료:', userData);
           
           // 자동 로그인
           const loginResult = await login(account.email, account.password);
           console.log('✅ 회원가입 후 로그인 성공:', loginResult);
           
           // 역할에 따라 리다이렉트
           const roleRoutes: { [key: string]: string } = {
             admin: '/admin',
             seller: '/seller',
             contractor: '/contractor',
             customer: '/login'
           };
           
           const targetRoute = roleRoutes[role] || '/login';
           console.log(`새 테스트 계정 생성 및 로그인 성공, ${targetRoute}로 이동합니다.`);
           navigate(targetRoute);
           
         } catch (registerError: any) {
           console.error('❌ 회원가입 실패:', registerError);
           throw new Error(`회원가입 실패: ${registerError.message}`);
         }
       }
       
     } catch (error: any) {
       console.error('테스트 계정 생성 실패:', error);
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
         // 현재 사용자의 이메일로 다시 로그인 시도
         // 비밀번호는 알 수 없으므로 현재 세션을 유지하는 방식으로 변경
         console.log('역할 변경 완료, 현재 세션 유지');
         
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
       console.error('역할 변경 실패:', error);
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
                         {/* 캐시 클리어 버튼 추가 */}
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" align="center" color="textSecondary" gutterBottom>
              문제 해결
            </Typography>
            
            <Button
              fullWidth
              variant="outlined"
              color="warning"
              onClick={() => {
                // 브라우저 캐시와 로컬 스토리지 클리어
                localStorage.clear();
                sessionStorage.clear();
                
                // IndexedDB 클리어 (Firebase 캐시)
                if ('indexedDB' in window) {
                  indexedDB.deleteDatabase('firebaseLocalStorageDb');
                }
                
                // 페이지 새로고침
                window.location.reload();
              }}
              sx={{ mb: 2 }}
            >
              브라우저 캐시 클리어 및 새로고침
            </Button>

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
