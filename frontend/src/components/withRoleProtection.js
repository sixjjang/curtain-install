import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { validatePageAccess, hasPageAccess, getDefaultRedirectPage } from '../utils/pagePermissions';

// 역할별 페이지 보호 HOC
export const withRoleProtection = (WrappedComponent, allowedRoles = []) => {
  return function ProtectedComponent(props) {
    const router = useRouter();
    const { user, userProfile, loading, hasRole, isApproved } = useAuth();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
      const checkAccess = async () => {
        if (loading) return;

        // 로그인 확인
        if (!user) {
          router.push('/login');
          return;
        }

        // 승인 상태 확인 (관리자 제외)
        if (!hasRole('admin') && !isApproved()) {
          router.push('/profile-setup');
          return;
        }

        // 현재 사용자 역할 확인
        const currentRole = userProfile?.primaryRole || userProfile?.role;
        
        if (!currentRole) {
          router.push('/login');
          return;
        }

        // 페이지 접근 권한 확인
        const hasAccess = hasPageAccess(router.pathname, currentRole);
        
        if (!hasAccess) {
          // 허용되지 않은 페이지 접근 시 기본 페이지로 리다이렉트
          const defaultPage = getDefaultRedirectPage(currentRole);
          router.push(defaultPage);
          return;
        }

        // 특정 역할만 허용하는 경우 추가 확인
        if (allowedRoles.length > 0 && !allowedRoles.includes(currentRole)) {
          const defaultPage = getDefaultRedirectPage(currentRole);
          router.push(defaultPage);
          return;
        }

        setIsAuthorized(true);
        setIsChecking(false);
      };

      checkAccess();
    }, [user, userProfile, loading, router.pathname, hasRole, isApproved]);

    // 로딩 중이거나 권한 확인 중
    if (loading || isChecking) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">권한 확인 중...</p>
          </div>
        </div>
      );
    }

    // 권한이 없는 경우
    if (!isAuthorized) {
      return null;
    }

    // 권한이 있는 경우 원본 컴포넌트 렌더링
    return <WrappedComponent {...props} />;
  };
};

// 역할별 페이지 보호 (간단한 버전)
export const withSimpleRoleProtection = (WrappedComponent, allowedRoles = []) => {
  return function ProtectedComponent(props) {
    const router = useRouter();
    const { user, userProfile, loading, hasRole } = useAuth();

    useEffect(() => {
      if (loading) return;

      if (!user) {
        router.push('/login');
        return;
      }

      const currentRole = userProfile?.primaryRole || userProfile?.role;
      
      if (allowedRoles.length > 0 && !allowedRoles.includes(currentRole)) {
        const defaultPage = getDefaultRedirectPage(currentRole);
        router.push(defaultPage);
        return;
      }
    }, [user, userProfile, loading, allowedRoles, router]);

    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
};

 