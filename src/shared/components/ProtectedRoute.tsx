import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../../types';
import { CircularProgress, Box } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  console.log('ProtectedRoute - 사용자 정보:', user);
  console.log('ProtectedRoute - 허용된 역할:', allowedRoles);
  console.log('ProtectedRoute - 로딩 상태:', loading);

  if (loading) {
    console.log('ProtectedRoute - 로딩 중...');
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    console.log('ProtectedRoute - 사용자가 없음, 로그인 페이지로 이동');
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    console.log(`ProtectedRoute - 권한 없음. 사용자 역할: ${user.role}, 허용된 역할: ${allowedRoles}`);
    // 권한이 없는 경우 해당 역할의 대시보드로 리다이렉트
    const roleRoutes: { [key in UserRole]: string } = {
      seller: '/seller',
      contractor: '/contractor',
      admin: '/admin',
      customer: '/login'
    };
    
    const targetRoute = roleRoutes[user.role];
    console.log(`ProtectedRoute - ${targetRoute}로 리다이렉트`);
    return <Navigate to={targetRoute} replace />;
  }

  console.log('ProtectedRoute - 접근 허용');
  return <>{children}</>;
};

export default ProtectedRoute;
