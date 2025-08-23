import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuth } from '../../shared/contexts/AuthContext';
import ContractorLayout from './components/ContractorLayout';
import Dashboard from './pages/Dashboard';
import JobList from './pages/JobList';
import MyJobs from './pages/MyJobs';
import JobDetail from './pages/JobDetail';
import Chat from './pages/Chat';
import SellerChat from './pages/SellerChat';
import PointManagement from './pages/PointManagement';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import UserGuidanceDialog from '../../shared/components/UserGuidanceDialog';

const ContractorApp: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [showGuidanceDialog, setShowGuidanceDialog] = useState(false);

  // 안내사항 확인 필요 여부 체크
  useEffect(() => {
    if (user && user.approvalStatus === 'approved') {
      // 안내사항을 확인하지 않았거나 버전이 업데이트된 경우
      const needsGuidance = !user.guidanceConfirmed?.contractorGuidanceVersion || 
                           user.guidanceConfirmed.contractorGuidanceVersion < 1;
      
      if (needsGuidance) {
        setShowGuidanceDialog(true);
      }
    }
  }, [user]);

  // 승인 상태에 따른 접근 권한 확인
  const canAccessFeature = (featurePath: string) => {
    if (featurePath === '/profile' || featurePath === '/seller-chat') {
      // 프로필과 판매자와 채팅은 모든 승인 상태에서 접근 가능
      return true;
    }
    
    // 다른 기능들은 승인된 상태에서만 접근 가능
    return user?.approvalStatus === 'approved';
  };

  // 현재 경로에 따라 적절한 컴포넌트 렌더링
  const renderContent = () => {
    console.log('🔍 ContractorApp - 렌더링 결정:', location.pathname);
    
    // 프로필 페이지
    if (location.pathname === '/contractor/profile') {
      console.log('🔍 ContractorApp - 프로필 페이지 렌더링');
      return <Profile />;
    }
    
    // 다른 페이지들 - 승인 상태 확인
    if (location.pathname === '/contractor' || location.pathname === '/contractor/') {
      return canAccessFeature('/') ? <Dashboard /> : <Profile />;
    }
    if (location.pathname === '/contractor/jobs') {
      return canAccessFeature('/jobs') ? <JobList /> : <Profile />;
    }
    if (location.pathname.startsWith('/contractor/jobs/') && location.pathname !== '/contractor/jobs') {
      return canAccessFeature('/jobs') ? <JobDetail /> : <Profile />;
    }
    if (location.pathname === '/contractor/my-jobs') {
      return canAccessFeature('/my-jobs') ? <MyJobs /> : <Profile />;
    }
    if (location.pathname === '/contractor/chat') {
      return canAccessFeature('/chat') ? <Chat /> : <Profile />;
    }
    if (location.pathname === '/contractor/seller-chat') {
      return canAccessFeature('/seller-chat') ? <SellerChat /> : <Profile />;
    }
    if (location.pathname.startsWith('/contractor/chat/')) {
      return canAccessFeature('/chat') ? <Chat /> : <Profile />;
    }
    if (location.pathname === '/contractor/points') {
      return canAccessFeature('/points') ? <PointManagement /> : <Profile />;
    }
    if (location.pathname === '/contractor/notifications') {
      return canAccessFeature('/notifications') ? <Notifications /> : <Profile />;
    }
    
    // 기본값 - 대시보드 또는 프로필
    console.log('🔍 ContractorApp - 기본 페이지 렌더링 (대시보드 또는 프로필)');
    return canAccessFeature('/') ? <Dashboard /> : <Profile />;
  };

  const handleGuidanceConfirm = () => {
    setShowGuidanceDialog(false);
  };

  const handleGuidanceClose = () => {
    setShowGuidanceDialog(false);
  };

  return (
    <>
      <ContractorLayout>
        <Box sx={{ flexGrow: 1, p: 3 }}>
          {renderContent()}
        </Box>
      </ContractorLayout>
      
      <UserGuidanceDialog
        open={showGuidanceDialog}
        userRole="contractor"
        userId={user?.id || ''}
        onConfirm={handleGuidanceConfirm}
        onClose={handleGuidanceClose}
      />
    </>
  );
};

export default ContractorApp;
