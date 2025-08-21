import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, ApprovalStatus } from '../../types';
import { CircularProgress, Box, Alert, Typography, Button } from '@mui/material';
import { CheckCircle, Warning, Block } from '@mui/icons-material';

interface ApprovalStatusAwareRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  allowedApprovalStatuses?: ApprovalStatus[];
}

const ApprovalStatusAwareRoute: React.FC<ApprovalStatusAwareRouteProps> = ({ 
  children, 
  allowedRoles,
  allowedApprovalStatuses = ['approved'] // 기본적으로 승인된 사용자만 접근 가능
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log('ApprovalStatusAwareRoute - 사용자 정보:', user);
  console.log('ApprovalStatusAwareRoute - 사용자 승인 상태:', user?.approvalStatus);
  console.log('ApprovalStatusAwareRoute - 사용자 객체 전체:', JSON.stringify(user, null, 2));
  console.log('ApprovalStatusAwareRoute - 허용된 역할:', allowedRoles);
  console.log('ApprovalStatusAwareRoute - 허용된 승인 상태:', allowedApprovalStatuses);
  console.log('ApprovalStatusAwareRoute - 현재 경로:', location.pathname);

  if (loading) {
    console.log('ApprovalStatusAwareRoute - 로딩 중...');
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
    console.log('ApprovalStatusAwareRoute - 사용자가 없음, 로그인 페이지로 이동');
    return <Navigate to="/login" replace />;
  }

  // 역할 확인
  if (!allowedRoles.includes(user.role)) {
    console.log(`ApprovalStatusAwareRoute - 권한 없음. 사용자 역할: ${user.role}, 허용된 역할: ${allowedRoles}`);
    // 권한이 없는 경우 해당 역할의 대시보드로 리다이렉트
    const roleRoutes: { [key in UserRole]: string } = {
      seller: '/seller',
      contractor: '/contractor',
      admin: '/admin',
      customer: '/login'
    };
    
    const targetRoute = roleRoutes[user.role];
    console.log(`ApprovalStatusAwareRoute - ${targetRoute}로 리다이렉트`);
    return <Navigate to={targetRoute} replace />;
  }

  // 승인 상태 확인
  console.log(`ApprovalStatusAwareRoute - 승인 상태 확인: ${user.approvalStatus}, 허용된 상태: ${allowedApprovalStatuses}`);
  
  if (!allowedApprovalStatuses.includes(user.approvalStatus)) {
    console.log(`ApprovalStatusAwareRoute - 승인 상태 제한. 사용자 승인 상태: ${user.approvalStatus}, 허용된 상태: ${allowedApprovalStatuses}`);
    
    // 승인 대기 상태인 경우
    if (user.approvalStatus === 'pending') {
      // 프로필 페이지는 접근 허용
      if (location.pathname.includes('/profile')) {
        console.log('ApprovalStatusAwareRoute - 승인 대기 중이지만 프로필 페이지 접근 허용');
        return <>{children}</>;
      }
      
      // 다른 페이지는 승인 대기 안내 페이지로 리다이렉트
      console.log('ApprovalStatusAwareRoute - 승인 대기 중, 승인 대기 안내 페이지로 리다이렉트');
      return <Navigate to="/pending-approval" replace />;
    }
    
    // 승인 거부된 경우
    if (user.approvalStatus === 'rejected') {
      console.log('ApprovalStatusAwareRoute - 승인 거부됨, 거부 안내 페이지로 리다이렉트');
      return <Navigate to="/rejected" replace />;
    }
  }

  console.log('ApprovalStatusAwareRoute - 접근 허용');
  console.log('ApprovalStatusAwareRoute - children 렌더링 시작:', children);
  
  return <>{children}</>;
};

export default ApprovalStatusAwareRoute;
