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
import NoticeBoard from '../../shared/components/NoticeBoard';
import AdminChat from '../../shared/components/AdminChat';
import SuggestionBoard from '../../shared/components/SuggestionBoard';

const ContractorApp: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [showGuidanceDialog, setShowGuidanceDialog] = useState(false);

  // 안내사항 확인 필요 여부 체크 (하루에 한번)
  useEffect(() => {
    if (user && user.approvalStatus === 'approved') {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // 오늘 자정으로 설정
      
      const lastVisit = user.guidanceConfirmed?.lastDailyVisit 
        ? new Date(user.guidanceConfirmed.lastDailyVisit)
        : null;
      
      const lastVisitDate = lastVisit ? new Date(lastVisit.setHours(0, 0, 0, 0)) : null;
      
      // 오늘 방문하지 않았거나 안내사항을 확인하지 않은 경우
      const needsGuidance = !lastVisitDate || lastVisitDate < today;
      
      if (needsGuidance) {
        setShowGuidanceDialog(true);
      }
    }
  }, [user]);

  // 승인 상태에 따른 접근 권한 확인
  const canAccessFeature = (featurePath: string) => {
    if (featurePath === '/profile' || featurePath === '/seller-chat' || featurePath === '/notices') {
      // 프로필, 판매자와 채팅, 공지사항은 모든 승인 상태에서 접근 가능
      return true;
    }
    
    // 다른 기능들은 승인된 상태에서만 접근 가능
    return user?.approvalStatus === 'approved';
  };

  // 현재 경로에 따라 적절한 컴포넌트 렌더링
  const renderContent = () => {
    console.log('🔍 ContractorApp - 렌더링 결정:', location.pathname);
    console.log('🔍 ContractorApp - 사용자 승인 상태:', user?.approvalStatus);
    console.log('🔍 ContractorApp - 사용자 역할:', user?.role);
    
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
      console.log('🔍 ContractorApp - 작업 상세 페이지 렌더링:', location.pathname);
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
      console.log('🔍 ContractorApp - 채팅 페이지 렌더링:', location.pathname);
      return canAccessFeature('/chat') ? <Chat /> : <Profile />;
    }
    if (location.pathname === '/contractor/points') {
      return canAccessFeature('/points') ? <PointManagement /> : <Profile />;
    }
    if (location.pathname === '/contractor/notifications') {
      return canAccessFeature('/notifications') ? <Notifications /> : <Profile />;
    }
    
    // 게시판 페이지들
    if (location.pathname === '/contractor/notices') {
      return <NoticeBoard />; // 공지사항은 모든 상태에서 접근 가능
    }
    if (location.pathname === '/contractor/admin-chat') {
      console.log('🔍 ContractorApp - 관리자와 채팅 페이지 렌더링');
      return canAccessFeature('/admin-chat') ? <AdminChat /> : <Profile />;
    }
    if (location.pathname === '/contractor/suggestions') {
      console.log('🔍 ContractorApp - 건의하기 페이지 렌더링');
      return canAccessFeature('/suggestions') ? <SuggestionBoard /> : <Profile />;
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
