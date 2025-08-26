import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import AdminLayout from './components/AdminLayout';
import { AdminNotificationService, AdminNotificationData } from '../../shared/services/adminNotificationService';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import JobManagement from './pages/JobManagement';
import PointManagement from './pages/PointManagement';
import PricingManagement from './pages/PricingManagement';
import LevelManagement from './pages/LevelManagement';
import SatisfactionSurveyManagement from './pages/SatisfactionSurveyManagement';
import TemplateManagement from './pages/TemplateManagement';
import Analytics from './pages/Analytics';
import SystemSettings from './pages/SystemSettings';
import PointWithdrawalManagement from './pages/PointWithdrawalManagement';
import ManualChargeManagement from './pages/ManualChargeManagement';
import AdvertisementManagement from './pages/AdvertisementManagement';
import NoticeManagement from './pages/NoticeManagement';
import NoticeBoard from '../../shared/components/NoticeBoard';
import AdminChat from '../../shared/components/AdminChat';
import SuggestionBoard from '../../shared/components/SuggestionBoard';

const AdminApp: React.FC = () => {
  const [notifications, setNotifications] = useState<AdminNotificationData>({
    manualChargeRequests: 0,
    pointWithdrawals: 0,
    totalNewRequests: 0
  });

  // 알림 데이터 로드
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await AdminNotificationService.getNewRequestsCount();
        setNotifications(data);
      } catch (error) {
        console.error('알림 데이터 로드 실패:', error);
      }
    };

    loadNotifications();
    
    // 주기적으로 알림 확인 (1분마다)
    const interval = setInterval(loadNotifications, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <AdminLayout notifications={notifications}>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/jobs" element={<JobManagement />} />
          <Route path="/points" element={<PointManagement />} />
          <Route path="/pricing" element={<PricingManagement />} />
          <Route path="/levels" element={<LevelManagement />} />
          <Route path="/surveys" element={<SatisfactionSurveyManagement />} />
          <Route path="/templates" element={<TemplateManagement />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<SystemSettings />} />
          <Route path="/point-withdrawals" element={<PointWithdrawalManagement />} />
          <Route path="/manual-charges" element={<ManualChargeManagement />} />
          <Route path="/advertisements" element={<AdvertisementManagement />} />
          {/* 게시판 라우트 */}
          <Route path="/notices" element={<NoticeManagement />} />
          <Route path="/admin-chat" element={<AdminChat />} />
          <Route path="/suggestions" element={<SuggestionBoard />} />
        </Routes>
      </Box>
    </AdminLayout>
  );
};

export default AdminApp;
