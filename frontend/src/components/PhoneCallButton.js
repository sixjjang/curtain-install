import React, { useState } from 'react';
import { makePhoneCall, sendSMS, maskPhoneNumber } from '../utils/phoneConverter';

const PhoneCallButton = ({ 
  phoneNumber, 
  displayName = '', 
  showSMS = true, 
  showMasked = false,
  className = '',
  size = 'medium' // 'small', 'medium', 'large'
}) => {
  const [showOptions, setShowOptions] = useState(false);

  if (!phoneNumber) {
    return null;
  }

  const handlePhoneCall = () => {
    makePhoneCall(phoneNumber, displayName);
  };

  const handleSMS = () => {
    const message = displayName 
      ? `${displayName}님, 안녕하세요. 커튼 설치 관련 문의드립니다.`
      : '안녕하세요. 커튼 설치 관련 문의드립니다.';
    sendSMS(phoneNumber, message);
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'px-2 py-1 text-xs';
      case 'large':
        return 'px-4 py-3 text-lg';
      default:
        return 'px-3 py-2 text-sm';
    }
  };

  const displayPhone = showMasked ? maskPhoneNumber(phoneNumber) : phoneNumber;

  return (
    <div className={`relative inline-block ${className}`}>
      {/* 메인 전화걸기 버튼 */}
      <button
        onClick={handlePhoneCall}
        className={`bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center ${getSizeClasses()}`}
        title={`${displayName || '고객'}에게 전화걸기`}
      >
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
        </svg>
        전화걸기
      </button>

      {/* SMS 버튼 (옵션) */}
      {showSMS && (
        <button
          onClick={handleSMS}
          className={`ml-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center ${getSizeClasses()}`}
          title="SMS 발송"
        >
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
          SMS
        </button>
      )}

      {/* 전화번호 표시 */}
      <div className="mt-1 text-xs text-gray-600">
        {displayPhone}
        {showMasked && (
          <span className="ml-1 text-blue-600">(마스킹됨)</span>
        )}
      </div>
    </div>
  );
};

export default PhoneCallButton; 