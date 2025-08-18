import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import ContractorLayout from './components/ContractorLayout';
import Dashboard from './pages/Dashboard';
import JobList from './pages/JobList';
import MyJobs from './pages/MyJobs';
import CalendarView from './pages/CalendarView';
import JobDetail from './pages/JobDetail';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import LevelProgress from './pages/LevelProgress';
import Notifications from './pages/Notifications';
import PointManagement from './pages/PointManagement';

const ContractorApp: React.FC = () => {
  return (
    <ContractorLayout>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/jobs" element={<JobList />} />
          <Route path="/my-jobs" element={<MyJobs />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/jobs/:jobId" element={<JobDetail />} />
          <Route path="/chat/:jobId" element={<Chat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/level" element={<LevelProgress />} />
          <Route path="/points" element={<PointManagement />} />
          <Route path="/notifications" element={<Notifications />} />
        </Routes>
      </Box>
    </ContractorLayout>
  );
};

export default ContractorApp;
