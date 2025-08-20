import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import ContractorLayout from './components/ContractorLayout';
import Dashboard from './pages/Dashboard';
import JobList from './pages/JobList';
import MyJobs from './pages/MyJobs';
import JobDetail from './pages/JobDetail';
import CalendarView from './pages/CalendarView';
import Chat from './pages/Chat';
import PointManagement from './pages/PointManagement';
import Profile from './pages/Profile';

const ContractorApp: React.FC = () => {
  return (
    <ContractorLayout>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/jobs" element={<JobList />} />
          <Route path="/jobs/:jobId" element={<JobDetail />} />
          <Route path="/my-jobs" element={<MyJobs />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:jobId" element={<Chat />} />
          <Route path="/points" element={<PointManagement />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Box>
    </ContractorLayout>
  );
};

export default ContractorApp;
