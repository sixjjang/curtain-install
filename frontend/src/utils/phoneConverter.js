/**
 * 고객 전화번호를 070으로 변환하는 함수 (개선된 버전)
 * @param {string} customerPhone - 고객 전화번호
 * @returns {string} 070으로 변환된 전화번호
 */
export const convertTo070 = (customerPhone) => {
  if (!customerPhone) return '';
  
  // 전화번호에서 숫자만 추출
  const numbers = customerPhone.replace(/[^0-9]/g, '');
  
  // 실제 임시번호 생성 (개인정보 보호)
  const generateTempNumber = () => {
    // 070-9xxx-xxxx 형태로 생성 (실제 사용 가능한 번호)
    const middle = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
    const last = Math.floor(Math.random() * 9000) + 1000;   // 1000-9999
    return `070-${middle}-${last}`;
  };
  
  // 전화번호 길이에 따른 변환 로직
  if (numbers.length === 11) {
    // 010-1234-5678 형태
    const prefix = numbers.substring(0, 3);
    
    if (prefix === '010' || prefix === '011' || prefix === '016' || prefix === '017' || prefix === '018' || prefix === '019') {
      // 실제 임시번호 생성 (개인정보 보호)
      return generateTempNumber();
    }
  } else if (numbers.length === 10) {
    // 02-1234-5678 형태
    const prefix = numbers.substring(0, 2);
    
    if (prefix === '02') {
      // 실제 임시번호 생성 (개인정보 보호)
      return generateTempNumber();
    }
  }
  
  // 기본 변환 (실제 임시번호 생성)
  if (numbers.length >= 8) {
    return generateTempNumber();
  }
  
  // 변환할 수 없는 경우 임시번호 생성
  return generateTempNumber();
};

/**
 * 전화번호 형식 검증 함수
 * @param {string} phone - 검증할 전화번호
 * @returns {boolean} 유효한 전화번호 여부
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  
  // 전화번호에서 숫자만 추출
  const numbers = phone.replace(/[^0-9]/g, '');
  
  // 한국 전화번호 형식 검증
  const patterns = [
    /^01[0-9]\d{7,8}$/, // 휴대폰: 010-1234-5678, 011-123-4567
    /^02\d{7,8}$/,      // 서울: 02-1234-5678
    /^0[3-9]\d{7,8}$/,  // 지역번호: 031-123-4567
    /^070\d{7,8}$/,     // 070: 070-1234-5678
    /^080\d{7,8}$/,     // 080: 080-1234-5678
    /^1588\d{4}$/,      // 1588: 1588-1234
    /^1666\d{4}$/,      // 1666: 1666-1234
    /^1644\d{4}$/,      // 1644: 1644-1234
    /^1600\d{4}$/,      // 1600: 1600-1234
    /^1577\d{4}$/,      // 1577: 1577-1234
    /^1544\d{4}$/,      // 1544: 1544-1234
    /^1522\d{4}$/,      // 1522: 1522-1234
    /^1500\d{4}$/,      // 1500: 1500-1234
    /^1444\d{4}$/,      // 1444: 1444-1234
    /^1330\d{4}$/,      // 1330: 1330-1234
    /^1300\d{4}$/,      // 1300: 1300-1234
    /^120\d{4}$/,       // 120: 120-1234
    /^119$/,            // 119
    /^112$/,            // 112
    /^110$/,            // 110
    /^114$/,            // 114
    /^113$/,            // 113
    /^115$/,            // 115
    /^116$/,            // 116
    /^117$/,            // 117
    /^118$/,            // 118
    /^121$/,            // 121
    /^122$/,            // 122
    /^123$/,            // 123
    /^124$/,            // 124
    /^125$/,            // 125
    /^126$/,            // 126
    /^127$/,            // 127
    /^128$/,            // 128
    /^129$/,            // 129
    /^131$/,            // 131
    /^132$/,            // 132
    /^134$/,            // 134
    /^135$/,            // 135
    /^136$/,            // 136
    /^137$/,            // 137
    /^138$/,            // 138
    /^139$/,            // 139
    /^140$/,            // 140
    /^141$/,            // 141
    /^142$/,            // 142
    /^143$/,            // 143
    /^144$/,            // 144
    /^145$/,            // 145
    /^146$/,            // 146
    /^147$/,            // 147
    /^148$/,            // 148
    /^149$/,            // 149
    /^150$/,            // 150
    /^151$/,            // 151
    /^152$/,            // 152
    /^153$/,            // 153
    /^154$/,            // 154
    /^155$/,            // 155
    /^156$/,            // 156
    /^157$/,            // 157
    /^158$/,            // 158
    /^159$/,            // 159
    /^160$/,            // 160
    /^161$/,            // 161
    /^162$/,            // 162
    /^163$/,            // 163
    /^164$/,            // 164
    /^165$/,            // 165
    /^166$/,            // 166
    /^167$/,            // 167
    /^168$/,            // 168
    /^169$/,            // 169
    /^170$/,            // 170
    /^171$/,            // 171
    /^172$/,            // 172
    /^173$/,            // 173
    /^174$/,            // 174
    /^175$/,            // 175
    /^176$/,            // 176
    /^177$/,            // 177
    /^178$/,            // 178
    /^179$/,            // 179
    /^180$/,            // 180
    /^181$/,            // 181
    /^182$/,            // 182
    /^183$/,            // 183
    /^184$/,            // 184
    /^185$/,            // 185
    /^186$/,            // 186
    /^187$/,            // 187
    /^188$/,            // 188
    /^189$/,            // 189
    /^190$/,            // 190
    /^191$/,            // 191
    /^192$/,            // 192
    /^193$/,            // 193
    /^194$/,            // 194
    /^195$/,            // 195
    /^196$/,            // 196
    /^197$/,            // 197
    /^198$/,            // 198
    /^199$/,            // 199
  ];
  
  return patterns.some(pattern => pattern.test(numbers));
};

/**
 * 전화번호 형식화 함수
 * @param {string} phone - 형식화할 전화번호
 * @returns {string} 형식화된 전화번호
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  
  const numbers = phone.replace(/[^0-9]/g, '');
  
  if (numbers.length === 11) {
    const prefix = numbers.substring(0, 3);
    const middle = numbers.substring(3, 7);
    const last = numbers.substring(7);
    return `${prefix}-${middle}-${last}`;
  } else if (numbers.length === 10) {
    const prefix = numbers.substring(0, 2);
    const middle = numbers.substring(2, 6);
    const last = numbers.substring(6);
    return `${prefix}-${middle}-${last}`;
  } else if (numbers.length === 8) {
    const middle = numbers.substring(0, 4);
    const last = numbers.substring(4);
    return `${middle}-${last}`;
  }
  
  return phone;
};

/**
 * 전화걸기 함수
 * @param {string} phoneNumber - 전화번호
 * @param {string} displayName - 표시할 이름 (선택사항)
 */
export const makePhoneCall = (phoneNumber, displayName = '') => {
  if (!phoneNumber) {
    alert('전화번호가 없습니다.');
    return;
  }
  
  // 전화번호에서 숫자만 추출
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  
  // tel: 프로토콜로 전화걸기
  const telUrl = `tel:${cleanNumber}`;
  
  try {
    // 모바일에서는 전화 앱이 열리고, 데스크톱에서는 알림
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      // 모바일 환경
      window.location.href = telUrl;
    } else {
      // 데스크톱 환경
      const message = displayName 
        ? `${displayName}(${phoneNumber})에게 전화를 걸까요?`
        : `${phoneNumber}로 전화를 걸까요?`;
      
      if (confirm(message)) {
        window.open(telUrl, '_blank');
      }
    }
  } catch (error) {
    console.error('전화걸기 실패:', error);
    alert('전화걸기에 실패했습니다.');
  }
};

/**
 * SMS 발송 함수
 * @param {string} phoneNumber - 전화번호
 * @param {string} message - 메시지 내용 (선택사항)
 */
export const sendSMS = (phoneNumber, message = '') => {
  if (!phoneNumber) {
    alert('전화번호가 없습니다.');
    return;
  }
  
  // 전화번호에서 숫자만 추출
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  
  // SMS 프로토콜로 메시지 발송
  const smsUrl = message 
    ? `sms:${cleanNumber}?body=${encodeURIComponent(message)}`
    : `sms:${cleanNumber}`;
  
  try {
    window.location.href = smsUrl;
  } catch (error) {
    console.error('SMS 발송 실패:', error);
    alert('SMS 발송에 실패했습니다.');
  }
};

/**
 * 전화번호 마스킹 함수 (개인정보 보호)
 * @param {string} phone - 전화번호
 * @returns {string} 마스킹된 전화번호
 */
export const maskPhoneNumber = (phone) => {
  if (!phone) return '';
  
  const numbers = phone.replace(/[^0-9]/g, '');
  
  if (numbers.length === 11) {
    // 010-1234-5678 → 010-****-5678
    return `${numbers.substring(0, 3)}-****-${numbers.substring(7)}`;
  } else if (numbers.length === 10) {
    // 02-1234-5678 → 02-****-5678
    return `${numbers.substring(0, 2)}-****-${numbers.substring(6)}`;
  } else if (numbers.length >= 8) {
    // 070-1234-5678 → 070-****-5678
    return `${numbers.substring(0, 3)}-****-${numbers.substring(7)}`;
  }
  
  return phone;
}; 