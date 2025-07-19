import React from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { getRoleColors } from '../utils/roleColors';

const ApprovalNotice = () => {
  const { userProfile, isApproved, isPendingApproval, isProfileSetupCompleted, hasRole } = useAuth();

  // 승인된 사용자는 안내를 표시하지 않음
  if (isApproved()) {
    return null;
  }

  // 현재 사용자 역할에 따른 색상 가져오기
  const currentRole = userProfile?.primaryRole || userProfile?.role || 'seller';
  const roleColors = getRoleColors(currentRole);

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-lg font-medium text-yellow-800">
            서비스 이용을 위한 승인이 필요합니다
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            {!isProfileSetupCompleted() ? (
              <div>
                <p className="mb-3">
                  역할에 맞는 회원정보를 입력하고 관리자 승인을 받아야 서비스를 이용할 수 있습니다.
                </p>
                <Link 
                  href="/profile-setup"
                  className={`inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${roleColors.button}`}
                >
                  회원정보 입력하기
                </Link>
              </div>
            ) : isPendingApproval() ? (
              <div>
                <p className="mb-3">
                  회원정보가 제출되어 관리자 승인을 기다리고 있습니다. 승인 후 서비스를 이용할 수 있습니다.
                </p>
                <div className="text-xs text-yellow-600">
                  승인은 보통 1-2일 내에 완료됩니다.
                </div>
              </div>
            ) : (
              <div>
                <p className="mb-3">
                  회원정보 입력이 필요합니다. 역할에 맞는 정보를 입력해주세요.
                </p>
                <Link 
                  href="/profile-setup"
                  className={`inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${roleColors.button}`}
                >
                  회원정보 입력하기
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalNotice; 