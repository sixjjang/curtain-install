import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const RoleSwitcher = ({ onRoleChange }) => {
  const { userData, updateUserProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const roles = [
    { 
      id: 'seller', 
      name: '판매자', 
      icon: '🛍️',
      color: 'bg-green-100 text-green-800 border-green-200',
      hoverColor: 'hover:bg-green-50',
      description: '커튼 판매 및 작업 관리'
    },
    { 
      id: 'contractor', 
      name: '시공기사', 
      icon: '👷',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      hoverColor: 'hover:bg-purple-50',
      description: '커튼 설치 작업 수행'
    },

  ];

  const currentRole = userData?.primaryRole || userData?.role || 'customer';
  const userRoles = userData?.roles || [currentRole];

  const handleRoleSwitch = async (newRole) => {
    if (newRole === currentRole) {
      setIsOpen(false);
      return;
    }

    if (!userRoles.includes(newRole)) {
      alert('해당 역할에 대한 권한이 없습니다.');
      return;
    }

    // 역할 변경 방지
    alert('역할은 가입 시 설정되며 변경할 수 없습니다. 다른 역할로 전환하려면 관리자에게 문의하세요.');
    setIsOpen(false);
    return;

    // 아래 코드는 비활성화됨
    /*
    setLoading(true);
    try {
      await updateUserProfile({
        primaryRole: newRole
      });
      
      if (onRoleChange) {
        onRoleChange(newRole);
      }
      
      setIsOpen(false);
    } catch (error) {
      console.error('역할 전환 오류:', error);
      alert('역할 전환 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
    */
  };

  const getCurrentRoleInfo = () => {
    return roles.find(r => r.id === currentRole) || roles[0];
  };

  if (!userData || userRoles.length <= 1) {
    return null; // 역할이 하나뿐이면 표시하지 않음
  }

  const currentRoleInfo = getCurrentRoleInfo();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className={`flex items-center space-x-2 px-3 py-2 bg-white border rounded-lg transition-all duration-200 disabled:opacity-50 ${currentRoleInfo.color} ${currentRoleInfo.hoverColor} shadow-sm hover:shadow-md`}
      >
        <span className="text-lg">{currentRoleInfo.icon}</span>
        <span className="font-medium">{currentRoleInfo.name}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          <div className="p-3">
            <div className="text-xs font-medium text-gray-500 mb-3 px-2">역할 전환</div>
            {userRoles.map((roleId) => {
              const role = roles.find(r => r.id === roleId);
              const isCurrent = roleId === currentRole;
              
              return (
                <button
                  key={roleId}
                  onClick={() => handleRoleSwitch(roleId)}
                  disabled={loading || isCurrent}
                  className={`w-full flex items-start space-x-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ${
                    isCurrent 
                      ? `${role.color} cursor-default shadow-sm` 
                      : `hover:bg-gray-50 text-gray-700 hover:shadow-sm`
                  } disabled:opacity-50`}
                >
                  <span className="text-xl mt-0.5">{role.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{role.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{role.description}</div>
                    {isCurrent && (
                      <div className="text-xs font-medium text-green-600 mt-1">현재 선택됨</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 배경 클릭 시 닫기 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default RoleSwitcher; 