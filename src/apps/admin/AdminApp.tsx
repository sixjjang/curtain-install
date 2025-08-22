import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import JobManagement from './pages/JobManagement';
import PricingManagement from './pages/PricingManagement';
import LevelManagement from './pages/LevelManagement';
import SatisfactionSurveyManagement from './pages/SatisfactionSurveyManagement';
import TemplateManagement from './pages/TemplateManagement';
import Analytics from './pages/Analytics';
import SystemSettings from './pages/SystemSettings';

const AdminApp: React.FC = () => {
  return (
    <AdminLayout>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/jobs" element={<JobManagement />} />
          <Route path="/pricing" element={<PricingManagement />} />
          <Route path="/levels" element={<LevelManagement />} />
          <Route path="/surveys" element={<SatisfactionSurveyManagement />} />
          <Route path="/templates" element={<TemplateManagement />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<SystemSettings />} />
        </Routes>
      </Box>
    </AdminLayout>
  );
};

export default AdminApp;
