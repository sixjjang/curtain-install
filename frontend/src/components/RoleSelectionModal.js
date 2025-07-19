import React, { useState } from 'react';

export default function RoleSelectionModal({ isOpen, onClose, onRoleSelect, user }) {
  const [selectedRole, setSelectedRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const roles = [
    {
      id: 'seller',
      title: '판매자',
      subtitle: '커튼/블라인드 전문 판매업체',
      description: '전문 시공기사와 연결하여 고객에게 완벽한 설치 서비스를 제공하세요',
      icon: '🏢',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      features: [
        '전문 시공기사 매칭',
        '실시간 작업 현황',
        '고객 만족도 관리',
        '매출 증대'
      ]
    },
    {
      id: 'contractor',
      title: '시공자',
      subtitle: '설치 전문가',
      description: '안정적인 수익과 전문성을 인정받는 설치 전문가가 되세요',
      icon: '👷',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      features: [
        '안정적인 수익',
        '전문성 인정',
        '스케줄 관리',
        '고객 리뷰'
      ]
    }
  ];

  const handleRoleSelect = async (role) => {
    if (!role) return;
    
    setIsLoading(true);
    try {
      await onRoleSelect(role);
    } catch (error) {
      console.error('역할 선택 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  역할을 선택해주세요
                </h2>
                <p className="text-gray-600 mt-1">
                  어떤 역할로 Insteam을 이용하시겠습니까?
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className={`relative p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-lg ${
                    selectedRole === role.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedRole(role.id)}
                >
                  {/* Selection Indicator */}
                  {selectedRole === role.id && (
                    <div className="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}

                  {/* Role Icon */}
                  <div className={`w-16 h-16 bg-gradient-to-r ${role.color} rounded-xl flex items-center justify-center mb-4`}>
                    <span className="text-2xl text-white">{role.icon}</span>
                  </div>

                  {/* Role Info */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {role.title}
                    </h3>
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      {role.subtitle}
                    </p>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {role.description}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    {role.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">
                    역할 선택 후 프로필 설정이 필요합니다
                  </h4>
                  <p className="text-sm text-blue-700">
                    선택한 역할에 맞는 상세 정보를 입력하여 승인을 받으시면 서비스를 이용하실 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors duration-200"
              >
                취소
              </button>
              <button
                onClick={() => handleRoleSelect(selectedRole)}
                disabled={!selectedRole || isLoading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    처리 중...
                  </div>
                ) : (
                  '역할 선택 완료'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 