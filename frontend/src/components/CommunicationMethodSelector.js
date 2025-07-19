import React, { useState } from 'react';
import { getCommunicationGuide, COMMUNICATION_TYPES } from '../utils/communicationSystem';

export default function CommunicationMethodSelector({ 
  selectedMethod, 
  onMethodChange, 
  showGuide = true 
}) {
  const [showDetails, setShowDetails] = useState(false);

  const methods = [
    {
      id: COMMUNICATION_TYPES.IN_APP_CHAT,
      name: '앱 내 채팅',
      icon: '💬',
      description: '앱에서 직접 소통',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    {
      id: COMMUNICATION_TYPES.ANONYMOUS_PHONE,
      name: '익명 전화번호',
      icon: '📞',
      description: '임시 번호로 연락',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    },
    {
      id: COMMUNICATION_TYPES.KAKAO_TALK,
      name: '카카오톡 연동',
      icon: '💛',
      description: '카카오톡으로 소통',
      color: 'bg-yellow-500',
      hoverColor: 'hover:bg-yellow-600'
    }
  ];

  const handleMethodSelect = (methodId) => {
    onMethodChange(methodId);
  };

  const selectedGuide = getCommunicationGuide(selectedMethod);

  return (
    <div className="space-y-4">
      {/* 통신 방법 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          선호하는 소통 방법
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {methods.map((method) => (
            <button
              key={method.id}
              onClick={() => handleMethodSelect(method.id)}
              className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                selectedMethod === method.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 ${method.color} ${method.hoverColor} rounded-full flex items-center justify-center text-white text-lg`}>
                  {method.icon}
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">{method.name}</div>
                  <div className="text-sm text-gray-600">{method.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 선택된 방법 상세 안내 */}
      {showGuide && selectedMethod && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">{selectedGuide.title}</h4>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              {showDetails ? '간단히 보기' : '자세히 보기'}
            </button>
          </div>
          
          <p className="text-gray-600 text-sm mb-3">{selectedGuide.description}</p>
          
          {showDetails && (
            <div className="space-y-2">
              <h5 className="font-medium text-gray-900 text-sm">주요 특징:</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                {selectedGuide.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 보안 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="text-blue-500 text-lg">🔒</div>
          <div>
            <h4 className="font-medium text-blue-900 text-sm">개인정보 보호</h4>
            <p className="text-blue-800 text-sm mt-1">
              모든 소통 방법은 고객의 개인정보를 보호하도록 설계되었습니다. 
              실제 전화번호나 개인정보는 노출되지 않습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 