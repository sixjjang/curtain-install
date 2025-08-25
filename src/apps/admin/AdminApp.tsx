import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import AdminLayout from './components/AdminLayout';
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
import AdvertisementManagement from './pages/AdvertisementManagement';
import NoticeManagement from './pages/NoticeManagement';
import NoticeBoard from '../../shared/components/NoticeBoard';
import AdminChat from '../../shared/components/AdminChat';
import SuggestionBoard from '../../shared/components/SuggestionBoard';

const AdminApp: React.FC = () => {
  return (
    <AdminLayout>
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
