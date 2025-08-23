import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuth } from '../../shared/contexts/AuthContext';
import SellerLayout from './components/SellerLayout';
import Dashboard from './pages/Dashboard';
import JobManagement from './pages/JobManagement';
import ContractorList from './pages/ContractorList';
import PointCharge from './pages/PointCharge';
import PaymentSimulation from './pages/PaymentSimulation';
import PaymentComplete from './pages/PaymentComplete';
import PaymentFail from './pages/PaymentFail';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import ContractorChat from './pages/ContractorChat';
import Notifications from './pages/Notifications';


const SellerApp: React.FC = () => {
  console.log('🔍 SellerApp - 컴포넌트 시작');
  console.log('🔍 SellerApp - 컴포넌트가 마운트되었습니다!');
  
  const { user } = useAuth();
  const location = useLocation();
  
  console.log('🔍 SellerApp - useAuth 결과:', user);
  console.log('🔍 SellerApp - useLocation 결과:', location);
  
  console.log('🔍 SellerApp - 초기 상태:', {
    user: user?.email,
    location: location.pathname,
    approvalStatus: user?.approvalStatus
  });

  // 승인 상태에 따른 접근 권한 확인
  const canAccessFeature = (featurePath: string) => {
    if (featurePath === '/profile' || featurePath === '/contractor-chat') {
      // 프로필과 시공자와 채팅은 모든 승인 상태에서 접근 가능
      return true;
    }
    
    // 다른 기능들은 승인된 상태에서만 접근 가능
    return user?.approvalStatus === 'approved';
  };

  // 디버깅용: 현재 경로와 사용자 상태 로그
  console.log('🔍 SellerApp - 현재 경로:', location.pathname);
  console.log('🔍 SellerApp - 현재 사용자 상태:', {
    approvalStatus: user?.approvalStatus,
    role: user?.role,
    email: user?.email
  });

  // 현재 경로에 따라 적절한 컴포넌트 렌더링
  const renderContent = () => {
    console.log('🔍 SellerApp - 렌더링 결정:', location.pathname);
    
    // 프로필 페이지
    if (location.pathname === '/seller/profile') {
      console.log('🔍 SellerApp - 프로필 페이지 렌더링');
      console.log('🔍 SellerApp - Profile 컴포넌트 반환');
      return <Profile />;
    }
    
    // 다른 페이지들 - 승인 상태 확인
    if (location.pathname === '/seller' || location.pathname === '/seller/') {
      return canAccessFeature('/') ? <Dashboard /> : <Profile />;
    }
    if (location.pathname === '/seller/jobs') {
      return canAccessFeature('/jobs') ? <JobManagement /> : <Profile />;
    }
    if (location.pathname === '/seller/contractors') {
      return canAccessFeature('/contractors') ? <ContractorList /> : <Profile />;
    }
    if (location.pathname === '/seller/points') {
      return canAccessFeature('/points') ? <PointCharge /> : <Profile />;
    }
    if (location.pathname === '/seller/payment-simulation') {
      return canAccessFeature('/payment-simulation') ? <PaymentSimulation /> : <Profile />;
    }
    if (location.pathname === '/seller/payment-complete') {
      return canAccessFeature('/payment-complete') ? <PaymentComplete /> : <Profile />;
    }
    if (location.pathname === '/seller/payment-fail') {
      return canAccessFeature('/payment-fail') ? <PaymentFail /> : <Profile />;
    }
    if (location.pathname.startsWith('/seller/chat/')) {
      return canAccessFeature('/chat') ? <ContractorChat /> : <Profile />;
    }
    if (location.pathname === '/seller/contractor-chat') {
      return canAccessFeature('/contractor-chat') ? <ContractorChat /> : <Profile />;
    }
    if (location.pathname === '/seller/notifications') {
      return canAccessFeature('/notifications') ? <Notifications /> : <Profile />;
    }
    
    // 기본값 - 대시보드 또는 프로필
    console.log('🔍 SellerApp - 기본 페이지 렌더링 (대시보드 또는 프로필)');
    return canAccessFeature('/') ? <Dashboard /> : <Profile />;
  };

  console.log('🔍 SellerApp - 최종 렌더링 시작');
  
  const content = renderContent();
  console.log('🔍 SellerApp - 렌더링된 컴포넌트:', content?.type?.name || 'Unknown');
  
  console.log('🔍 SellerApp - return 문 실행');
  
  return (
    <SellerLayout>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        {content}
      </Box>
    </SellerLayout>
  );
};

export default SellerApp;
