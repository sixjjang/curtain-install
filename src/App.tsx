import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './shared/contexts/AuthContext';
import { testFirebaseConnection } from './firebase/config';

// 앱 컴포넌트들
import SellerApp from './apps/seller/SellerApp';
import ContractorApp from './apps/contractor/ContractorApp';
import AdminApp from './apps/admin/AdminApp';

import CustomerChat from './apps/customer/CustomerChat';
import SimpleSatisfactionSurvey from './apps/customer/SimpleSatisfactionSurvey';
import SatisfactionSurvey from './apps/customer/SatisfactionSurvey';


// 공통 컴포넌트들
import LoginPage from './shared/components/LoginPage';
import RegisterPage from './shared/components/RegisterPage';
import ProtectedRoute from './shared/components/ProtectedRoute';
import InstallPWA from './shared/components/InstallPWA';
import FirebaseTest from './shared/components/FirebaseTest';
import TestAccounts from './shared/components/TestAccounts';
import StorageTest from './shared/components/StorageTest';
import FirebaseStorageGuide from './shared/components/FirebaseStorageGuide';


// 테마 설정
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Noto Sans KR", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  // Firebase 연결 테스트
  useEffect(() => {
    const testConnection = async () => {
      try {
        const result = await testFirebaseConnection();
        console.log('🔥 Firebase 연결 테스트 결과:', result);
      } catch (error) {
        console.error('🔥 Firebase 연결 테스트 실패:', error);
      }
    };
    
    testConnection();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* 루트 경로 - 역할 선택 페이지로 리다이렉트 */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* 인증 페이지들 */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* 판매자 앱 */}
            <Route path="/seller/*" element={
              <ProtectedRoute allowedRoles={['seller']}>
                <SellerApp />
              </ProtectedRoute>
            } />
            
            {/* 시공자 앱 */}
            <Route path="/contractor/*" element={
              <ProtectedRoute allowedRoles={['contractor']}>
                <ContractorApp />
              </ProtectedRoute>
            } />
            
            {/* 관리자 앱 */}
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminApp />
              </ProtectedRoute>
            } />
            
            {/* 고객 설문 - 인증 불필요 */}
            <Route path="/survey/:surveyId" element={<SimpleSatisfactionSurvey />} />
            
            {/* 고객 만족도 평가 - 인증 불필요 */}
            <Route path="/satisfaction-survey/:jobId" element={<SatisfactionSurvey />} />
            
            {/* 고객 채팅 - 인증 불필요 */}
            <Route path="/chat/:jobId" element={<CustomerChat />} />
            
            {/* 카카오 로그인 콜백 */}
  
            

            
            {/* Firebase 테스트 페이지 */}
            <Route path="/test" element={<FirebaseTest />} />
            
            {/* 테스트 계정 관리 페이지 */}
            <Route path="/test-accounts" element={<TestAccounts />} />
            
            {/* Storage 테스트 페이지 */}
            <Route path="/storage-test" element={<StorageTest />} />
            
            {/* Storage 설정 가이드 페이지 */}
            <Route path="/storage-guide" element={<FirebaseStorageGuide />} />
            
            {/* 카카오톡 비즈니스 테스트 페이지 */}
  
            
            {/* 404 페이지 */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          
          {/* PWA 설치 안내 컴포넌트 */}
          <InstallPWA />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
