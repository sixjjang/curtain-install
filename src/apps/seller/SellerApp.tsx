import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import SellerLayout from './components/SellerLayout';
import Dashboard from './pages/Dashboard';
import JobManagement from './pages/JobManagement';
import ContractorList from './pages/ContractorList';
import PointCharge from './pages/PointCharge';
import PaymentSimulation from './pages/PaymentSimulation';
import PaymentComplete from './pages/PaymentComplete';
import PaymentFail from './pages/PaymentFail';
import Profile from './pages/Profile';

const SellerApp: React.FC = () => {
  return (
    <SellerLayout>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/jobs" element={<JobManagement />} />
          <Route path="/contractors" element={<ContractorList />} />
              <Route path="/points" element={<PointCharge />} />
    <Route path="/payment-simulation" element={<PaymentSimulation />} />
    <Route path="/payment-complete" element={<PaymentComplete />} />
    <Route path="/payment-fail" element={<PaymentFail />} />
    <Route path="/profile" element={<Profile />} />
        </Routes>
      </Box>
    </SellerLayout>
  );
};

export default SellerApp;
